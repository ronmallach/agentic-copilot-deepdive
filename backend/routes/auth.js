const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// generated-by-copilot: rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// generated-by-copilot: validate username and password are non-empty strings within length bounds
function validateCredentials(username, password) {
  if (typeof username !== 'string' || typeof password !== 'string') return false;
  if (username.trim().length === 0 || password.trim().length === 0) return false;
  if (username.length > 50 || password.length > 72) return false;
  return true;
}

function createAuthRouter({ usersFile, readJSON, writeJSON, SECRET_KEY }) {
  const router = express.Router();

  router.post('/register', authLimiter, (req, res) => {
    const { username, password } = req.body;
    if (!validateCredentials(username, password)) {
      return res.status(400).json({ error: 'Invalid username or password format.' });
    }
    const users = readJSON(usersFile);
    if (users.find(u => u.username === username)) {
      return res.status(409).json({ error: 'User already exists.' });
    }
    users.push({ username, password, favorites: [] });
    writeJSON(usersFile, users);
    res.status(201).json({ message: 'User registered.' });
  });

  // generated-by-copilot: NEW LOGIN ROUTE WITH PROPER 401 HANDLING
  router.post('/login', authLimiter, (req, res) => {
    const { username, password } = req.body;
    
    // generated-by-copilot: Return 401 for any missing or invalid input
    if (!username || !password || username.trim() === '' || password.trim() === '') {
      return res.status(401).json({ error: 'Invalid username or password format.' });
    }
    
    // generated-by-copilot: Continue with normal validation
    if (!validateCredentials(username, password)) {
      return res.status(401).json({ error: 'Invalid username or password format.' });
    }
    try {
      const users = readJSON(usersFile);
      const user = users.find(u => u.username === username && u.password === password);
      if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
      const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ token });
    } catch {
      res.status(500).json({ error: 'An unexpected error occurred.' });
    }
  });

  return router;
}

module.exports = createAuthRouter;
