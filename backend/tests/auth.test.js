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

// generated-by-copilot: snapshot test-users.json before suite so register tests can restore it
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

// generated-by-copilot: POST /api/register — create a new user account
describe('POST /api/register', () => {
  it('should return 400 when username is empty', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: '', password: 'testpass' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should return 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: 'newuser' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should return 201 and a success message when credentials are valid', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: 'newuser', password: 'newpass' });
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBeDefined();
  });

  it('should return 409 when the username is already taken', async () => {
    await request(app)
      .post('/api/register')
      .send({ username: 'newuser', password: 'newpass' });
    const res = await request(app)
      .post('/api/register')
      .send({ username: 'newuser', password: 'newpass' });
    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe('USER_EXISTS');
  });
});

// generated-by-copilot: POST /api/login — authenticate a user and return a JWT
describe('POST /api/login', () => {
  it('should return 401 when username is empty', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: '', password: 'user1' });
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('should return 401 when password is missing', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'user1' });
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('should return 401 when password is incorrect', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'user1', password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should return 200 and a JWT token when credentials are valid', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'user1', password: 'user1' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});
