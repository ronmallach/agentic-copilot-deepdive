// generated-by-copilot: Audit log routes using factory function pattern
const express = require("express");

module.exports = function createAuditRouter(deps) {
  const { readData, authenticateToken } = deps;
  const router = express.Router();

  // generated-by-copilot: GET audit log (auth required)
  router.get("/", authenticateToken, (req, res) => {
    try {
      const auditLog = readData("audit-log.json");

      // generated-by-copilot: Sort by timestamp descending (newest first)
      const sorted = auditLog.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
      );

      return res.json(sorted);
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
};
