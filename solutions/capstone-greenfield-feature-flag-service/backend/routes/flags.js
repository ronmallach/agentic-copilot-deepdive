// generated-by-copilot: Flag management routes using factory function pattern
const express = require("express");

module.exports = function createFlagsRouter(deps) {
  const { readData, writeData, authenticateToken, uuidv4 } = deps;
  const router = express.Router();

  // generated-by-copilot: GET all flags (public, filterable by environment)
  router.get("/", (req, res) => {
    try {
      const flags = readData("flags.json");
      const { environment } = req.query;

      if (environment) {
        const filtered = flags.filter(
          (flag) => flag.environment === environment,
        );
        return res.json(filtered);
      }

      return res.json(flags);
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // generated-by-copilot: GET single flag by name (public)
  router.get("/:name", (req, res) => {
    try {
      const flags = readData("flags.json");
      const flag = flags.find((f) => f.name === req.params.name);

      if (!flag) {
        return res.status(404).json({ error: "Flag not found" });
      }

      return res.json(flag);
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // generated-by-copilot: POST create flag (auth required)
  router.post("/", authenticateToken, (req, res) => {
    try {
      const { name, description, environment } = req.body;

      // generated-by-copilot: Validate inputs
      if (!name) return res.status(400).json({ error: "Name is required" });
      if (!name.match(/^[a-z0-9-]+$/)) {
        return res.status(400).json({
          error:
            "Name must be kebab-case (lowercase letters, numbers, hyphens only)",
        });
      }
      if (description && description.length > 200) {
        return res
          .status(400)
          .json({ error: "Description must be 200 characters or less" });
      }
      if (
        !environment ||
        !["development", "staging", "production"].includes(environment)
      ) {
        return res.status(400).json({
          error: "Environment must be development, staging, or production",
        });
      }

      const flags = readData("flags.json");

      // generated-by-copilot: Check name uniqueness per environment
      const duplicate = flags.find(
        (f) => f.name === name && f.environment === environment,
      );
      if (duplicate) {
        return res
          .status(409)
          .json({ error: "Flag name already exists in this environment" });
      }

      const newFlag = {
        id: uuidv4(),
        name,
        description: description || "",
        enabled: false,
        environment,
        createdBy: req.user.username,
        updatedBy: req.user.username,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      flags.push(newFlag);
      writeData("flags.json", flags);

      // generated-by-copilot: Log to audit trail
      const auditLog = readData("audit-log.json");
      auditLog.push({
        id: uuidv4(),
        userId: req.user.username,
        action: "created",
        flagName: name,
        changes: { after: newFlag },
        timestamp: new Date().toISOString(),
      });
      writeData("audit-log.json", auditLog);

      return res.status(201).json(newFlag);
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // generated-by-copilot: PUT update flag (auth, ownership check)
  router.put("/:name", authenticateToken, (req, res) => {
    try {
      const { name } = req.params;
      const { description, enabled, environment } = req.body;

      const flags = readData("flags.json");
      const flagIndex = flags.findIndex((f) => f.name === name);

      if (flagIndex === -1) {
        return res.status(404).json({ error: "Flag not found" });
      }

      const flag = flags[flagIndex];

      // generated-by-copilot: Ownership check (unless admin)
      if (req.user.role !== "admin" && flag.createdBy !== req.user.username) {
        return res
          .status(403)
          .json({ error: "You can only modify flags you created" });
      }

      // generated-by-copilot: Validate inputs if provided
      if (description && description.length > 200) {
        return res
          .status(400)
          .json({ error: "Description must be 200 characters or less" });
      }
      if (
        environment &&
        !["development", "staging", "production"].includes(environment)
      ) {
        return res.status(400).json({
          error: "Environment must be development, staging, or production",
        });
      }

      const before = { ...flag };

      // generated-by-copilot: Update fields if provided
      if (description !== undefined) flag.description = description;
      if (enabled !== undefined) flag.enabled = enabled;
      if (environment !== undefined) flag.environment = environment;
      flag.updatedBy = req.user.username;
      flag.updatedAt = new Date().toISOString();

      flags[flagIndex] = flag;
      writeData("flags.json", flags);

      // generated-by-copilot: Log to audit trail
      const auditLog = readData("audit-log.json");
      auditLog.push({
        id: uuidv4(),
        userId: req.user.username,
        action: "updated",
        flagName: name,
        changes: { before, after: flag },
        timestamp: new Date().toISOString(),
      });
      writeData("audit-log.json", auditLog);

      return res.json(flag);
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // generated-by-copilot: DELETE flag (auth, ownership check)
  router.delete("/:name", authenticateToken, (req, res) => {
    try {
      const { name } = req.params;

      const flags = readData("flags.json");
      const flagIndex = flags.findIndex((f) => f.name === name);

      if (flagIndex === -1) {
        return res.status(404).json({ error: "Flag not found" });
      }

      const flag = flags[flagIndex];

      // generated-by-copilot: Ownership check (unless admin)
      if (req.user.role !== "admin" && flag.createdBy !== req.user.username) {
        return res
          .status(403)
          .json({ error: "You can only delete flags you created" });
      }

      const deleted = flags.splice(flagIndex, 1)[0];
      writeData("flags.json", flags);

      // generated-by-copilot: Log to audit trail
      const auditLog = readData("audit-log.json");
      auditLog.push({
        id: uuidv4(),
        userId: req.user.username,
        action: "deleted",
        flagName: name,
        changes: { before: deleted },
        timestamp: new Date().toISOString(),
      });
      writeData("audit-log.json", auditLog);

      return res.json({ message: "Flag deleted successfully" });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // generated-by-copilot: POST toggle flag enabled/disabled (auth, ownership check)
  router.post("/:name/toggle", authenticateToken, (req, res) => {
    try {
      const { name } = req.params;

      const flags = readData("flags.json");
      const flagIndex = flags.findIndex((f) => f.name === name);

      if (flagIndex === -1) {
        return res.status(404).json({ error: "Flag not found" });
      }

      const flag = flags[flagIndex];

      // generated-by-copilot: Ownership check (unless admin)
      if (req.user.role !== "admin" && flag.createdBy !== req.user.username) {
        return res
          .status(403)
          .json({ error: "You can only toggle flags you created" });
      }

      const before = { ...flag };
      flag.enabled = !flag.enabled;
      flag.updatedBy = req.user.username;
      flag.updatedAt = new Date().toISOString();

      flags[flagIndex] = flag;
      writeData("flags.json", flags);

      // generated-by-copilot: Log to audit trail with before/after
      const auditLog = readData("audit-log.json");
      auditLog.push({
        id: uuidv4(),
        userId: req.user.username,
        action: "toggled",
        flagName: name,
        changes: { before, after: flag },
        timestamp: new Date().toISOString(),
      });
      writeData("audit-log.json", auditLog);

      return res.json(flag);
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
};
