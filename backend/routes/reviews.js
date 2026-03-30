// generated-by-copilot: Route file for book reviews.
// Supports GET all reviews for a book, POST a new review (authenticated),
// and DELETE own review (authenticated). Reviews are persisted in backend/data/reviews.json.

const express = require('express');

function createReviewsRouter({
  reviewsFile,
  booksFile,
  readJSON,
  writeJSON,
  authenticateToken,
}) {
  const router = express.Router();

  // GET /reviews/:bookId - public, returns all reviews for a book
  router.get('/:bookId', (req, res) => {
    const { bookId } = req.params;
    try {
      const books = readJSON(booksFile);
      if (!books.find((b) => b.id === bookId)) {
        return res
          .status(404)
          .json({
            error: { code: 'BOOK_NOT_FOUND', message: 'Book not found' },
          });
      }
      const reviews = readJSON(reviewsFile);
      res.json(reviews.filter((r) => r.bookId === bookId));
    } catch {
      res
        .status(500)
        .json({
          error: {
            code: 'SERVER_ERROR',
            message: 'An unexpected error occurred.',
          },
        });
    }
  });

  // POST /reviews - authenticated, add a review for a book
  router.post('/', authenticateToken, (req, res) => {
    const { bookId, rating, comment } = req.body;
    if (!bookId || rating === undefined) {
      return res
        .status(400)
        .json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'bookId and rating are required',
          },
        });
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'rating must be a number between 1 and 5',
          },
        });
    }
    try {
      const books = readJSON(booksFile);
      if (!books.find((b) => b.id === bookId)) {
        return res
          .status(404)
          .json({
            error: { code: 'BOOK_NOT_FOUND', message: 'Book not found' },
          });
      }
      const reviews = readJSON(reviewsFile);
      const id = Date.now().toString();
      const review = {
        id,
        bookId,
        username: req.user.username,
        rating,
        comment: comment || '',
        createdAt: new Date().toISOString(),
      };
      reviews.push(review);
      writeJSON(reviewsFile, reviews);
      res.status(201).json(review);
    } catch {
      res
        .status(500)
        .json({
          error: {
            code: 'SERVER_ERROR',
            message: 'An unexpected error occurred.',
          },
        });
    }
  });

  // DELETE /reviews/:reviewId - authenticated, only the author can delete their own review
  router.delete('/:reviewId', authenticateToken, (req, res) => {
    const { reviewId } = req.params;
    try {
      const reviews = readJSON(reviewsFile);
      const index = reviews.findIndex((r) => r.id === reviewId);
      if (index === -1)
        return res
          .status(404)
          .json({
            error: { code: 'REVIEW_NOT_FOUND', message: 'Review not found' },
          });
      if (reviews[index].username !== req.user.username) {
        return res
          .status(403)
          .json({
            error: {
              code: 'FORBIDDEN',
              message: 'Not authorized to delete this review',
            },
          });
      }
      reviews.splice(index, 1);
      writeJSON(reviewsFile, reviews);
      res.status(204).send();
    } catch {
      res
        .status(500)
        .json({
          error: {
            code: 'SERVER_ERROR',
            message: 'An unexpected error occurred.',
          },
        });
    }
  });

  return router;
}

module.exports = createReviewsRouter;
