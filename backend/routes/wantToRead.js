const express = require('express');

function createWantToReadRouter({ usersFile, booksFile, readJSON, writeJSON, authenticateToken }) {
  const router = express.Router();

  // generated-by-copilot: GET /want-to-read - fetch user's want-to-read books
  router.get('/', authenticateToken, (req, res) => {
    const users = readJSON(usersFile);
    const user = users.find(u => u.username === req.user.username);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // generated-by-copilot: ensure wantToRead array exists and default to empty array
    const wantToReadIds = user.wantToRead || [];
    
    const books = readJSON(booksFile);
    const wantToReadBooks = books.filter(b => wantToReadIds.indexOf(b.id) !== -1);
    res.json(wantToReadBooks);
  });

  // generated-by-copilot: POST /want-to-read - add a book to user's want-to-read list
  router.post('/', authenticateToken, (req, res) => {
    const { bookId } = req.body;
    if (!bookId || typeof bookId !== 'string') return res.status(400).json({ message: 'Valid Book ID required' });
    
    const users = readJSON(usersFile);
    const user = users.find(u => u.username === req.user.username);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // generated-by-copilot: validate that the book exists
    const books = readJSON(booksFile);
    const bookExists = books.find(b => b.id === bookId);
    if (!bookExists) return res.status(400).json({ message: 'Book not found' });
    
    // generated-by-copilot: ensure wantToRead array exists and default to empty array
    if (!user.wantToRead) {
      user.wantToRead = [];
    }
    
    // generated-by-copilot: only add if not already in want-to-read list
    if (user.wantToRead.indexOf(bookId) === -1) {
      user.wantToRead.push(bookId);
      writeJSON(usersFile, users);
    }
    res.status(200).json({ message: 'Book added to want-to-read list' });
  });

  // generated-by-copilot: DELETE /want-to-read/:bookId - remove a book from user's want-to-read list
  router.delete('/:bookId', authenticateToken, (req, res) => {
    const { bookId } = req.params;
    const users = readJSON(usersFile);
    const user = users.find(u => u.username === req.user.username);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // generated-by-copilot: ensure wantToRead array exists and default to empty array
    if (!user.wantToRead) {
      user.wantToRead = [];
    }
    
    const index = user.wantToRead.indexOf(bookId);
    if (index === -1) return res.status(404).json({ message: 'Book not in want-to-read list' });
    
    user.wantToRead.splice(index, 1);
    writeJSON(usersFile, users);
    res.status(200).json({ message: 'Book removed from want-to-read list' });
  });

  return router;
}

module.exports = createWantToReadRouter;