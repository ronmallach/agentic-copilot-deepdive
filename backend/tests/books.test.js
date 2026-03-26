const request = require('supertest');
const express = require('express');
const createApiRouter = require('../routes');
const path = require('path');

const app = express();
app.use(express.json());
app.use('/api', createApiRouter({
  usersFile: path.join(__dirname, '../data/test-users.json'),
  booksFile: path.join(__dirname, '../data/test-books.json'),
  readJSON: (file) => require('fs').existsSync(file) ? JSON.parse(require('fs').readFileSync(file, 'utf-8')) : [],
  writeJSON: (file, data) => require('fs').writeFileSync(file, JSON.stringify(data, null, 2)),
  authenticateToken: (req, res, next) => next(), // No auth for books
  SECRET_KEY: 'test_secret',
}));

describe('Books API', () => {
  it('GET /api/books should return a list of books', async () => {
    const res = await request(app).get('/api/books');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('POST /api/books should not be allowed', async () => {
    const res = await request(app)
      .post('/api/books')
      .send({ title: 'Test Book', author: 'Test Author' });
    expect([404, 405]).toContain(res.statusCode);
  });

  it('GET /api/books/stats should return totalBooks and favoritedBooks', async () => {
    const res = await request(app).get('/api/books/stats');
    expect(res.statusCode).toBe(200);
    expect(typeof res.body.totalBooks).toBe('number');
    expect(typeof res.body.favoritedBooks).toBe('number');
    expect(res.body.totalBooks).toBeGreaterThan(0);
    // generated-by-copilot: sanity invariant - favorited count cannot exceed total books
    expect(res.body.favoritedBooks).toBeLessThanOrEqual(res.body.totalBooks);
    expect(res.body.favoritedBooks).toBeGreaterThanOrEqual(0);
    // generated-by-copilot: derive expected favoritedBooks from fixtures to catch regressions
    const fs = require('fs');
    const booksFixture = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/test-books.json'), 'utf-8'));
    const usersFixture = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/test-users.json'), 'utf-8'));
    const bookIds = new Set(booksFixture.map(b => String(b.id)));
    const expectedFavorited = new Set(
      usersFixture.flatMap(u => (Array.isArray(u.favorites) ? u.favorites : []).filter(id => id != null && bookIds.has(String(id))))
    ).size;
    expect(res.body.favoritedBooks).toBe(expectedFavorited);
  });

  describe('GET /api/books/search', () => {
    it('should search books by title only', async () => {
      const res = await request(app).get('/api/books/search?q=mockingbird');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body).toHaveProperty('query', 'mockingbird');
      expect(res.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: expect.stringContaining('Mockingbird'),
            author: 'Harper Lee'
          })
        ])
      );
    });

    it('should search books by author only', async () => {
      const res = await request(app).get('/api/books/search?q=orwell');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body).toHaveProperty('query', 'orwell');
      expect(res.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: '1984',
            author: expect.stringContaining('Orwell')
          })
        ])
      );
    });

    it('should search books by partial title match case-insensitive', async () => {
      const res = await request(app).get('/api/books/search?q=GREAT');
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: expect.stringContaining('Great'),
            author: 'F. Scott Fitzgerald'
          })
        ])
      );
    });

    it('should search books by partial author match case-insensitive', async () => {
      const res = await request(app).get('/api/books/search?q=jane');
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Pride and Prejudice',
            author: expect.stringContaining('Jane')
          })
        ])
      );
    });

    it('should return paginated search results', async () => {
      const res = await request(app).get('/api/books/search?q=fiction&limit=2&page=1');
      expect(res.statusCode).toBe(200);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
    });

    it('should return empty results for non-matching search', async () => {
      const res = await request(app).get('/api/books/search?q=nonexistentbook');
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(0);
      expect(res.body.pagination.total).toBe(0);
    });

    it('should return 400 when search query is missing', async () => {
      const res = await request(app).get('/api/books/search');
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when search query is empty string', async () => {
      const res = await request(app).get('/api/books/search?q=');
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when search query is only whitespace', async () => {
      const res = await request(app).get('/api/books/search?q=   ');
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
