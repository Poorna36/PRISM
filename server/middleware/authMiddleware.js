const jwt = require('jsonwebtoken');

/**
 * JWT validation middleware.
 * Applied to all routes except POST /api/auth/login.
 */
function authMiddleware(req, res, next) {
  // Skip auth for login endpoint
  if (req.path === '/api/auth/login' && req.method === 'POST') {
    return next();
  }

  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
