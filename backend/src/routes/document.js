const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const shareTokenMiddleware = require('../middleware/shareToken');
const rejectSharedWrites = require('../middleware/rejectSharedWrites');

const router = express.Router();

function validateBlockContent(content) {
  if (content && typeof content === 'object') {
    if (content.text && typeof content.text === 'string' && content.text.length > 50000) {
      return 'Content text too long';
    }
    if (content.url && typeof content.url === 'string' && content.url.length > 2000) {
      return 'Image URL too long';
    }
  }
  return null;
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
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
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
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    await db.query('BEGIN');
    const docResult = await db.query(
      'INSERT INTO documents (user_id, title) VALUES ($1, $2) RETURNING *',
      [req.user.id, 'Untitled']
    );
    const document = docResult.rows[0];

    const blockResult = await db.query(
      'INSERT INTO blocks (document_id, type, content, order_index) VALUES ($1, $2, $3, $4) RETURNING *',
      [document.id, 'paragraph', {}, 1.0]
    );

    await db.query('COMMIT');
    res.json(document);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
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
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    await assertOwnership(req.params.id, req.user.id);

    const { title, is_public, blocks, lastKnownUpdatedAt } = req.body;

    try {
      await db.query('BEGIN');
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
      if (blocks && Array.isArray(blocks)) {
        for (const b of blocks) {
          const error = validateBlockContent(b.content);
          if (error) {
            await db.query('ROLLBACK');
            return res.status(422).json({ error: `Block ${b.id}: ${error}` });
          }
        }

        for (const b of blocks) {
          await db.query(
            'UPDATE blocks SET content = $1, type = $2, order_index = $3 WHERE id = $4 AND document_id = $5',
            [b.content, b.type, b.order_index, b.id, req.params.id]
          );
        }
        await db.query('UPDATE documents SET updated_at = NOW() WHERE id = $1', [req.params.id]);
      }

      await db.query('COMMIT');
      
      const docResult = await db.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
      res.json(docResult.rows[0]);
    } catch (err) {
      await db.query('ROLLBACK');
      throw err; // Caught by the global error handler
    }
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await assertOwnership(req.params.id, req.user.id);

    await db.query('DELETE FROM documents WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
});

router.post('/:id/share', async (req, res) => {
  try {
    await assertOwnership(req.params.id, req.user.id);

    const shareToken = crypto.randomBytes(16).toString('hex');
    await db.query(
      'UPDATE documents SET share_token = $1, is_public = true WHERE id = $2',
      [shareToken, req.params.id]
    );

    res.json({ shareUrl: '/share/' + shareToken });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
});

router.delete('/:id/share', async (req, res) => {
  try {
    await assertOwnership(req.params.id, req.user.id);

    await db.query(
      'UPDATE documents SET share_token = NULL, is_public = false WHERE id = $1',
      [req.params.id]
    );

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
});

module.exports = {
  documentsRouter: router,
  shareRouter: shareRouter,
};
