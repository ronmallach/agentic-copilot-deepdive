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
const reviewsFile = path.join(__dirname, '../data/test-reviews.json');

let originalReviews;
beforeAll(() => {
  originalReviews = fs.readFileSync(reviewsFile, 'utf-8');
});
afterEach(() => {
  fs.writeFileSync(reviewsFile, originalReviews);
});

const app = express();
app.use(express.json());
app.use(
  '/api',
  createApiRouter({
    usersFile,
    booksFile,
    reviewsFile,
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

describe('GET /api/reviews/:bookId', () => {
  it('should return reviews for a book that exists', async () => {
    const res = await request(app).get('/api/reviews/1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should return only reviews for the requested bookId', async () => {
    const res = await request(app).get('/api/reviews/1');
    expect(res.statusCode).toBe(200);
    res.body.forEach((review) => {
      expect(review.bookId).toBe('1');
    });
  });

  it('should return review objects with expected fields', async () => {
    const res = await request(app).get('/api/reviews/1');
    expect(res.statusCode).toBe(200);
    const review = res.body[0];
    expect(review).toHaveProperty('id');
    expect(review).toHaveProperty('bookId');
    expect(review).toHaveProperty('username');
    expect(review).toHaveProperty('rating');
    expect(review).toHaveProperty('comment');
    expect(review).toHaveProperty('createdAt');
  });

  it('should return an empty array for a book with no reviews', async () => {
    const res = await request(app).get('/api/reviews/50');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should return 404 for a book that does not exist', async () => {
    const res = await request(app).get('/api/reviews/nonexistent-999');
    expect(res.statusCode).toBe(404);
  });
});

describe('POST /api/reviews', () => {
  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .send({ bookId: '1', rating: 5, comment: 'Great book' });
    expect(res.statusCode).toBe(401);
  });

  it('should return 400 when bookId is missing', async () => {
    const token = getToken('user1');
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5, comment: 'Great book' });
    expect(res.statusCode).toBe(400);
  });

  it('should return 400 when rating is missing', async () => {
    const token = getToken('user1');
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: '1', comment: 'Great book' });
    expect(res.statusCode).toBe(400);
  });

  it('should return 400 when rating is out of range', async () => {
    const token = getToken('user1');
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: '1', rating: 6, comment: 'Too high' });
    expect(res.statusCode).toBe(400);
  });

  it('should return 404 when bookId does not exist', async () => {
    const token = getToken('user1');
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: 'nonexistent-999', rating: 3, comment: 'Hmm' });
    expect(res.statusCode).toBe(404);
  });

  it('should return 201 and the created review when valid', async () => {
    const token = getToken('user1');
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: '3', rating: 4, comment: 'Loved it' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.bookId).toBe('3');
    expect(res.body.rating).toBe(4);
    expect(res.body.comment).toBe('Loved it');
    expect(res.body.username).toBe('user1');
  });

  it('should persist the new review so GET returns it', async () => {
    const token = getToken('user1');
    await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: '3', rating: 4, comment: 'Loved it' });
    const getRes = await request(app).get('/api/reviews/3');
    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.some((r) => r.comment === 'Loved it')).toBe(true);
  });
});

describe('DELETE /api/reviews/:reviewId', () => {
  it('should return 401 when no token is provided', async () => {
    const res = await request(app).delete('/api/reviews/1111111111111');
    expect(res.statusCode).toBe(401);
  });

  it('should return 404 when the review does not exist', async () => {
    const token = getToken('user1');
    const res = await request(app)
      .delete('/api/reviews/nonexistent-review')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });

  it('should return 403 when a user tries to delete another user\'s review', async () => {
    const token = getToken('user2');
    // generated-by-copilot: review 1111111111111 belongs to user1, not user2
    const res = await request(app)
      .delete('/api/reviews/1111111111111')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
  });

  it('should return 204 and remove the review when the author deletes it', async () => {
    const token = getToken('user1');
    const res = await request(app)
      .delete('/api/reviews/1111111111111')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(204);
  });

  it('should persist the deletion so GET no longer returns the deleted review', async () => {
    const token = getToken('user1');
    await request(app)
      .delete('/api/reviews/1111111111111')
      .set('Authorization', `Bearer ${token}`);
    const getRes = await request(app).get('/api/reviews/1');
    const ids = getRes.body.map((r) => r.id);
    expect(ids).not.toContain('1111111111111');
  });
});
