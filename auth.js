// routes/auth.js
// POST /api/auth/register  — create account
// POST /api/auth/login     — login, returns JWT
// GET  /api/auth/me        — check token is still valid

const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { getPool } = require('../db');

const router = express.Router();

// ── requireAuth middleware ────────────────────────────────────────────────────
// Import this in other route files to protect endpoints.
// Checks the Authorization: Bearer <token> header on every request.
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token provided' });

  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const pool = getPool();

    // Check if email already exists
    const [rows] = await pool.execute(
      'SELECT id FROM gridguard_users WHERE email = ?', [email]
    );
    if (rows.length > 0)
      return res.status(409).json({ error: 'An account with this email already exists' });

    // Hash password before storing
    const hashed = await bcrypt.hash(password, 10);

    await pool.execute(
      'INSERT INTO gridguard_users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashed]
    );

    res.status(201).json({ message: 'Account created successfully' });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  try {
    const pool = getPool();

    const [rows] = await pool.execute(
      'SELECT * FROM gridguard_users WHERE email = ?', [email]
    );
    if (rows.length === 0)
      return res.status(401).json({ error: 'No account found with that email' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ error: 'Incorrect password' });

    // Sign JWT with user id, name and email
    const token = jwt.sign(
      { userId: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { name: user.name, email: user.email } });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: { name: req.user.name, email: req.user.email } });
});

module.exports = { router, requireAuth };
