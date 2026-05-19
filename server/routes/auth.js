const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User } = require('../models');
const { EMPLOYEE_ID, PASSWORD } = require('../config/auth.config');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'prism-hackathon-secret-key-2026';

/**
 * POST /api/auth/register
 * Creates a new user account in the database.
 */
router.post('/register', async (req, res) => {
  const { employee_id, full_name, email, password } = req.body;

  if (!employee_id || !full_name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  // Block registering with the hardcoded admin ID
  if (employee_id === EMPLOYEE_ID) {
    return res.status(409).json({ error: 'Employee ID already taken.' });
  }

  try {
    const existing = await User.findOne({ where: { employee_id } });
    if (existing) {
      return res.status(409).json({ error: 'Employee ID already taken.' });
    }
    const emailExists = await User.findOne({ where: { email } });
    if (emailExists) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ employee_id, full_name, email, password_hash });

    const token = jwt.sign({ employee_id: user.employee_id }, JWT_SECRET, { expiresIn: '8h' });
    res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 });

    return res.status(201).json({ token, employee_id: user.employee_id, full_name: user.full_name });
  } catch (err) {
    console.error('[Auth] Register error:', err.message);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

/**
 * POST /api/auth/login
 * Checks DB users first, then falls back to hardcoded demo credentials.
 */
router.post('/login', async (req, res) => {
  const { employee_id, password } = req.body;

  // 1. Try hardcoded demo credentials first
  if (employee_id === EMPLOYEE_ID && password === PASSWORD) {
    const token = jwt.sign({ employee_id: EMPLOYEE_ID }, JWT_SECRET, { expiresIn: '8h' });
    res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 });
    return res.json({ token, employee_id: EMPLOYEE_ID });
  }

  // 2. Try database users
  try {
    const user = await User.findOne({ where: { employee_id } });
    if (user) {
      const match = await bcrypt.compare(password, user.password_hash);
      if (match) {
        const token = jwt.sign({ employee_id: user.employee_id }, JWT_SECRET, { expiresIn: '8h' });
        res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 });
        return res.json({ token, employee_id: user.employee_id, full_name: user.full_name });
      }
    }
  } catch (err) {
    console.error('[Auth] Login DB error:', err.message);
  }

  return res.status(401).json({ error: 'Invalid Employee ID or password.' });
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out' });
});

/**
 * GET /api/auth/me
 */
router.get('/me', authMiddleware, (req, res) => {
  return res.json({ employee_id: req.user.employee_id });
});

module.exports = router;
