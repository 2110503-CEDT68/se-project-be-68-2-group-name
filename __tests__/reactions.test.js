/**
 * __tests__/reactions.test.js
 * Tests for controllers/reactions.js
 */

const {
  mockRequest,
  mockResponse,
  mockNext,
  sampleUser,
  sampleComment,
  sampleEmoji,
  sampleReaction,
  createUserId,
  createCommentId,
  createEmojiId
} = require('./helpers/testSetup');

jest.mock('../models/Reaction');
jest.mock('../models/Comment');
jest.mock('../models/CustomEmoji');

const Reaction = require('../models/Reaction');
const Comment = require('../models/Comment');
const CustomEmoji = require('../models/CustomEmoji');

const {
  getReactionsByComment,
  toggleReaction
} = require('../controllers/reactions');

describe('Reaction Controller', () => {
  let res;
  let userId;
  let commentId;

  beforeEach(() => {
    res = mockResponse();
    userId = createUserId();
    commentId = createCommentId();
    jest.clearAllMocks();
  });

  describe('getReactionsByComment', () => {
    it('should return all active reactions for a comment', async () => {
      const reactions = [
        sampleReaction(userId, commentId),
        sampleReaction(createUserId(), commentId)
      ];

      const secondPopulate = jest.fn().mockResolvedValue(reactions);
      const firstPopulate = jest.fn().mockReturnValue({
        populate: secondPopulate
      });

      Reaction.find = jest.fn().mockReturnValue({
        populate: firstPopulate
      });

      const req = mockRequest({
        params: {
          commentId: commentId.toString()
        }
      });

      await getReactionsByComment(req, res, mockNext);

      expect(Reaction.find).toHaveBeenCalledWith({
        comment: commentId.toString(),
        status: 'active'
      });

      expect(firstPopulate).toHaveBeenCalledWith('user', 'name email');
      expect(secondPopulate).toHaveBeenCalledWith(
        'customEmoji',
        'name imageUrl status'
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: reactions
      });
    });

    it('should return an empty array when comment has no reactions', async () => {
      const secondPopulate = jest.fn().mockResolvedValue([]);
      const firstPopulate = jest.fn().mockReturnValue({
        populate: secondPopulate
      });

      Reaction.find = jest.fn().mockReturnValue({
        populate: firstPopulate
      });

      const req = mockRequest({
        params: {
          commentId: commentId.toString()
        }
      });

      await getReactionsByComment(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 0,
        data: []
      });
    });

    it('should return 500 when database error occurs', async () => {
      Reaction.find = jest.fn().mockImplementation(() => {
        throw new Error('DB error');
      });

      const req = mockRequest({
        params: {
          commentId: commentId.toString()
        }
      });

      await getReactionsByComment(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Cannot get reactions'
        })
      );
    });
  });

  describe('toggleReaction', () => {
    it('should add a default emoji reaction', async () => {
      const comment = sampleComment(createUserId(), commentId);
      const reaction = sampleReaction(userId, commentId, {
        emojiType: 'default',
        emojiValue: '👍'
      });

      Comment.findById = jest.fn().mockResolvedValue(comment);
      Reaction.findOne = jest.fn().mockResolvedValue(null);
      Reaction.create = jest.fn().mockResolvedValue(reaction);

      const req = mockRequest({
        user: {
          id: userId.toString()
        },
        params: {
          commentId: commentId.toString()
        },
        body: {
          emojiType: 'default',
          emojiValue: '👍'
        }
      });

      await toggleReaction(req, res, mockNext);

      expect(Comment.findById).toHaveBeenCalledWith(commentId.toString());

      expect(Reaction.findOne).toHaveBeenCalledWith({
        comment: commentId.toString(),
        user: userId.toString(),
        emojiValue: '👍'
      });

      expect(Reaction.create).toHaveBeenCalledWith({
        comment: commentId.toString(),
        user: userId.toString(),
        emojiType: 'default',
        emojiValue: '👍',
        customEmoji: undefined
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        action: 'added',
        data: reaction
      });
    });

    it('should remove an existing default reaction when toggled again', async () => {
      const comment = sampleComment(createUserId(), commentId);
      const existingReaction = sampleReaction(userId, commentId, {
        emojiType: 'default',
        emojiValue: '👍'
      });

      existingReaction.deleteOne = jest.fn().mockResolvedValue({});

      Comment.findById = jest.fn().mockResolvedValue(comment);
      Reaction.findOne = jest.fn().mockResolvedValue(existingReaction);

      const req = mockRequest({
        user: {
          id: userId.toString()
        },
        params: {
          commentId: commentId.toString()
        },
        body: {
          emojiType: 'default',
          emojiValue: '👍'
        }
      });

      await toggleReaction(req, res, mockNext);

      expect(existingReaction.deleteOne).toHaveBeenCalled();
      expect(Reaction.create).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        action: 'removed',
        data: {}
      });
    });

    it('should return 404 when comment does not exist', async () => {
      Comment.findById = jest.fn().mockResolvedValue(null);

      const req = mockRequest({
        user: {
          id: userId.toString()
        },
        params: {
          commentId: commentId.toString()
        },
        body: {
          emojiType: 'default',
          emojiValue: '👍'
        }
      });

      await toggleReaction(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Comment not found'
      });

      expect(Reaction.findOne).not.toHaveBeenCalled();
      expect(Reaction.create).not.toHaveBeenCalled();
    });

    it('should return 400 when emojiType is missing', async () => {
      const comment = sampleComment(createUserId(), commentId);

      Comment.findById = jest.fn().mockResolvedValue(comment);

      const req = mockRequest({
        user: {
          id: userId.toString()
        },
        params: {
          commentId: commentId.toString()
        },
        body: {
          emojiValue: '👍'
        }
      });

      await toggleReaction(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide emojiType and emojiValue'
      });

      expect(Reaction.create).not.toHaveBeenCalled();
    });

    it('should return 400 when emojiValue is missing', async () => {
      const comment = sampleComment(createUserId(), commentId);

      Comment.findById = jest.fn().mockResolvedValue(comment);

      const req = mockRequest({
        user: {
          id: userId.toString()
        },
        params: {
          commentId: commentId.toString()
        },
        body: {
          emojiType: 'default'
        }
      });

      await toggleReaction(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide emojiType and emojiValue'
      });

      expect(Reaction.create).not.toHaveBeenCalled();
    });

    it('should return 400 when customEmoji id is missing for custom reaction', async () => {
      const comment = sampleComment(createUserId(), commentId);

      Comment.findById = jest.fn().mockResolvedValue(comment);

      const req = mockRequest({
        user: {
          id: userId.toString()
        },
        params: {
          commentId: commentId.toString()
        },
        body: {
          emojiType: 'custom',
          emojiValue: 'cat smile'
        }
      });

      await toggleReaction(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide customEmoji id'
      });

      expect(CustomEmoji.findById).not.toHaveBeenCalled();
      expect(Reaction.create).not.toHaveBeenCalled();
    });

    it('should return 400 when custom emoji is not found', async () => {
      const emojiId = createEmojiId();
      const comment = sampleComment(createUserId(), commentId);

      Comment.findById = jest.fn().mockResolvedValue(comment);
      CustomEmoji.findById = jest.fn().mockResolvedValue(null);

      const req = mockRequest({
        user: {
          id: userId.toString()
        },
        params: {
          commentId: commentId.toString()
        },
        body: {
          emojiType: 'custom',
          emojiValue: 'cat smile',
          customEmoji: emojiId.toString()
        }
      });

      await toggleReaction(req, res, mockNext);

      expect(CustomEmoji.findById).toHaveBeenCalledWith(emojiId.toString());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Custom emoji is not available'
      });

      expect(Reaction.create).not.toHaveBeenCalled();
    });

    it('should return 400 when custom emoji is disabled', async () => {
      const emojiId = createEmojiId();
      const comment = sampleComment(createUserId(), commentId);
      const disabledEmoji = sampleEmoji(userId, {
        _id: emojiId,
        status: 'disabled'
      });

      Comment.findById = jest.fn().mockResolvedValue(comment);
      CustomEmoji.findById = jest.fn().mockResolvedValue(disabledEmoji);

      const req = mockRequest({
        user: {
          id: userId.toString()
        },
        params: {
          commentId: commentId.toString()
        },
        body: {
          emojiType: 'custom',
          emojiValue: 'cat smile',
          customEmoji: emojiId.toString()
        }
      });

      await toggleReaction(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Custom emoji is not available'
      });

      expect(Reaction.create).not.toHaveBeenCalled();
    });

    it('should add a custom emoji reaction when custom emoji is active', async () => {
      const emojiId = createEmojiId();
      const comment = sampleComment(createUserId(), commentId);
      const emoji = sampleEmoji(userId, {
        _id: emojiId,
        status: 'active'
      });

      const reaction = sampleReaction(userId, commentId, {
        emojiType: 'custom',
        emojiValue: 'cat smile',
        customEmoji: emojiId
      });

      Comment.findById = jest.fn().mockResolvedValue(comment);
      CustomEmoji.findById = jest.fn().mockResolvedValue(emoji);
      Reaction.findOne = jest.fn().mockResolvedValue(null);
      Reaction.create = jest.fn().mockResolvedValue(reaction);

      const req = mockRequest({
        user: {
          id: userId.toString()
        },
        params: {
          commentId: commentId.toString()
        },
        body: {
          emojiType: 'custom',
          emojiValue: 'cat smile',
          customEmoji: emojiId.toString()
        }
      });

      await toggleReaction(req, res, mockNext);

      expect(Reaction.create).toHaveBeenCalledWith({
        comment: commentId.toString(),
        user: userId.toString(),
        emojiType: 'custom',
        emojiValue: 'cat smile',
        customEmoji: emojiId.toString()
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        action: 'added',
        data: reaction
      });
    });

    it('should remove an existing custom emoji reaction when toggled again', async () => {
      const emojiId = createEmojiId();
      const comment = sampleComment(createUserId(), commentId);
      const emoji = sampleEmoji(userId, {
        _id: emojiId,
        status: 'active'
      });

      const existingReaction = sampleReaction(userId, commentId, {
        emojiType: 'custom',
        emojiValue: 'cat smile',
        customEmoji: emojiId
      });

      existingReaction.deleteOne = jest.fn().mockResolvedValue({});

      Comment.findById = jest.fn().mockResolvedValue(comment);
      CustomEmoji.findById = jest.fn().mockResolvedValue(emoji);
      Reaction.findOne = jest.fn().mockResolvedValue(existingReaction);

      const req = mockRequest({
        user: {
          id: userId.toString()
        },
        params: {
          commentId: commentId.toString()
        },
        body: {
          emojiType: 'custom',
          emojiValue: 'cat smile',
          customEmoji: emojiId.toString()
        }
      });

      await toggleReaction(req, res, mockNext);

      expect(existingReaction.deleteOne).toHaveBeenCalled();
      expect(Reaction.create).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        action: 'removed',
        data: {}
      });
    });

    it('should return 500 when unexpected error occurs', async () => {
      Comment.findById = jest.fn().mockRejectedValue(new Error('DB error'));

      const req = mockRequest({
        user: {
          id: userId.toString()
        },
        params: {
          commentId: commentId.toString()
        },
        body: {
          emojiType: 'default',
          emojiValue: '👍'
        }
      });

      await toggleReaction(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Cannot toggle reaction',
          error: 'DB error'
        })
      );
    });
  });
});