// generated-by-copilot: standard test setup using factory pattern
const request = require('supertest');
const express = require('express');
const createApiRouter = require('../routes');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'test_secret';
const usersFile = path.join(__dirname, '../data/test-users.json');
const booksFile = path.join(__dirname, '../data/test-books.json');

// generated-by-copilot: load expected staff picks from fixture for assertion comparisons
const staffPicksFixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures/staff-picks.json'), 'utf-8')
);

const app = express();
app.use(express.json());
app.use(
  '/api',
  createApiRouter({
    usersFile,
    booksFile,
    readJSON: (file) =>
      fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : [],
    writeJSON: (file, data) =>
      fs.writeFileSync(file, JSON.stringify(data, null, 2)),
    authenticateToken: (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return res.sendStatus(401);
      try {
        req.user = jwt.verify(token, SECRET_KEY);
        next();
      } catch {
        return res.sendStatus(403);
      }
    },
    SECRET_KEY,
  })
);

// generated-by-copilot: GET /api/v1/staff-picks — public endpoint, no auth required
describe('GET /api/v1/staff-picks', () => {
  it('should return 200 status', async () => {
    const res = await request(app).get('/api/v1/staff-picks');
    expect(res.statusCode).toBe(200);
  });

  it('should return an array', async () => {
    const res = await request(app).get('/api/v1/staff-picks');
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
  });

  it('should return the expected number of books', async () => {
    const res = await request(app).get('/api/v1/staff-picks');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(staffPicksFixture.length);
  });

  it('should return books with required fields: isbn, title, author, summary, publicationDate', async () => {
    const res = await request(app).get('/api/v1/staff-picks');
    expect(res.statusCode).toBe(200);
    res.body.forEach((book) => {
      expect(book).toHaveProperty('isbn');
      expect(book).toHaveProperty('title');
      expect(book).toHaveProperty('author');
      expect(book).toHaveProperty('summary');
      expect(book).toHaveProperty('publicationDate');
    });
  });

  it('should return books matching fixture data for isbn, title, author, and publicationDate', async () => {
    const res = await request(app).get('/api/v1/staff-picks');
    expect(res.statusCode).toBe(200);
    staffPicksFixture.forEach((expected) => {
      const match = res.body.find((book) => book.isbn === expected.isbn);
      expect(match).toBeDefined();
      expect(match.title).toBe(expected.title);
      expect(match.author).toBe(expected.author);
      expect(match.publicationDate).toBe(expected.publicationDate);
    });
  });

  it('should be accessible without authentication', async () => {
    const res = await request(app)
      .get('/api/v1/staff-picks')
      .unset('Authorization');
    expect(res.statusCode).toBe(200);
  });
});
