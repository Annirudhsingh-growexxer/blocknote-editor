const db = require('../db');

const shareTokenMiddleware = async (req, res, next) => {
  const token = req.headers['x-share-token'] || req.params.token;

  if (!token) {
    return res.status(403).json({ error: 'Missing share token' });
  }

  try {
    const result = await db.query('SELECT * FROM documents WHERE share_token = $1', [token]);
    const document = result.rows[0];

    if (!document || !document.is_public) {
      return res.status(403).json({ error: 'This document is not available' });
    }

    req.sharedDocument = document;

    // Read-only logic enforce at API level:
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
      return res.status(403).json({ error: 'Read-only access: write operations are not permitted via share token' });
    }

    next();
  } catch (err) {
    console.error('Share Token Middleware Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = shareTokenMiddleware;
