/**
 * __tests__/auth.test.js
 * Tests for controllers/auth.js
 */

const {
  mockRequest,
  mockResponse,
  mockNext,
  sampleUser
} = require('./helpers/testSetup');

jest.mock('../models/User');

const User = require('../models/User');

const {
  register,
  login,
  logout,
  getMe
} = require('../controllers/auth');

describe('Auth Controller', () => {
  let res;
  let consoleLogSpy;
  let originalNodeEnv;

  beforeEach(() => {
    res = mockResponse();
    jest.clearAllMocks();

    originalNodeEnv = process.env.NODE_ENV;

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    consoleLogSpy.mockRestore();
  });

  describe('register', () => {
    it('should register a new user and return a token', async () => {
      const user = sampleUser();

      User.create = jest.fn().mockResolvedValue(user);

      const req = mockRequest({
        body: {
          name: user.name,
          email: user.email,
          tel: user.tel,
          password: 'password123',
          role: 'user'
        }
      });

      await register(req, res, mockNext);

      expect(User.create).toHaveBeenCalledWith({
        name: user.name,
        email: user.email,
        tel: user.tel,
        password: 'password123',
        role: 'user'
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: 'mocktoken123'
        })
      );
    });

    it('should set secure cookie when NODE_ENV is production during register', async () => {
      process.env.NODE_ENV = 'production';

      const user = sampleUser();

      User.create = jest.fn().mockResolvedValue(user);

      const req = mockRequest({
        body: {
          name: user.name,
          email: user.email,
          tel: user.tel,
          password: 'password123',
          role: 'user'
        }
      });

      await register(req, res, mockNext);

      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        'mocktoken123',
        expect.objectContaining({
          httpOnly: true,
          secure: true
        })
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: 'mocktoken123'
        })
      );
    });

    it('should return 400 when User.create throws duplicate email error', async () => {
      User.create = jest
        .fn()
        .mockRejectedValue(new Error('Duplicate email'));

      const req = mockRequest({
        body: {
          email: 'dup@example.com'
        }
      });

      await register(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('should return 400 when required fields are missing', async () => {
      User.create = jest
        .fn()
        .mockRejectedValue(new Error('Validation failed: name is required'));

      const req = mockRequest({
        body: {
          email: 'test@example.com'
        }
      });

      await register(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });
  });

  describe('login', () => {
    it('should login successfully and return a token', async () => {
      const user = sampleUser();

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(user)
      });

      user.matchPassword.mockResolvedValue(true);

      const req = mockRequest({
        body: {
          email: user.email,
          password: 'password123'
        }
      });

      await login(req, res, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({
        email: user.email
      });

      expect(user.matchPassword).toHaveBeenCalledWith('password123');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: 'mocktoken123'
        })
      );
    });

    it('should set secure cookie when NODE_ENV is production during login', async () => {
      process.env.NODE_ENV = 'production';

      const user = sampleUser();

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(user)
      });

      user.matchPassword.mockResolvedValue(true);

      const req = mockRequest({
        body: {
          email: user.email,
          password: 'password123'
        }
      });

      await login(req, res, mockNext);

      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        'mocktoken123',
        expect.objectContaining({
          httpOnly: true,
          secure: true
        })
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 when email is missing', async () => {
      const req = mockRequest({
        body: {
          password: 'password123'
        }
      });

      await login(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );

      expect(User.findOne).not.toHaveBeenCalled();
    });

    it('should return 400 when password is missing', async () => {
      const req = mockRequest({
        body: {
          email: 'test@example.com'
        }
      });

      await login(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );

      expect(User.findOne).not.toHaveBeenCalled();
    });

    it('should return 400 when user is not found', async () => {
      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const req = mockRequest({
        body: {
          email: 'notfound@example.com',
          password: 'pass123'
        }
      });

      await login(req, res, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({
        email: 'notfound@example.com'
      });

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          msg: 'Invalid credentials'
        })
      );
    });

    it('should return 401 when password does not match', async () => {
      const user = sampleUser();

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(user)
      });

      user.matchPassword.mockResolvedValue(false);

      const req = mockRequest({
        body: {
          email: user.email,
          password: 'wrongpassword'
        }
      });

      await login(req, res, mockNext);

      expect(user.matchPassword).toHaveBeenCalledWith('wrongpassword');

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          msg: 'Invalid credentials'
        })
      );
    });

    it('should return 401 when User.findOne throws unexpected error', async () => {
      User.findOne = jest.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const req = mockRequest({
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      });

      await login(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('should return 401 when matchPassword throws unexpected error', async () => {
      const user = sampleUser();

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(user)
      });

      user.matchPassword.mockRejectedValue(new Error('Password compare error'));

      const req = mockRequest({
        body: {
          email: user.email,
          password: 'password123'
        }
      });

      await login(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });
  });

  describe('logout', () => {
    it('should clear the token cookie and return success', async () => {
      const req = mockRequest();

      await logout(req, res, mockNext);

      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        'none',
        expect.objectContaining({
          httpOnly: true
        })
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });

  describe('getMe', () => {
    it('should return the current logged-in user', async () => {
      const user = sampleUser();

      User.findById = jest.fn().mockResolvedValue(user);

      const req = mockRequest({
        user: {
          id: user._id.toString()
        }
      });

      await getMe(req, res, mockNext);

      expect(User.findById).toHaveBeenCalledWith(user._id.toString());

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: user
      });
    });

    it('should return success with null data when user is not found', async () => {
      User.findById = jest.fn().mockResolvedValue(null);

      const req = mockRequest({
        user: {
          id: 'missing-user-id'
        }
      });

      await getMe(req, res, mockNext);

      expect(User.findById).toHaveBeenCalledWith('missing-user-id');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: null
      });
    });
  });
});