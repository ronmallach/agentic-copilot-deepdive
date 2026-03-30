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

// generated-by-copilot: snapshot test-users.json before suite so each describe block can restore it
let originalUsers;
beforeAll(() => {
  originalUsers = fs.readFileSync(usersFile, 'utf-8');
});
afterEach(() => {
  fs.writeFileSync(usersFile, originalUsers);
});

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

function getToken(username = 'user1') {
  return jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
}

// generated-by-copilot: GET /api/favorites — user1 starts with favorites ["7","15","9","6","5","16","14","20","21","3","44","8","26"]
describe('GET /api/favorites', () => {
  it('should return 401 when no token is provided', async () => {
    const res = await request(app).get('/api/favorites');
    expect(res.statusCode).toBe(401);
  });

  it('should return 200 and an array for an authenticated user', async () => {
    const token = getToken('user1');
    const res = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
  });

  it('should return books with full book objects (id, title, author, genre)', async () => {
    const token = getToken('user1');
    const res = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    const book = res.body[0];
    expect(book).toHaveProperty('id');
    expect(book).toHaveProperty('title');
    expect(book).toHaveProperty('author');
    expect(book).toHaveProperty('genre');
  });

  it("should return only books that are in the user's favorites list", async () => {
    const token = getToken('user1');
    const res = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    // generated-by-copilot: user1's favorites include id "7" (The Catcher in the Rye)
    const ids = res.body.map((b) => b.id);
    expect(ids).toContain('7');
    const catcherBook = res.body.find((b) => b.id === '7');
    expect(catcherBook.title).toBe('The Catcher in the Rye');
    expect(catcherBook.author).toBe('J.D. Salinger');
  });

  it('should return an empty array for a user with no favorites', async () => {
    // generated-by-copilot: create a fresh user with no favorites for this assertion
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    users.push({
      username: 'emptyuser',
      password: 'pass',
      favorites: [],
      wantToRead: [],
    });
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

    const token = getToken('emptyuser');
    const res = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// generated-by-copilot: POST /api/favorites — add a book to the authenticated user's favorites
describe('POST /api/favorites', () => {
  it('should return 401 when no token is provided', async () => {
    const res = await request(app).post('/api/favorites').send({ bookId: '2' });
    expect(res.statusCode).toBe(401);
  });

  it('should return 400 when bookId is missing from the request body', async () => {
    const token = getToken('user1');
    const res = await request(app)
      .post('/api/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 when bookId does not exist in the books catalog', async () => {
    const token = getToken('user1');
    const res = await request(app)
      .post('/api/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: 'nonexistent-999' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('BOOK_NOT_FOUND');
  });

  it('should return 200 and success message when adding a valid book', async () => {
    const token = getToken('user1');
    // generated-by-copilot: book id "2" (1984 by George Orwell) is not in user1's initial favorites
    const res = await request(app)
      .post('/api/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: '2' });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Book added to favorites successfully');
  });

  it('should be idempotent — adding a book already in favorites returns 200', async () => {
    const token = getToken('user1');
    // generated-by-copilot: book id "7" is already in user1's favorites
    const res = await request(app)
      .post('/api/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: '7' });
    expect(res.statusCode).toBe(200);
  });

  it('should persist the added book so GET reflects the new favorite', async () => {
    const token = getToken('user1');
    await request(app)
      .post('/api/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: '2' });
    const getRes = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${token}`);
    const ids = getRes.body.map((b) => b.id);
    expect(ids).toContain('2');
  });
});

// generated-by-copilot: DELETE /api/favorites/:bookId — remove a book from the user's favorites
describe('DELETE /api/favorites/:bookId', () => {
  it('should return 401 when no token is provided', async () => {
    const res = await request(app).delete('/api/favorites/7');
    expect(res.statusCode).toBe(401);
  });

  it("should return 404 when the book is not in the user's favorites", async () => {
    const token = getToken('user1');
    // generated-by-copilot: book id "2" is not in user1's initial favorites
    const res = await request(app)
      .delete('/api/favorites/2')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.error.code).toBe('BOOK_NOT_IN_FAVORITES');
  });

  it('should return 204 and remove a book that exists in favorites', async () => {
    const token = getToken('user1');
    // generated-by-copilot: book id "7" (The Catcher in the Rye) is in user1's initial favorites
    const res = await request(app)
      .delete('/api/favorites/7')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(204);
    expect(res.body).toEqual({});
  });

  it('should persist the removal so GET no longer returns the deleted book', async () => {
    const token = getToken('user1');
    await request(app)
      .delete('/api/favorites/7')
      .set('Authorization', `Bearer ${token}`);
    const getRes = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${token}`);
    const ids = getRes.body.map((b) => b.id);
    expect(ids).not.toContain('7');
  });
});
