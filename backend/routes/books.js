// generated-by-copilot: This file defines the Express router for the /api/books endpoint.
// It provides read-only access to the books catalog stored in the JSON data file.
// The router is created via a factory function that accepts injected dependencies
// (booksFile, readJSON, writeJSON, authenticateToken) for testability and flexibility.

const express = require('express');

function createBooksRouter({
  booksFile,
  usersFile,
  readJSON,
  writeJSON,
  authenticateToken,
}) {
  const router = express.Router();

  router.get('/', (req, res) => {
    try {
      const books = readJSON(booksFile);
      if (!Array.isArray(books)) {
        return res.status(500).json({
          error: {
            code: 'DATA_ERROR',
            message: 'An unexpected error occurred.',
          },
        });
      }
      res.json(books);
    } catch {
      res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred.',
        },
      });
    }
  });

  // generated-by-copilot: GET /books/search?q=<title> - case-insensitive title search with pagination
  router.get('/search', (req, res) => {
    const q = req.query.q;
    if (!q || !q.trim()) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Query parameter "q" is required',
        },
      });
    }
    try {
      const books = readJSON(booksFile);
      if (!Array.isArray(books)) {
        return res.status(500).json({
          error: {
            code: 'DATA_ERROR',
            message: 'An unexpected error occurred.',
          },
        });
      }

      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(
        Math.max(1, parseInt(req.query.limit, 10) || 10),
        100
      );
      const lower = q.toLowerCase();
      // generated-by-copilot: Search both title and author fields with OR logic
      const filteredBooks = books.filter(
        (book) =>
          book.title.toLowerCase().includes(lower) ||
          book.author.toLowerCase().includes(lower)
      );

      // generated-by-copilot: pagination for search results
      const total = filteredBooks.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = filteredBooks.slice(startIndex, endIndex);

      res.json({
        data: paginatedResults,
        pagination: {
          page,
          limit,
          total,
          pages: totalPages,
        },
        query: q,
      });
    } catch {
      res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred.',
        },
      });
    }
  });

  // generated-by-copilot: GET /books/stats - returns total book count and unique favorited book count
  router.get('/stats', (req, res) => {
    try {
      const books = readJSON(booksFile);
      const users = readJSON(usersFile);
      if (!Array.isArray(books) || !Array.isArray(users)) {
        return res.status(500).json({
          error: {
            code: 'DATA_ERROR',
            message: 'An unexpected error occurred.',
          },
        });
      }
      // generated-by-copilot: normalize IDs to strings to guard against type mismatches between books and favorites
      const bookIds = new Set(books.map((b) => String(b.id)));
      // generated-by-copilot: filter out orphaned favorites not present in the books catalog, then deduplicate
      const favoritedBooks = new Set(
        users.flatMap((u) =>
          (Array.isArray(u.favorites) ? u.favorites : []).filter(
            (id) => id != null && bookIds.has(String(id))
          )
        )
      ).size;
      res.json({ totalBooks: books.length, favoritedBooks });
    } catch {
      res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred.',
        },
      });
    }
  });

  // POST /books removed: adding books is not allowed

  return router;
}

module.exports = createBooksRouter;
