// generated-by-copilot: Manual test script to bypass Jest caching
const request = require('supertest');
const express = require('express');
const createApiRouter = require('./routes');
const path = require('path');

const app = express();
app.use(express.json());
app.use('/api', createApiRouter({
  usersFile: path.join(__dirname, 'data/test-users.json'),
  booksFile: path.join(__dirname, 'data/test-books.json'),
  readJSON: (file) => require('fs').existsSync(file) ? JSON.parse(require('fs').readFileSync(file, 'utf-8')) : [],
  writeJSON: (file, data) => require('fs').writeFileSync(file, JSON.stringify(data, null, 2)),
  authenticateToken: (req, res, next) => next(),
  SECRET_KEY: 'test_secret',
}));

async function testAuth() {
  console.log('Testing auth with empty username...');
  const res = await request(app).post('/api/login').send({ username: '' });
  console.log('Status:', res.statusCode, 'Body:', res.body);
}

testAuth().catch(console.error);