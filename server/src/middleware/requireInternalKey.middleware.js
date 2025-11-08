module.exports = function requireInternalKey(req, res, next) {
  const key = req.header('x-internal-key') || req.query._internalKey || req.body._internalKey;
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    return res.status(403).json({ message: 'Forbidden: invalid internal key' });
  }
  next();
};
