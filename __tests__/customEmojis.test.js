/**
 * __tests__/customEmojis.test.js
 * Tests for controllers/customEmojis.js
 */

const {
  mockRequest,
  mockResponse,
  mockNext,
  sampleEmoji,
  sampleAdmin,
  createUserId,
  createEmojiId
} = require('./helpers/testSetup');

jest.mock('../models/CustomEmoji');
jest.mock('../models/Reaction');
jest.mock('../config/cloudinary');

const CustomEmoji = require('../models/CustomEmoji');
const Reaction = require('../models/Reaction');
const cloudinary = require('../config/cloudinary');

cloudinary.uploader = {
  upload_stream: jest.fn(),
  destroy: jest.fn().mockResolvedValue({ result: 'ok' })
};

const {
  uploadCustomEmoji,
  getAllCustomEmojis,
  getMyCustomEmojis,
  deleteCustomEmoji
} = require('../controllers/customEmojis');

describe('CustomEmoji Controller', () => {
  let res;
  let userId;
  let consoleErrorSpy;

  beforeEach(() => {
    res = mockResponse();
    userId = createUserId();

    jest.clearAllMocks();

    cloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' });

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('uploadCustomEmoji', () => {
    it('should return 400 when no file is provided', async () => {
      const req = mockRequest({
        user: {
          id: userId.toString()
        },
        file: null,
        body: {
          name: 'my-emoji'
        }
      });

      await uploadCustomEmoji(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please upload an image'
      });

      expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
      expect(CustomEmoji.create).not.toHaveBeenCalled();
    });

    it('should return 400 when name is missing', async () => {
      const req = mockRequest({
        user: {
          id: userId.toString()
        },
        file: {
          buffer: Buffer.from('fake-image-data')
        },
        body: {}
      });

      await uploadCustomEmoji(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please add emoji name'
      });

      expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
      expect(CustomEmoji.create).not.toHaveBeenCalled();
    });

    it('should upload emoji to Cloudinary and create DB record', async () => {
      const emojiDoc = sampleEmoji(userId);

      const cloudResult = {
        secure_url: 'https://res.cloudinary.com/test/image/upload/custom-emojis/abc.png',
        public_id: 'custom-emojis/abc',
        width: 64,
        height: 64
      };

      const streamEndMock = jest.fn();

      cloudinary.uploader.upload_stream.mockImplementation((options, cb) => {
        cb(null, cloudResult);
        return {
          end: streamEndMock
        };
      });

      CustomEmoji.create = jest.fn().mockResolvedValue(emojiDoc);

      const req = mockRequest({
        user: {
          id: userId.toString()
        },
        file: {
          buffer: Buffer.from('fake-image-data')
        },
        body: {
          name: 'my-emoji'
        }
      });

      await uploadCustomEmoji(req, res, mockNext);

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'custom-emojis',
          resource_type: 'image'
        }),
        expect.any(Function)
      );

      expect(streamEndMock).toHaveBeenCalledWith(req.file.buffer);

      expect(CustomEmoji.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'my-emoji',
          imageUrl: cloudResult.secure_url,
          publicId: cloudResult.public_id,
          user: userId.toString()
        })
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: emojiDoc
      });
    });

    it('should return 500 when Cloudinary upload fails', async () => {
      cloudinary.uploader.upload_stream.mockImplementation((options, cb) => {
        cb(new Error('Cloudinary error'), null);
        return {
          end: jest.fn()
        };
      });

      const req = mockRequest({
        user: {
          id: userId.toString()
        },
        file: {
          buffer: Buffer.from('fake-image-data')
        },
        body: {
          name: 'bad-emoji'
        }
      });

      await uploadCustomEmoji(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Cannot upload image',
          error: 'Cloudinary error'
        })
      );
    });

    it('should return 500 when CustomEmoji.create fails', async () => {
      const cloudResult = {
        secure_url: 'https://res.cloudinary.com/test/image/upload/custom-emojis/abc.png',
        public_id: 'custom-emojis/abc'
      };

      cloudinary.uploader.upload_stream.mockImplementation((options, cb) => {
        cb(null, cloudResult);
        return {
          end: jest.fn()
        };
      });

      CustomEmoji.create = jest.fn().mockRejectedValue(new Error('DB error'));

      const req = mockRequest({
        user: {
          id: userId.toString()
        },
        file: {
          buffer: Buffer.from('fake-image-data')
        },
        body: {
          name: 'my-emoji'
        }
      });

      await uploadCustomEmoji(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Cannot upload image',
          error: 'DB error'
        })
      );
    });
  });

  describe('getAllCustomEmojis', () => {
    it('should return all active custom emojis', async () => {
      const emojis = [
        sampleEmoji(userId),
        sampleEmoji(createUserId())
      ];

      const sortMock = jest.fn().mockResolvedValue(emojis);
      const populateMock = jest.fn().mockReturnValue({
        sort: sortMock
      });

      CustomEmoji.find = jest.fn().mockReturnValue({
        populate: populateMock
      });

      const req = mockRequest();

      await getAllCustomEmojis(req, res, mockNext);

      expect(CustomEmoji.find).toHaveBeenCalledWith({
        status: 'active'
      });

      expect(populateMock).toHaveBeenCalledWith('user', 'name email');
      expect(sortMock).toHaveBeenCalledWith('-createdAt');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: emojis
      });
    });

    it('should return 500 when getAllCustomEmojis has DB error', async () => {
      CustomEmoji.find = jest.fn().mockImplementation(() => {
        throw new Error('DB error');
      });

      const req = mockRequest();

      await getAllCustomEmojis(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Cannot get custom emojis',
          error: 'DB error'
        })
      );
    });
  });

  describe('getMyCustomEmojis', () => {
    it('should return emojis belonging to the current user', async () => {
      const emojis = [
        sampleEmoji(userId),
        sampleEmoji(userId)
      ];

      const sortMock = jest.fn().mockResolvedValue(emojis);

      CustomEmoji.find = jest.fn().mockReturnValue({
        sort: sortMock
      });

      const req = mockRequest({
        user: {
          id: userId.toString()
        }
      });

      await getMyCustomEmojis(req, res, mockNext);

      expect(CustomEmoji.find).toHaveBeenCalledWith({
        user: userId.toString()
      });

      expect(sortMock).toHaveBeenCalledWith('-createdAt');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: emojis
      });
    });

    it('should return 500 when getMyCustomEmojis has DB error', async () => {
      CustomEmoji.find = jest.fn().mockImplementation(() => {
        throw new Error('DB error');
      });

      const req = mockRequest({
        user: {
          id: userId.toString()
        }
      });

      await getMyCustomEmojis(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Cannot get custom emojis'
        })
      );
    });
  });

  describe('deleteCustomEmoji', () => {
    it('should delete own emoji and related reactions', async () => {
      const emoji = sampleEmoji(userId);

      emoji.user = {
        toString: () => userId.toString()
      };

      emoji.deleteOne = jest.fn().mockResolvedValue({});

      CustomEmoji.findById = jest.fn().mockResolvedValue(emoji);
      Reaction.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 2 });

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: emoji._id.toString()
        }
      });

      await deleteCustomEmoji(req, res, mockNext);

      expect(CustomEmoji.findById).toHaveBeenCalledWith(emoji._id.toString());

      expect(Reaction.deleteMany).toHaveBeenCalledWith({
        customEmoji: emoji._id
      });

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(emoji.publicId);
      expect(emoji.deleteOne).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Custom emoji and related reactions deleted',
        data: {}
      });
    });

    it('should delete emoji even if publicId is missing', async () => {
      const emoji = sampleEmoji(userId);

      emoji.user = {
        toString: () => userId.toString()
      };

      emoji.publicId = undefined;
      emoji.deleteOne = jest.fn().mockResolvedValue({});

      CustomEmoji.findById = jest.fn().mockResolvedValue(emoji);
      Reaction.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 1 });

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: emoji._id.toString()
        }
      });

      await deleteCustomEmoji(req, res, mockNext);

      expect(Reaction.deleteMany).toHaveBeenCalledWith({
        customEmoji: emoji._id
      });

      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
      expect(emoji.deleteOne).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 when emoji does not exist', async () => {
      const emojiId = createEmojiId();

      CustomEmoji.findById = jest.fn().mockResolvedValue(null);

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: emojiId.toString()
        }
      });

      await deleteCustomEmoji(req, res, mockNext);

      expect(CustomEmoji.findById).toHaveBeenCalledWith(emojiId.toString());

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Custom emoji not found'
      });

      expect(Reaction.deleteMany).not.toHaveBeenCalled();
      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not owner and not admin', async () => {
      const otherId = createUserId();
      const emoji = sampleEmoji(otherId);

      emoji.user = {
        toString: () => otherId.toString()
      };

      CustomEmoji.findById = jest.fn().mockResolvedValue(emoji);

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: emoji._id.toString()
        }
      });

      await deleteCustomEmoji(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized to delete this emoji'
      });

      expect(Reaction.deleteMany).not.toHaveBeenCalled();
      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
      expect(emoji.deleteOne).not.toHaveBeenCalled();
    });

    it('should allow admin to delete any emoji', async () => {
      const admin = sampleAdmin();
      const ownerId = createUserId();
      const emoji = sampleEmoji(ownerId);

      emoji.user = {
        toString: () => ownerId.toString()
      };

      emoji.deleteOne = jest.fn().mockResolvedValue({});

      CustomEmoji.findById = jest.fn().mockResolvedValue(emoji);
      Reaction.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 3 });

      const req = mockRequest({
        user: {
          id: admin._id.toString(),
          role: 'admin'
        },
        params: {
          id: emoji._id.toString()
        }
      });

      await deleteCustomEmoji(req, res, mockNext);

      expect(Reaction.deleteMany).toHaveBeenCalledWith({
        customEmoji: emoji._id
      });

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(emoji.publicId);
      expect(emoji.deleteOne).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 when CustomEmoji.findById throws error', async () => {
      CustomEmoji.findById = jest.fn().mockRejectedValue(new Error('DB error'));

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: createEmojiId().toString()
        }
      });

      await deleteCustomEmoji(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Cannot delete custom emoji',
          error: 'DB error'
        })
      );
    });

    it('should return 500 when Reaction.deleteMany throws error', async () => {
      const emoji = sampleEmoji(userId);

      emoji.user = {
        toString: () => userId.toString()
      };

      CustomEmoji.findById = jest.fn().mockResolvedValue(emoji);
      Reaction.deleteMany = jest.fn().mockRejectedValue(new Error('Reaction delete error'));

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: emoji._id.toString()
        }
      });

      await deleteCustomEmoji(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Cannot delete custom emoji',
          error: 'Reaction delete error'
        })
      );
    });
  });
});