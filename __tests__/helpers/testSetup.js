const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ─── Environment ────────────────────────────────────────────────────────────
process.env.JWT_SECRET = 'test_jwt_secret_key_for_jest';
process.env.JWT_EXPIRE = '30d';
process.env.JWT_COOKIE_EXPIRE = '30';
process.env.NODE_ENV = 'test';

// ─── Token helpers ───────────────────────────────────────────────────────────
const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });

// ─── Mock request / response factories ──────────────────────────────────────
const mockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  cookies: {},
  file: null,
  ...overrides
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

// ─── Sample data factories ───────────────────────────────────────────────────
const createUserId   = () => new mongoose.Types.ObjectId();
const createSpaceId  = () => new mongoose.Types.ObjectId();
const createCommentId = () => new mongoose.Types.ObjectId();
const createEmojiId  = () => new mongoose.Types.ObjectId();

const sampleUser = (overrides = {}) => ({
  _id:       createUserId(),
  name:      'Test User',
  email:     'test@example.com',
  tel:       '0812345678',
  role:      'user',
  password:  'hashedpassword123',
  isBlocked: false,
  createdAt: new Date(),
  getSignedJwtToken: jest.fn().mockReturnValue('mocktoken123'),
  matchPassword:     jest.fn().mockResolvedValue(true),
  save:              jest.fn().mockResolvedValue(true),
  ...overrides
});

const sampleAdmin = (overrides = {}) =>
  sampleUser({ role: 'admin', email: 'admin@example.com', ...overrides });

const sampleCoworkingSpace = (overrides = {}) => ({
  _id:             createSpaceId(),
  name:            'Test Space',
  address:         '123 Test St',
  tel:             '0212345678',
  openCloseTime:   '08:00-20:00',
  description:     'A great test space',
  imageUrl:        'https://example.com/image.jpg',
  price:           '500',
  averageRating:   0,
  ratingsQuantity: 0,
  ...overrides
});

const sampleReservation = (userId, spaceId, overrides = {}) => ({
  _id:            new mongoose.Types.ObjectId(),
  resvDate:       new Date('2025-12-01'),
  user:           userId || createUserId(),
  coworkingSpace: spaceId || createSpaceId(),
  capacity:       2,
  totalCost:      1000,
  createdAt:      new Date(),
  deleteOne:      jest.fn().mockResolvedValue({}),
  ...overrides
});

const sampleComment = (userId, spaceId, overrides = {}) => ({
  _id:            createCommentId(),
  message:        'Great place!',
  rating:         5,
  coworkingSpace: spaceId || createSpaceId(),
  user:           userId || createUserId(),
  reportCount:    0,
  reportStatus:   'clean',
  createdAt:      new Date(),
  save:           jest.fn().mockResolvedValue(true),
  deleteOne:      jest.fn().mockResolvedValue({}),
  ...overrides
});

const sampleEmoji = (userId, overrides = {}) => ({
  _id:       createEmojiId(),
  name:      'test-emoji',
  imageUrl:  'https://res.cloudinary.com/test/image/upload/custom-emojis/abc123.png',
  publicId:  'custom-emojis/abc123',
  width:     64,
  height:    64,
  user:      userId || createUserId(),
  status:    'active',
  createdAt: new Date(),
  deleteOne: jest.fn().mockResolvedValue({}),
  ...overrides
});

const sampleReaction = (userId, commentId, overrides = {}) => ({
  _id:        new mongoose.Types.ObjectId(),
  comment:    commentId || createCommentId(),
  user:       userId || createUserId(),
  emojiType:  'default',
  emojiValue: '👍',
  status:     'active',
  createdAt:  new Date(),
  deleteOne:  jest.fn().mockResolvedValue({}),
  ...overrides
});

module.exports = {
  generateToken,
  mockRequest,
  mockResponse,
  mockNext,
  createUserId,
  createSpaceId,
  createCommentId,
  createEmojiId,
  sampleUser,
  sampleAdmin,
  sampleCoworkingSpace,
  sampleReservation,
  sampleComment,
  sampleEmoji,
  sampleReaction
};
