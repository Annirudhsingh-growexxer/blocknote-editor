const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const shareTokenMiddleware = require('../middleware/shareToken');
const rejectSharedWrites = require('../middleware/rejectSharedWrites');
const { validateBlockContent, validateBlockType } = require('../lib/validators');

const router = express.Router();

const ALLOWED_BLOCK_TYPES = new Set([
  'paragraph',
  'heading_1',
  'heading_2',
  'todo',
  'code',
  'divider',
  'image',
]);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_TITLE_LENGTH = 500;

function isUuid(value) {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

function sendError(res, err, fallbackStatus = 500) {
  if (err && typeof err.status === 'number' && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: err.message || 'Request failed' });
  }
  return res.status(fallbackStatus).json({ error: 'Internal server error' });
}



async function assertOwnership(docId, userId) {
  const result = await db.query(
    'SELECT user_id FROM documents WHERE id = $1', [docId]
  );
  if (!result.rows[0]) {
    const err = new Error('Document not found');
    err.status = 404;
    throw err;
  }
  if (result.rows[0].user_id !== userId) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
}

// Global router for share
const shareRouter = express.Router();
shareRouter.get('/:token', shareTokenMiddleware, async (req, res) => {
  try {
    const document = req.sharedDocument;
    const blocksResult = await db.query(
      'SELECT * FROM blocks WHERE document_id = $1 ORDER BY order_index ASC',
      [document.id]
    );
    res.json({ document, blocks: blocksResult.rows });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// Use auth middleware for typical routes
router.use(rejectSharedWrites);
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, title, is_public, updated_at FROM documents WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

router.post('/', async (req, res) => {
  let transactionStarted = false;
  try {
    await db.query('BEGIN');
    transactionStarted = true;
    const docResult = await db.query(
      'INSERT INTO documents (user_id, title) VALUES ($1, $2) RETURNING *',
      [req.user.id, 'Untitled']
    );
    const document = docResult.rows[0];

    await db.query(
      'INSERT INTO blocks (document_id, type, content, order_index) VALUES ($1, $2, $3, $4)',
      [document.id, 'paragraph', {}, 1.0]
    );

    await db.query('COMMIT');
    transactionStarted = false;
    res.status(201).json(document);
  } catch (err) {
    if (transactionStarted) {
      try { await db.query('ROLLBACK'); } catch (_) { /* ignore rollback errors */ }
    }
    console.error(err);
    sendError(res, err);
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(422).json({ error: 'Invalid document id' });
    }

    await assertOwnership(req.params.id, req.user.id);

    const docResult = await db.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    const document = docResult.rows[0];

    const blocksResult = await db.query(
      'SELECT * FROM blocks WHERE document_id = $1 ORDER BY order_index ASC',
      [req.params.id]
    );

    res.json({ document, blocks: blocksResult.rows });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

router.patch('/:id', async (req, res) => {
  let transactionStarted = false;
  try {
    if (!isUuid(req.params.id)) {
      return res.status(422).json({ error: 'Invalid document id' });
    }

    const body = req.body || {};
    const { title, is_public, blocks, lastKnownUpdatedAt } = body;

    if (title !== undefined) {
      if (typeof title !== 'string') {
        return res.status(422).json({ error: 'Invalid title' });
      }
      if (title.length === 0 || title.length > MAX_TITLE_LENGTH) {
        return res.status(422).json({
          error: `Title must be between 1 and ${MAX_TITLE_LENGTH} characters`,
        });
      }
    }

    if (is_public !== undefined && typeof is_public !== 'boolean') {
      return res.status(422).json({ error: 'Invalid is_public value' });
    }

    if (blocks !== undefined && !Array.isArray(blocks)) {
      return res.status(422).json({ error: 'blocks must be an array' });
    }

    if (lastKnownUpdatedAt !== undefined && lastKnownUpdatedAt !== null) {
      const parsed = new Date(lastKnownUpdatedAt);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(422).json({ error: 'Invalid lastKnownUpdatedAt' });
      }
    }

    if (title === undefined && is_public === undefined && blocks === undefined) {
      return res.status(400).json({ error: 'No updatable fields provided' });
    }

    await assertOwnership(req.params.id, req.user.id);

    await db.query('BEGIN');
    transactionStarted = true;
    const currentDocRes = await db.query(
      'SELECT updated_at FROM documents WHERE id = $1 FOR UPDATE',
      [req.params.id]
    );
    const currentUpdatedAt = currentDocRes.rows[0]?.updated_at;

    if (blocks && Array.isArray(blocks) && lastKnownUpdatedAt && currentUpdatedAt) {
      const clientTimestamp = new Date(lastKnownUpdatedAt);
      const serverTimestamp = new Date(currentUpdatedAt);
      if (!Number.isNaN(clientTimestamp.getTime()) && serverTimestamp > clientTimestamp) {
        await db.query('ROLLBACK');
        transactionStarted = false;
        return res.status(409).json({
          error: 'Document has changed in another session. Please reload.',
          updated_at: currentUpdatedAt,
        });
      }
    }

    let updates = [];
    let values = [];
    let idx = 1;

    if (title !== undefined) {
      updates.push(`title = $${idx++}`);
      values.push(title);
    }
    if (is_public !== undefined) {
      updates.push(`is_public = $${idx++}`);
      values.push(is_public);
    }

    if (updates.length > 0) {
      values.push(req.params.id);
      await db.query(
        `UPDATE documents SET ${updates.join(', ')} WHERE id = $${idx}`,
        values
      );
    }

    // Auto-Save block updates
    if (blocks && Array.isArray(blocks) && blocks.length > 0) {
      for (const b of blocks) {
        if (!b || typeof b !== 'object' || Array.isArray(b)) {
          await db.query('ROLLBACK');
          transactionStarted = false;
          return res.status(422).json({ error: 'Invalid block payload' });
        }

        if (!isUuid(b.id)) {
          await db.query('ROLLBACK');
          transactionStarted = false;
          return res.status(422).json({ error: 'Invalid block id' });
        }

        const blockType = b.type === undefined ? 'paragraph' : b.type;
        if (typeof blockType !== 'string') {
          await db.query('ROLLBACK');
          transactionStarted = false;
          return res.status(422).json({ error: `Block ${b.id}: Invalid block type` });
        }
        const typeError = validateBlockType(blockType);
        if (typeError) {
          await db.query('ROLLBACK');
          transactionStarted = false;
          return res.status(422).json({ error: `Block ${b.id}: ${typeError}` });
        }

        if (typeof b.order_index !== 'number' || !Number.isFinite(b.order_index)) {
          await db.query('ROLLBACK');
          transactionStarted = false;
          return res.status(422).json({ error: `Block ${b.id}: Invalid order_index` });
        }

        const error = validateBlockContent(b.content);
        if (error) {
          await db.query('ROLLBACK');
          transactionStarted = false;
          return res.status(422).json({ error: `Block ${b.id}: ${error}` });
        }
      }

      for (const b of blocks) {
        await db.query(
          'UPDATE blocks SET content = $1, type = $2, order_index = $3 WHERE id = $4 AND document_id = $5',
          [b.content || {}, b.type || 'paragraph', b.order_index, b.id, req.params.id]
        );
      }
      await db.query('UPDATE documents SET updated_at = NOW() WHERE id = $1', [req.params.id]);
    }

    await db.query('COMMIT');
    transactionStarted = false;

    const docResult = await db.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    res.json(docResult.rows[0]);
  } catch (err) {
    if (transactionStarted) {
      try { await db.query('ROLLBACK'); } catch (_) { /* ignore rollback errors */ }
    }
    console.error(err);
    sendError(res, err);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(422).json({ error: 'Invalid document id' });
    }

    await assertOwnership(req.params.id, req.user.id);

    await db.query('DELETE FROM documents WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

router.post('/:id/share', async (req, res) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(422).json({ error: 'Invalid document id' });
    }

    await assertOwnership(req.params.id, req.user.id);

    const shareToken = crypto.randomBytes(16).toString('hex');
    await db.query(
      'UPDATE documents SET share_token = $1, is_public = true WHERE id = $2',
      [shareToken, req.params.id]
    );

    res.status(201).json({ shareUrl: '/share/' + shareToken });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

router.delete('/:id/share', async (req, res) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(422).json({ error: 'Invalid document id' });
    }

    await assertOwnership(req.params.id, req.user.id);

    await db.query(
      'UPDATE documents SET share_token = NULL, is_public = false WHERE id = $1',
      [req.params.id]
    );

    res.status(204).send();
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

module.exports = {
  documentsRouter: router,
  shareRouter: shareRouter,
};
