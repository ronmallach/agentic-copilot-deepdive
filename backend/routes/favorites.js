const express = require('express');

function createFavoritesRouter({
  usersFile,
  booksFile,
  readJSON,
  writeJSON,
  authenticateToken,
}) {
  const router = express.Router();

  router.get('/', authenticateToken, (req, res) => {
    try {
      const users = readJSON(usersFile);
      const user = users.find((u) => u.username === req.user.username);
      if (!user)
        return res.status(404).json({
          error: { code: 'USER_NOT_FOUND', message: 'User not found' },
        });
      const books = readJSON(booksFile);
      const favorites = books.filter(
        (b) => (user.favorites || []).indexOf(b.id) !== -1
      );
      res.json(favorites);
    } catch {
      res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred.',
        },
      });
    }
  });

  router.post('/', authenticateToken, (req, res) => {
    const { bookId } = req.body;
    if (!bookId)
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Book ID is required' },
      });
    try {
      const users = readJSON(usersFile);
      const user = users.find((u) => u.username === req.user.username);
      if (!user)
        return res.status(404).json({
          error: { code: 'USER_NOT_FOUND', message: 'User not found' },
        });

      // generated-by-copilot: validate book exists
      const books = readJSON(booksFile);
      const bookExists = books.find((b) => b.id === bookId);
      if (!bookExists)
        return res.status(400).json({
          error: { code: 'BOOK_NOT_FOUND', message: 'Book not found' },
        });

      // generated-by-copilot: ensure favorites array exists
      if (!user.favorites) user.favorites = [];

      if (user.favorites.indexOf(bookId) === -1) {
        user.favorites.push(bookId);
        writeJSON(usersFile, users);
      }
      res.status(200).json({ message: 'Book added to favorites successfully' });
    } catch {
      res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred.',
        },
      });
    }
  });

  // generated-by-copilot: DELETE /favorites/:bookId - remove a book from the user's favorites
  router.delete('/:bookId', authenticateToken, (req, res) => {
    const { bookId } = req.params;
    try {
      const users = readJSON(usersFile);
      const user = users.find((u) => u.username === req.user.username);
      if (!user)
        return res.status(404).json({
          error: { code: 'USER_NOT_FOUND', message: 'User not found' },
        });

      // generated-by-copilot: ensure favorites array exists
      if (!user.favorites) user.favorites = [];

      const index = user.favorites.indexOf(bookId);
      if (index === -1)
        return res.status(404).json({
          error: {
            code: 'BOOK_NOT_IN_FAVORITES',
            message: 'Book not in favorites',
          },
        });
      user.favorites.splice(index, 1);
      writeJSON(usersFile, users);
      res.status(204).send();
    } catch {
      res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred.',
        },
      });
    }
  });

  return router;
}

module.exports = createFavoritesRouter;
