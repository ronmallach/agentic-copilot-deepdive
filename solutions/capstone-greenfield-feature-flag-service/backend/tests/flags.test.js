// generated-by-copilot: Tests for flag endpoints
const request = require('supertest');
const app = require('../server');

describe('Feature Flag API', () => {
  let authToken;
  let userToken;

  // generated-by-copilot: Get auth tokens before tests
  beforeAll(async () => {
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'password' });
    authToken = adminRes.body.token;

    const userRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'user', password: 'password' });
    userToken = userRes.body.token;
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'password' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.username).toBe('admin');
    });

    it('should return 401 with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrong' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should return 400 with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/flags', () => {
    it('should return all flags without auth', async () => {
      const res = await request(app).get('/api/flags');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter flags by environment', async () => {
      const res = await request(app).get('/api/flags?environment=production');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach(flag => {
        expect(flag.environment).toBe('production');
      });
    });
  });

  describe('GET /api/flags/:name', () => {
    it('should return a flag by name', async () => {
      const res = await request(app).get('/api/flags/dark-mode');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('dark-mode');
    });

    it('should return 404 for non-existent flag', async () => {
      const res = await request(app).get('/api/flags/non-existent');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Flag not found');
    });
  });

  describe('POST /api/flags', () => {
    it('should create a flag with valid auth', async () => {
      const res = await request(app)
        .post('/api/flags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          name: 'test-flag', 
          description: 'A test flag', 
          environment: 'development' 
        });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('test-flag');
      expect(res.body.enabled).toBe(false);
      expect(res.body.createdBy).toBe('admin');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/flags')
        .send({ name: 'test-flag' });
      expect(res.status).toBe(401);
    });

    it('should return 400 with missing name', async () => {
      const res = await request(app)
        .post('/api/flags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ environment: 'development' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Name is required');
    });

    it('should return 400 with invalid flag name', async () => {
      const res = await request(app)
        .post('/api/flags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          name: 'Invalid_Name', 
          environment: 'development' 
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('kebab-case');
    });

    it('should return 400 with invalid environment', async () => {
      const res = await request(app)
        .post('/api/flags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          name: 'test-flag-2', 
          environment: 'invalid' 
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Environment must be');
    });

    it('should return 409 for duplicate flag name in same environment', async () => {
      // Create first flag
      await request(app)
        .post('/api/flags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          name: 'duplicate-flag', 
          environment: 'development' 
        });
      
      // Try to create duplicate
      const res = await request(app)
        .post('/api/flags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          name: 'duplicate-flag', 
          environment: 'development' 
        });
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Flag name already exists in this environment');
    });
  });

  describe('PUT /api/flags/:name', () => {
    beforeEach(async () => {
      // Create a test flag for each test
      await request(app)
        .post('/api/flags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          name: 'update-test', 
          description: 'Flag for update tests',
          environment: 'development' 
        });
    });

    it('should update a flag with valid auth and ownership', async () => {
      const res = await request(app)
        .put('/api/flags/update-test')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          description: 'Updated description',
          enabled: true 
        });
      expect(res.status).toBe(200);
      expect(res.body.description).toBe('Updated description');
      expect(res.body.enabled).toBe(true);
      expect(res.body.updatedBy).toBe('admin');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .put('/api/flags/update-test')
        .send({ description: 'Updated' });
      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent flag', async () => {
      const res = await request(app)
        .put('/api/flags/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Updated' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/flags/:name', () => {
    beforeEach(async () => {
      // Create a test flag for each test
      await request(app)
        .post('/api/flags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          name: 'delete-test', 
          description: 'Flag for delete tests',
          environment: 'development' 
        });
    });

    it('should delete a flag with valid auth and ownership', async () => {
      const res = await request(app)
        .delete('/api/flags/delete-test')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Flag deleted successfully');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .delete('/api/flags/delete-test');
      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent flag', async () => {
      const res = await request(app)
        .delete('/api/flags/non-existent')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/flags/:name/toggle', () => {
    beforeEach(async () => {
      // Create a test flag for each test
      await request(app)
        .post('/api/flags')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          name: 'toggle-test', 
          description: 'Flag for toggle tests',
          environment: 'development' 
        });
    });

    it('should toggle a flag with valid auth and ownership', async () => {
      const res = await request(app)
        .post('/api/flags/toggle-test/toggle')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.enabled).toBe(true); // Should be flipped from false
      expect(res.body.updatedBy).toBe('admin');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/flags/toggle-test/toggle');
      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent flag', async () => {
      const res = await request(app)
        .post('/api/flags/non-existent/toggle')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/audit-log', () => {
    it('should return audit log with auth', async () => {
      const res = await request(app)
        .get('/api/audit-log')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .get('/api/audit-log');
      expect(res.status).toBe(401);
    });
  });
});