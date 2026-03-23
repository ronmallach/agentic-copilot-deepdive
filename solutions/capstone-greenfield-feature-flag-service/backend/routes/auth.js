// generated-by-copilot: Authentication routes using factory function pattern
const express = require("express");

module.exports = function createAuthRouter(deps) {
  const { readData, jwt, JWT_SECRET } = deps;
  const router = express.Router();

  // generated-by-copilot: POST login with username/password
  router.post("/login", (req, res) => {
    try {
      const { username, password } = req.body;

      // generated-by-copilot: Validate inputs
      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Username and password are required" });
      }

      const users = readData("users.json");
      const user = users.find(
        (u) => u.username === username && u.password === password,
      );

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // generated-by-copilot: Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: "24h" },
      );

      return res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
};
