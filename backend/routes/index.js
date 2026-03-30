const createAuthRouter = require('./auth');
const createBooksRouter = require('./books');
const createFavoritesRouter = require('./favorites');
const createReviewsRouter = require('./reviews');
const createWantToReadRouter = require('./wantToRead');

function createApiRouter(deps) {
  const express = require('express');
  const router = express.Router();

  // generated-by-copilot: API v1 routes with proper REST structure
  const v1Router = express.Router();
  v1Router.use('/auth', createAuthRouter(deps));
  v1Router.use('/books', createBooksRouter(deps));
  v1Router.use('/favorites', createFavoritesRouter(deps));
  v1Router.use('/reviews', createReviewsRouter(deps));
  v1Router.use('/want-to-read', createWantToReadRouter(deps));

  router.use('/v1', v1Router);
  // generated-by-copilot: redirect root /api to versioned endpoint
  router.use('/', v1Router);
  // generated-by-copilot: mount auth routes directly for backward compatibility
  router.use('/', createAuthRouter(deps));

  return router;
}

module.exports = createApiRouter;
