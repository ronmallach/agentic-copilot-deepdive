// generated-by-copilot: This file defines the Express router for the /api/books endpoint.
// It provides read-only access to the books catalog stored in the JSON data file.
// The router is created via a factory function that accepts injected dependencies
// (booksFile, readJSON, writeJSON, authenticateToken) for testability and flexibility.

const express = require('express');

function createBooksRouter({ booksFile, readJSON, writeJSON, authenticateToken }) {
  const router = express.Router();

  router.get('/', (req, res) => {
    const books = readJSON(booksFile);
    res.json(books);
  });

  // generated-by-copilot: GET /books/search?q=<title> - case-insensitive title search
  router.get('/search', (req, res) => {
    const q = req.query.q;
    if (!q || !q.trim()) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    const books = readJSON(booksFile);
    const lower = q.toLowerCase();
    const results = books.filter(book => book.title.toLowerCase().includes(lower));
    res.json(results);
  });

  // POST /books removed: adding books is not allowed

  return router;
}

module.exports = createBooksRouter;
