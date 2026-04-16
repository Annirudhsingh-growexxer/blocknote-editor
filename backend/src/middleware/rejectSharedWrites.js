function rejectSharedWrites(req, res, next) {
  const shareToken =
    req.headers['x-share-token'] ||
    req.headers['x-shareToken'] ||
    req.query?.token ||
    req.params?.token ||
    req.body?.token;

  if (shareToken && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    return res.status(403).json({
      error: 'Read-only access: write operations are not permitted via share token',
    });
  }

  next();
}

module.exports = rejectSharedWrites;
