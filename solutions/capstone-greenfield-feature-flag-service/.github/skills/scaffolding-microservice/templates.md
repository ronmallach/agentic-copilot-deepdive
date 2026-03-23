# Scaffolding Templates

Skeleton code for each file type. Adapt to the specific resource being scaffolded.

## Server Template (`backend/server.js`)

```javascript
// generated-by-copilot: Express server setup with JWT auth and JSON file storage
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3500;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

app.use(cors());
app.use(express.json());

// generated-by-copilot: JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Authentication required" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
}

// generated-by-copilot: JSON file read/write helpers
function readData(filename) {
  const filePath = path.join(__dirname, "data", filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function writeData(filename, data) {
  const filePath = path.join(__dirname, "data", filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// generated-by-copilot: Shared dependencies for route factories
const deps = {
  authenticateToken,
  readData,
  writeData,
  uuidv4,
  jwt,
  JWT_SECRET,
};

// generated-by-copilot: Mount routes
const createRoutes = require("./routes");
app.use(createRoutes(deps));

// generated-by-copilot: Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
```

## Factory Function Route Template (`backend/routes/{resource}.js`)

```javascript
// generated-by-copilot: {Resource} route handler using factory function pattern
const express = require("express");

module.exports = function createResourceRouter(deps) {
  const { readData, writeData, authenticateToken, uuidv4 } = deps;
  const router = express.Router();

  // generated-by-copilot: GET all resources (public)
  router.get("/", (req, res) => {
    try {
      const items = readData("resource.json");
      // Apply query filters if provided
      return res.json(items);
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // generated-by-copilot: POST create resource (auth required)
  router.post("/", authenticateToken, (req, res) => {
    try {
      const { name, description } = req.body;

      // generated-by-copilot: Validate inputs
      if (!name) return res.status(400).json({ error: "Name is required" });

      const items = readData("resource.json");
      const newItem = {
        id: uuidv4(),
        name,
        description: description || "",
        createdBy: req.user.username,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      items.push(newItem);
      writeData("resource.json", items);

      // generated-by-copilot: Log to audit trail
      const auditLog = readData("audit-log.json");
      auditLog.push({
        id: uuidv4(),
        userId: req.user.username,
        action: "created",
        flagName: name,
        changes: { after: newItem },
        timestamp: new Date().toISOString(),
      });
      writeData("audit-log.json", auditLog);

      return res.status(201).json(newItem);
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
};
```

## Route Index Template (`backend/routes/index.js`)

```javascript
// generated-by-copilot: Compose all route factories into a single router
const express = require("express");
const createResourceRouter = require("./resource");
const createAuditRouter = require("./audit");
const createAuthRouter = require("./auth");

module.exports = function createRoutes(deps) {
  const router = express.Router();

  router.use("/api/resource", createResourceRouter(deps));
  router.use("/api/audit-log", createAuditRouter(deps));
  router.use("/api/auth", createAuthRouter(deps));

  return router;
};
```

## Jest Test Template (`backend/tests/{resource}.test.js`)

```javascript
// generated-by-copilot: Tests for {resource} endpoints
const request = require("supertest");
const app = require("../server");

describe("{Resource} API", () => {
  let authToken;

  // generated-by-copilot: Get auth token before tests
  beforeAll(async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "password" });
    authToken = res.body.token;
  });

  describe("GET /api/resource", () => {
    it("should return all resources without auth", async () => {
      const res = await request(app).get("/api/resource");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("POST /api/resource", () => {
    it("should create a resource with valid auth", async () => {
      const res = await request(app)
        .post("/api/resource")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "test-item", description: "A test item" });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe("test-item");
    });

    it("should return 401 without auth", async () => {
      const res = await request(app)
        .post("/api/resource")
        .send({ name: "test-item" });
      expect(res.status).toBe(401);
    });

    it("should return 400 with missing required fields", async () => {
      const res = await request(app)
        .post("/api/resource")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });
});
```
