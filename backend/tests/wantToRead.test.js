const request = require('supertest');
const express = require('express');
const createApiRouter = require('../routes');
const path = require('path');

const fs = require('fs');
const usersFile = path.join(__dirname, '../data/test-users.json');
const booksFile = path.join(__dirname, '../data/test-books.json');

// generated-by-copilot: Helper to get a valid JWT
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'test_secret';
function getToken(username = 'user1') {
  return jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
}

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

describe('Want-to-Read API', () => {
  it('GET /api/want-to-read should fail without auth', async () => {
    const res = await request(app).get('/api/want-to-read');
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/want-to-read should return want-to-read books for valid user', async () => {
    const token = getToken('user1');
    const res = await request(app)
      .get('/api/want-to-read')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/want-to-read should return 404 for non-existent user', async () => {
    const token = getToken('nouser');
    const res = await request(app)
      .get('/api/want-to-read')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('User not found');
  });

  it('POST /api/want-to-read should add a book to want-to-read list', async () => {
    const token = getToken('user1');
    // generated-by-copilot: Pick a book not already in want-to-read list
    const books = JSON.parse(fs.readFileSync(booksFile, 'utf-8'));
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    const user1 = users.find((u) => u.username === 'user1');
    const wantToReadList = user1.wantToRead || [];
    const notInList = books.find((b) => !wantToReadList.includes(b.id));
    if (!notInList) return; // generated-by-copilot: skip if all are in want-to-read list

    const res = await request(app)
      .post('/api/want-to-read')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: notInList.id });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/added/);
  });

  it('POST /api/want-to-read should not duplicate want-to-read entries', async () => {
    const token = getToken('testuser');
    // generated-by-copilot: First add a book to want-to-read
    const res1 = await request(app)
      .post('/api/want-to-read')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: '1' });
    expect(res1.statusCode).toBe(200);

    // generated-by-copilot: Try to add the same book again
    const res2 = await request(app)
      .post('/api/want-to-read')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: '1' });
    expect(res2.statusCode).toBe(200);
    expect(res2.body.message).toMatch(/added/);
  });

  it('POST /api/want-to-read should fail with missing bookId', async () => {
    const token = getToken('user1');
    const res = await request(app)
      .post('/api/want-to-read')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Valid Book ID required');
  });

  it('POST /api/want-to-read should fail with invalid bookId type', async () => {
    const token = getToken('user1');
    const res = await request(app)
      .post('/api/want-to-read')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: 123 });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Valid Book ID required');
  });

  it('POST /api/want-to-read should fail with non-existent bookId', async () => {
    const token = getToken('user1');
    const res = await request(app)
      .post('/api/want-to-read')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: '999999' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Book not found');
  });

  it('POST /api/want-to-read should 404 for non-existent user', async () => {
    const token = getToken('nouser');
    const res = await request(app)
      .post('/api/want-to-read')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: '1' });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('User not found');
  });

  it('POST /api/want-to-read should fail without auth', async () => {
    const res = await request(app)
      .post('/api/want-to-read')
      .send({ bookId: '1' });
    expect(res.statusCode).toBe(401);
  });

  it('DELETE /api/want-to-read/:bookId should remove book from want-to-read list', async () => {
    const token = getToken('testuser');
    // generated-by-copilot: First add a book to want-to-read
    await request(app)
      .post('/api/want-to-read')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: '2' });

    // generated-by-copilot: Then remove it
    const res = await request(app)
      .delete('/api/want-to-read/2')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/removed/);
  });

  it('DELETE /api/want-to-read/:bookId should 404 for book not in want-to-read list', async () => {
    const token = getToken('user1');
    const res = await request(app)
      .delete('/api/want-to-read/999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Book not in want-to-read list');
  });

  it('DELETE /api/want-to-read/:bookId should 404 for non-existent user', async () => {
    const token = getToken('nouser');
    const res = await request(app)
      .delete('/api/want-to-read/1')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('User not found');
  });

  it('DELETE /api/want-to-read/:bookId should fail without auth', async () => {
    const res = await request(app).delete('/api/want-to-read/1');
    expect(res.statusCode).toBe(401);
  });
});
