const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
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

function isUuid(value) {
  return typeof value === 'string' && UUID_REGEX.test(value);
}




router.use(rejectSharedWrites);
router.use(authMiddleware);

async function assertBlockBelongsToUser(blockId, userId, res) {
  const result = await db.query(`
    SELECT b.document_id, d.user_id 
    FROM blocks b
    JOIN documents d ON b.document_id = d.id
    WHERE b.id = $1
  `, [blockId]);
  
  if (!result.rows[0]) {
    res.status(404).json({ error: 'Block not found' });
    return null;
  }
  if (result.rows[0].user_id !== userId) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }
  return result.rows[0];
}

async function verifyDocumentOwnership(docId, userId) {
  const result = await db.query(
    'SELECT user_id FROM documents WHERE id = $1', [docId]
  );
  if (!result.rows[0]) return { found: false, owned: false };
  return { found: true, owned: result.rows[0].user_id === userId };
}

async function touchDocument(documentId) {
  await db.query('UPDATE documents SET updated_at = NOW() WHERE id = $1', [documentId]);
}

router.post('/', async (req, res) => {
  try {
    const { document_id, type, content, order_index, parent_id } = req.body || {};

    if (!isUuid(document_id)) {
      return res.status(422).json({ error: 'Invalid or missing document_id' });
    }

    const blockType = type === undefined ? 'paragraph' : type;
    if (typeof blockType !== 'string') {
      return res.status(422).json({ error: 'Invalid block type' });
    }
    const typeError = validateBlockType(blockType);
    if (typeError) return res.status(422).json({ error: typeError });

    if (typeof order_index !== 'number' || !Number.isFinite(order_index)) {
      return res.status(422).json({ error: 'Invalid order_index' });
    }

    if (parent_id !== undefined && parent_id !== null && !isUuid(parent_id)) {
      return res.status(422).json({ error: 'Invalid parent_id' });
    }

    const contentError = validateBlockContent(content);
    if (contentError) return res.status(422).json({ error: contentError });

    const { found, owned } = await verifyDocumentOwnership(document_id, req.user.id);
    if (!found) return res.status(404).json({ error: 'Document not found' });
    if (!owned) return res.status(403).json({ error: 'Forbidden' });

    const result = await db.query(
      'INSERT INTO blocks (document_id, type, content, order_index, parent_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [document_id, blockType, content || {}, order_index, parent_id || null]
    );

    await touchDocument(document_id);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/bulk', async (req, res) => {
  let transactionStarted = false;
  try {
    const { document_id, blocks } = req.body || {};

    if (!isUuid(document_id)) {
      return res.status(422).json({ error: 'Invalid or missing document_id' });
    }

    if (!Array.isArray(blocks) || blocks.length === 0) {
      return res.status(400).json({ error: 'blocks array is required' });
    }

    for (const block of blocks) {
      if (!block || typeof block !== 'object' || Array.isArray(block)) {
        return res.status(422).json({ error: 'Invalid block payload' });
      }

      const blockType = block.type === undefined ? 'paragraph' : block.type;
      if (typeof blockType !== 'string') {
        return res.status(422).json({ error: 'Invalid block type' });
      }
      const typeError = validateBlockType(blockType);
      if (typeError) return res.status(422).json({ error: typeError });

      if (typeof block.order_index !== 'number' || !Number.isFinite(block.order_index)) {
        return res.status(422).json({ error: 'Invalid order_index' });
      }

      if (
        block.parent_id !== undefined &&
        block.parent_id !== null &&
        !isUuid(block.parent_id)
      ) {
        return res.status(422).json({ error: 'Invalid parent_id' });
      }

      const contentError = validateBlockContent(block.content);
      if (contentError) return res.status(422).json({ error: contentError });
    }

    const { found, owned } = await verifyDocumentOwnership(document_id, req.user.id);
    if (!found) return res.status(404).json({ error: 'Document not found' });
    if (!owned) return res.status(403).json({ error: 'Forbidden' });

    await db.query('BEGIN');
    transactionStarted = true;
    const inserted = [];

    for (const block of blocks) {
      const blockType = block.type || 'paragraph';
      const result = await db.query(
        'INSERT INTO blocks (document_id, type, content, order_index, parent_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [
          document_id,
          blockType,
          block.content || {},
          block.order_index,
          block.parent_id || null,
        ]
      );
      inserted.push(result.rows[0]);
    }

    await touchDocument(document_id);
    await db.query('COMMIT');
    transactionStarted = false;

    res.status(201).json(inserted);
  } catch (err) {
    if (transactionStarted) {
      try { await db.query('ROLLBACK'); } catch (_) { /* ignore rollback errors */ }
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/reorder', async (req, res) => {
  let transactionStarted = false;
  try {
    const { updates } = (req.body || {}); // [{ id, order_index }]

    if (updates === undefined || updates === null) {
      return res.status(422).json({ error: 'updates array is required' });
    }
    if (!Array.isArray(updates)) {
      return res.status(422).json({ error: 'updates must be an array' });
    }
    if (updates.length === 0) return res.json({ success: true });

    for (const update of updates) {
      if (!update || typeof update !== 'object' || Array.isArray(update)) {
        return res.status(422).json({ error: 'Invalid update payload' });
      }
      if (!isUuid(update.id)) {
        return res.status(422).json({ error: 'Invalid block id' });
      }
      if (typeof update.order_index !== 'number' || !Number.isFinite(update.order_index)) {
        return res.status(422).json({ error: 'Invalid order_index' });
      }
    }

    // Validate ownership of all blocks first
    const ids = updates.map(u => u.id);
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    
    const blocksRes = await db.query(
      `SELECT b.id, b.document_id, d.user_id 
       FROM blocks b JOIN documents d ON b.document_id = d.id 
       WHERE b.id IN (${placeholders})`,
      ids
    );

    if (blocksRes.rows.length !== ids.length) {
       return res.status(404).json({ error: 'Some blocks not found' });
    }

    const docIds = new Set();
    for (const b of blocksRes.rows) {
      if (b.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      docIds.add(b.document_id);
    }

    await db.query('BEGIN');
    transactionStarted = true;

    for (const update of updates) {
      await db.query('UPDATE blocks SET order_index = $1 WHERE id = $2', [update.order_index, update.id]);
    }

    // Edge Case 6: Renormalization Check per document
    for (const documentId of docIds) {
      const allBlocks = await db.query(
        'SELECT id, order_index FROM blocks WHERE document_id = $1 ORDER BY order_index', [documentId]
      );
      const rows = allBlocks.rows;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i].order_index - rows[i-1].order_index < 0.001) {
          for (let j = 0; j < rows.length; j++) {
            await db.query(
              'UPDATE blocks SET order_index = $1 WHERE id = $2',
              [(j + 1) * 1.0, rows[j].id]
            );
          }
          break; // Done for this document
        }
      }

      await touchDocument(documentId);
    }

    await db.query('COMMIT');
    transactionStarted = false;
    res.json({ success: true });
  } catch (err) {
    if (transactionStarted) {
      try { await db.query('ROLLBACK'); } catch (_) { /* ignore rollback errors */ }
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(422).json({ error: 'Invalid block id' });
    }

    const blockData = await assertBlockBelongsToUser(req.params.id, req.user.id, res);
    if (!blockData) return;

    const { type, content, order_index } = req.body || {};

    if (type !== undefined) {
      if (typeof type !== 'string') {
        return res.status(422).json({ error: 'Invalid block type' });
      }
      const typeError = validateBlockType(type);
      if (typeError) return res.status(422).json({ error: typeError });
    }

    if (order_index !== undefined && (typeof order_index !== 'number' || !Number.isFinite(order_index))) {
      return res.status(422).json({ error: 'Invalid order_index' });
    }

    const contentError = validateBlockContent(content);
    if (contentError) return res.status(422).json({ error: contentError });

    let updates = [];

    let values = [];
    let idx = 1;

    if (type !== undefined) {
      updates.push(`type = $${idx++}`);
      values.push(type);
    }
    if (content !== undefined) {
      updates.push(`content = $${idx++}`);
      values.push(content);
    }
    if (order_index !== undefined) {
      updates.push(`order_index = $${idx++}`);
      values.push(order_index);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided' });
    }

    values.push(req.params.id);
    const result = await db.query(
      `UPDATE blocks SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    await touchDocument(blockData.document_id);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(422).json({ error: 'Invalid block id' });
    }

    const blockData = await assertBlockBelongsToUser(req.params.id, req.user.id, res);
    if (!blockData) return;

    await db.query('DELETE FROM blocks WHERE id = $1', [req.params.id]);
    await touchDocument(blockData.document_id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
