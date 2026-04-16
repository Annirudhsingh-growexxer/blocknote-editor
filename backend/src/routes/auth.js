const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 12;

// Caps prevent bcrypt DoS: hashing / comparing a multi-MB "password" ties
// up the event loop for seconds per request. RFC 5321 caps email at 254.
const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCredentials(rawEmail, rawPassword) {
  if (typeof rawEmail !== 'string' || typeof rawPassword !== 'string') {
    return { error: 'Email and password are required' };
  }
  const email = rawEmail.trim().toLowerCase();
  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) {
    return { error: 'Invalid email format' };
  }
  if (rawPassword.length > MAX_PASSWORD_LENGTH) {
    return { error: `Password must be at most ${MAX_PASSWORD_LENGTH} characters` };
  }
  return { email, password: rawPassword };
}

router.post('/register', async (req, res) => {
  try {
    const parsed = validateCredentials(req.body?.email, req.body?.password);
    if (parsed.error) return res.status(422).json({ error: parsed.error });
    const { email, password } = parsed;

    if (password.length < MIN_PASSWORD_LENGTH || !/\d/.test(password)) {
      return res.status(422).json({ error: 'Password must be at least 8 characters and contain at least one number' });
    }

    // Check if email already exists
    const userExist = await db.query('SELECT id FROM users WHERE email ILIKE $1', [email]);
    if (userExist.rows.length > 0) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    
    const result = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, password_hash]
    );

    const user = result.rows[0];
    const accessToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ user, accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const parsed = validateCredentials(req.body?.email, req.body?.password);
    if (parsed.error) {
      // Don't tell the caller whether it was the email or password that was
      // malformed — keep the response shape identical to a bad-credentials
      // response so we don't leak account enumeration signal.
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const { email, password } = parsed;

    const result = await db.query('SELECT * FROM users WHERE email ILIKE $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ user: { id: user.id, email: user.email }, accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token' });
    }

    // Use the synchronous form of jwt.verify so DB/JWT errors flow through
    // the outer try/catch. The async-callback form in the original code
    // made DB failures become unhandled promise rejections.
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET);
    } catch (_err) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const result = await db.query('SELECT id, email FROM users WHERE id = $1', [decoded.id]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'User not found' });

    const accessToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '15m' });
    res.json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
