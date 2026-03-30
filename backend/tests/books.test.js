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

// generated-by-copilot: GET /api/books — list all books (public endpoint)
describe('GET /api/books', () => {
  it('should return 200 and an array of books without authentication', async () => {
    const res = await request(app).get('/api/books');
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
  });

  it('should return 200 and an array of books when authenticated', async () => {
    const token = getToken('user1');
    const res = await request(app)
      .get('/api/books')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
  });

  it('should return books with expected fields (id, title, author, genre)', async () => {
    const res = await request(app).get('/api/books');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    const book = res.body[0];
    expect(book).toHaveProperty('id', '1');
    expect(book).toHaveProperty('title', 'To Kill a Mockingbird');
    expect(book).toHaveProperty('author', 'Harper Lee');
    expect(book).toHaveProperty('genre', 'Fiction');
  });
});

// generated-by-copilot: GET /api/books/search — title/author search with pagination
describe('GET /api/books/search', () => {
  it('should return 400 when query parameter q is missing', async () => {
    const res = await request(app).get('/api/books/search');
    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 when query parameter q is empty string', async () => {
    const res = await request(app).get('/api/books/search?q=');
    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return matching books for a valid title query', async () => {
    const res = await request(app).get('/api/books/search?q=Mockingbird');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body).toHaveProperty('query', 'Mockingbird');
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].title).toBe('To Kill a Mockingbird');
  });

  it('should return matching books for a valid author query', async () => {
    const res = await request(app).get('/api/books/search?q=Orwell');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].title).toBe('1984');
    expect(res.body.data[0].author).toBe('George Orwell');
  });

  it('should perform case-insensitive search', async () => {
    const res = await request(app).get('/api/books/search?q=pride');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].title).toBe('Pride and Prejudice');
  });

  it('should return empty data array when no books match the query', async () => {
    const res = await request(app).get('/api/books/search?q=zzznomatch999');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBe(0);
    expect(res.body.pagination.total).toBe(0);
  });

  it('should return correct pagination metadata', async () => {
    const res = await request(app).get('/api/books/search?q=a&page=1&limit=2');
    expect(res.statusCode).toBe(200);
    expect(res.body.pagination).toMatchObject({
      page: 1,
      limit: 2,
    });
    expect(res.body.data.length).toBeLessThanOrEqual(2);
  });
});

// generated-by-copilot: GET /api/books/stats — total books and favorited books counts
describe('GET /api/books/stats', () => {
  it('should return 200 with totalBooks and favoritedBooks', async () => {
    const res = await request(app).get('/api/books/stats');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('totalBooks');
    expect(res.body).toHaveProperty('favoritedBooks');
  });

  it('should return numeric values for totalBooks and favoritedBooks', async () => {
    const res = await request(app).get('/api/books/stats');
    expect(res.statusCode).toBe(200);
    expect(typeof res.body.totalBooks).toBe('number');
    expect(typeof res.body.favoritedBooks).toBe('number');
  });

  it('should return totalBooks count matching the books catalog', async () => {
    const res = await request(app).get('/api/books/stats');
    expect(res.statusCode).toBe(200);
    expect(res.body.totalBooks).toBeGreaterThan(0);
  });

  it('should return favoritedBooks count that does not exceed totalBooks', async () => {
    const res = await request(app).get('/api/books/stats');
    expect(res.statusCode).toBe(200);
    expect(res.body.favoritedBooks).toBeLessThanOrEqual(res.body.totalBooks);
  });
});

// generated-by-copilot: Edge-case books — special characters in titles/authors and long title strings
// generated-by-copilot: All assertions use actual book data confirmed present in test-books.json
describe('GET /api/books — edge-case book data', () => {
  let books;
  beforeAll(async () => {
    const res = await request(app).get('/api/books');
    books = res.body;
  });

  // generated-by-copilot: hyphenated titles
  it('should return "Moby-Dick" with hyphen preserved in title (id "5")', () => {
    const book = books.find((b) => b.id === '5');
    expect(book).toBeDefined();
    expect(book.title).toBe('Moby-Dick');
    expect(book.author).toBe('Herman Melville');
  });

  it('should return "Catch-22" with hyphen and number preserved in title (id "34")', () => {
    const book = books.find((b) => b.id === '34');
    expect(book).toBeDefined();
    expect(book.title).toBe('Catch-22');
    expect(book.author).toBe('Joseph Heller');
  });

  it('should return "Slaughterhouse-Five" with hyphen preserved in title (id "47")', () => {
    const book = books.find((b) => b.id === '47');
    expect(book).toBeDefined();
    expect(book.title).toBe('Slaughterhouse-Five');
    expect(book.author).toBe('Kurt Vonnegut');
  });

  // generated-by-copilot: accented characters in titles
  it('should return "Les Misérables" with accented é preserved in title (id "24")', () => {
    const book = books.find((b) => b.id === '24');
    expect(book).toBeDefined();
    expect(book.title).toBe('Les Misérables');
    expect(book.author).toBe('Victor Hugo');
  });

  // generated-by-copilot: accented characters in author names
  it('should return "Wuthering Heights" with ë diacritic preserved in author "Emily Brontë" (id "13")', () => {
    const book = books.find((b) => b.id === '13');
    expect(book).toBeDefined();
    expect(book.title).toBe('Wuthering Heights');
    expect(book.author).toBe('Emily Brontë');
  });

  it('should return "Jane Eyre" with ë diacritic preserved in author "Charlotte Brontë" (id "14")', () => {
    const book = books.find((b) => b.id === '14');
    expect(book).toBeDefined();
    expect(book.title).toBe('Jane Eyre');
    expect(book.author).toBe('Charlotte Brontë');
  });

  // generated-by-copilot: dotted initials in author names
  it('should return "The Catcher in the Rye" with dotted initials "J.D. Salinger" preserved (id "7")', () => {
    const book = books.find((b) => b.id === '7');
    expect(book).toBeDefined();
    expect(book.author).toBe('J.D. Salinger');
  });

  it('should return "The Hobbit" with multi-dotted initials "J.R.R. Tolkien" preserved (id "8")', () => {
    const book = books.find((b) => b.id === '8');
    expect(book).toBeDefined();
    expect(book.author).toBe('J.R.R. Tolkien');
  });

  it('should return "The Lord of the Rings" with multi-dotted initials "J.R.R. Tolkien" preserved (id "16")', () => {
    const book = books.find((b) => b.id === '16');
    expect(book).toBeDefined();
    expect(book.title).toBe('The Lord of the Rings');
    expect(book.author).toBe('J.R.R. Tolkien');
  });

  // generated-by-copilot: long title strings (>22 characters)
  it('should return "The Picture of Dorian Gray" with full 26-character title intact (id "30")', () => {
    const book = books.find((b) => b.id === '30');
    expect(book).toBeDefined();
    expect(book.title).toBe('The Picture of Dorian Gray');
    expect(book.title.length).toBe(26);
  });

  it('should return "The Count of Monte Cristo" with full 25-character title intact (id "31")', () => {
    const book = books.find((b) => b.id === '31');
    expect(book).toBeDefined();
    expect(book.title).toBe('The Count of Monte Cristo');
    expect(book.title.length).toBe(25);
  });

  it('should return "The Old Man and the Sea" with full 23-character title intact (id "32")', () => {
    const book = books.find((b) => b.id === '32');
    expect(book).toBeDefined();
    expect(book.title).toBe('The Old Man and the Sea');
    expect(book.title.length).toBe(23);
  });
});

// generated-by-copilot: Edge-case search — special characters and long titles via GET /api/books/search
describe('GET /api/books/search — edge-case queries', () => {
  // generated-by-copilot: hyphen in search query
  it('should find "Moby-Dick" when searching with hyphen in query', async () => {
    const res = await request(app).get('/api/books/search?q=Moby-Dick');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].title).toBe('Moby-Dick');
  });

  it('should find "Catch-22" when searching with hyphen-and-number query', async () => {
    const res = await request(app).get('/api/books/search?q=Catch-22');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].title).toBe('Catch-22');
  });

  // generated-by-copilot: accented character in search query
  it('should find "Les Misérables" when searching with accented é in query', async () => {
    const res = await request(app).get(
      `/api/books/search?q=${encodeURIComponent('Misérables')}`
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].title).toBe('Les Misérables');
  });

  // generated-by-copilot: accented character in author search
  it('should find "Wuthering Heights" when searching by author "Brontë" with diacritic', async () => {
    const res = await request(app).get(
      `/api/books/search?q=${encodeURIComponent('Brontë')}`
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    const titles = res.body.data.map((b) => b.title);
    expect(titles).toContain('Wuthering Heights');
    expect(titles).toContain('Jane Eyre');
  });

  // generated-by-copilot: dotted initials in author search
  it('should find books by "J.R.R. Tolkien" when searching with dotted initials', async () => {
    const res = await request(app).get(
      `/api/books/search?q=${encodeURIComponent('J.R.R.')}`
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    const titles = res.body.data.map((b) => b.title);
    expect(titles).toContain('The Hobbit');
    expect(titles).toContain('The Lord of the Rings');
  });

  // generated-by-copilot: long title substring search
  it('should find "The Picture of Dorian Gray" when searching with a long title substring', async () => {
    const res = await request(app).get(
      `/api/books/search?q=${encodeURIComponent('Picture of Dorian')}`
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].title).toBe('The Picture of Dorian Gray');
  });

  it('should find "The Count of Monte Cristo" when searching with a long title substring', async () => {
    const res = await request(app).get(
      `/api/books/search?q=${encodeURIComponent('Count of Monte Cristo')}`
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].title).toBe('The Count of Monte Cristo');
  });
});
