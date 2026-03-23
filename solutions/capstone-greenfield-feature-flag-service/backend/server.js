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
    console.log(`Feature Flag Service running on port ${PORT}`);
  });
}

module.exports = app;
