const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const rejectSharedWrites = require('../middleware/rejectSharedWrites');

const router = express.Router();

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
  return result.rows[0] && result.rows[0].user_id === userId;
}

async function touchDocument(documentId) {
  await db.query('UPDATE documents SET updated_at = NOW() WHERE id = $1', [documentId]);
}

router.post('/', async (req, res) => {
  try {
    const { document_id, type, content, order_index, parent_id } = req.body;
    
    const isOwner = await verifyDocumentOwnership(document_id, req.user.id);
    if (!isOwner) return res.status(403).json({ error: 'Forbidden' });

    const result = await db.query(
      'INSERT INTO blocks (document_id, type, content, order_index, parent_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [document_id, type || 'paragraph', content || {}, order_index, parent_id || null]
    );

    await touchDocument(document_id);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/reorder', async (req, res) => {
  try {
    const { updates } = req.body; // [{ id, order_index }]
    if (!updates || updates.length === 0) return res.json({ success: true });

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
    res.json({ success: true });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const blockData = await assertBlockBelongsToUser(req.params.id, req.user.id, res);
    if (!blockData) return;

    const { type, content, order_index } = req.body;
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

    if (updates.length === 0) return res.json({});

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
