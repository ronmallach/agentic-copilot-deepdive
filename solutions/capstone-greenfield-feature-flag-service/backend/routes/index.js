// generated-by-copilot: Compose all route factories into a single router
const express = require('express');
const createFlagsRouter = require('./flags');
const createAuditRouter = require('./audit');
const createAuthRouter = require('./auth');

module.exports = function createRoutes(deps) {
  const router = express.Router();

  router.use('/api/flags', createFlagsRouter(deps));
  router.use('/api/audit-log', createAuditRouter(deps));
  router.use('/api/auth', createAuthRouter(deps));

  return router;
};