const createAuthRouter = require('./auth');
const createBooksRouter = require('./books');
const createFavoritesRouter = require('./favorites');
const createReviewsRouter = require('./reviews');
const createWantToReadRouter = require('./wantToRead');

function createApiRouter(deps) {
  const express = require('express');
  const router = express.Router();

  // generated-by-copilot: force refresh routes to pick up changes
  router.use('/', createAuthRouter(deps));
  router.use('/books', createBooksRouter(deps));
  router.use('/favorites', createFavoritesRouter(deps));
  router.use('/reviews', createReviewsRouter(deps));
  router.use('/want-to-read', createWantToReadRouter(deps));

  return router;
}

module.exports = createApiRouter;
