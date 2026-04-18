const express = require('express');
const jwt = require('jsonwebtoken');
const { EMPLOYEE_ID, PASSWORD } = require('../config/auth.config');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * POST /api/auth/login
 * Validates demo credentials, returns JWT in httpOnly cookie.
 */
router.post('/login', (req, res) => {
  const { employee_id, password } = req.body;

  if (employee_id === EMPLOYEE_ID && password === PASSWORD) {
    const token = jwt.sign(
      { employee_id: EMPLOYEE_ID },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // set true in production
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });

    return res.json({ token, employee_id: EMPLOYEE_ID });
  }

  return res.status(401).json({ error: 'Authentication Failed' });
});

/**
 * POST /api/auth/logout
 * Clears the session cookie.
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out' });
});

/**
 * GET /api/auth/me
 * Returns current authenticated user from token.
 * Uses authMiddleware to validate JWT and set req.user.
 */
router.get('/me', authMiddleware, (req, res) => {
  return res.json({ employee_id: req.user.employee_id });
});

module.exports = router;
