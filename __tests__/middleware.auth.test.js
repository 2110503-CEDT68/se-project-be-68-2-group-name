/**
 * __tests__/middleware.auth.test.js
 * Tests for middleware/auth.js
 */

const {
  mockRequest,
  mockResponse,
  sampleUser,
  createUserId,
  generateToken
} = require('./helpers/testSetup');

jest.mock('../models/User');

const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

describe('Auth Middleware', () => {
  let res;
  let next;

  beforeEach(() => {
    res = mockResponse();
    next = jest.fn();
    jest.clearAllMocks();

    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
  });

  describe('protect', () => {
    it('should call next() when a valid Bearer token is provided', async () => {
      const user = sampleUser();
      const token = generateToken(user._id.toString());

      User.findById = jest.fn().mockResolvedValue(user);

      const req = mockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });

      await protect(req, res, next);

      expect(User.findById).toHaveBeenCalledWith(user._id.toString());
      expect(req.user).toEqual(user);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header is missing', async () => {
      const req = mockRequest({
        headers: {}
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header is not Bearer token', async () => {
      const req = mockRequest({
        headers: {
          authorization: 'Basic abc123'
        }
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is string null', async () => {
      const req = mockRequest({
        headers: {
          authorization: 'Bearer null'
        }
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', async () => {
      const req = mockRequest({
        headers: {
          authorization: 'Bearer invalid.token.value'
        }
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not found in database', async () => {
      const userId = createUserId();
      const token = generateToken(userId.toString());

      User.findById = jest.fn().mockResolvedValue(null);

      const req = mockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });

      await protect(req, res, next);

      expect(User.findById).toHaveBeenCalledWith(userId.toString());
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when User.findById throws an error', async () => {
      const userId = createUserId();
      const token = generateToken(userId.toString());

      User.findById = jest.fn().mockRejectedValue(new Error('DB error'));

      const req = mockRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    it('should call next() when user has required role', () => {
      const req = mockRequest({
        user: {
          role: 'admin'
        }
      });

      authorize('admin')(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next() when user role is in allowed roles', () => {
      const req = mockRequest({
        user: {
          role: 'user'
        }
      });

      authorize('admin', 'user')(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 403 when user role is not allowed', () => {
      const req = mockRequest({
        user: {
          role: 'user'
        }
      });

      authorize('admin')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should include the user role in the 403 message', () => {
      const req = mockRequest({
        user: {
          role: 'user'
        }
      });

      authorize('admin')(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('user')
        })
      );
    });
  });
}); 