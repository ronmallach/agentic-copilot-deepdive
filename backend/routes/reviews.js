// generated-by-copilot: Route file for book reviews.
// Supports GET all reviews for a book, POST a new review (authenticated),
// and DELETE own review (authenticated). Reviews are persisted in backend/data/reviews.json.

const express = require('express');

function createReviewsRouter({ reviewsFile, booksFile, readJSON, writeJSON, authenticateToken }) {
  const router = express.Router();

  // GET /reviews/:bookId - public, returns all reviews for a book
  router.get('/:bookId', (req, res) => {
    const { bookId } = req.params;
    const books = readJSON(booksFile);
    if (!books.find(b => b.id === bookId)) {
      return res.status(404).json({ error: 'Book not found' });
    }
    const reviews = readJSON(reviewsFile);
    res.json(reviews.filter(r => r.bookId === bookId));
  });

  // POST /reviews - authenticated, add a review for a book
  router.post('/', authenticateToken, (req, res) => {
    const { bookId, rating, comment } = req.body;
    if (!bookId || rating === undefined) {
      return res.status(400).json({ error: 'bookId and rating are required' });
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be a number between 1 and 5' });
    }
    const books = readJSON(booksFile);
    if (!books.find(b => b.id === bookId)) {
      return res.status(404).json({ error: 'Book not found' });
    }
    const reviews = readJSON(reviewsFile);
    const id = Date.now().toString();
    const review = { id, bookId, username: req.user.username, rating, comment: comment || '', createdAt: new Date().toISOString() };
    reviews.push(review);
    writeJSON(reviewsFile, reviews);
    res.status(201).json(review);
  });

  // DELETE /reviews/:reviewId - authenticated, only the author can delete their own review
  router.delete('/:reviewId', authenticateToken, (req, res) => {
    const { reviewId } = req.params;
    const reviews = readJSON(reviewsFile);
    const index = reviews.findIndex(r => r.id === reviewId);
    if (index === -1) return res.status(404).json({ error: 'Review not found' });
    if (reviews[index].username !== req.user.username) {
      return res.status(401).json({ error: 'Not authorised to delete this review' });
    }
    reviews.splice(index, 1);
    writeJSON(reviewsFile, reviews);
    res.status(200).json({ message: 'Review deleted' });
  });

  return router;
}

module.exports = createReviewsRouter;
