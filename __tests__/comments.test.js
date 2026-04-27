/**
 * __tests__/comments.test.js
 * Tests for controllers/comments.js
 */

const {
  mockRequest,
  mockResponse,
  mockNext,
  sampleUser,
  sampleAdmin,
  sampleCoworkingSpace,
  sampleComment,
  createUserId,
  createSpaceId,
  createCommentId
} = require('./helpers/testSetup');

jest.mock('../models/Comment');
jest.mock('../models/CoworkingSpace');
jest.mock('../models/User');
jest.mock('../models/Reaction');

const Comment = require('../models/Comment');
const CoworkingSpace = require('../models/CoworkingSpace');
const User = require('../models/User');
const Reaction = require('../models/Reaction');

const {
  getComments,
  getComment,
  addComment,
  updateComment,
  deleteComment,
  reportComment,
  blockUser,
  unblockUser
} = require('../controllers/comments');

describe('Comment Controller', () => {
  let res;
  let userId;
  let spaceId;
  let consoleLogSpy;

  beforeEach(() => {
    res = mockResponse();
    userId = createUserId();
    spaceId = createSpaceId();

    jest.clearAllMocks();

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  const mockCommentFindChain = (comments) => {
    const chain = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(comments)
    };

    Comment.find = jest.fn().mockReturnValue(chain);

    return chain;
  };

  const mockReactionFindChain = (reactions = []) => {
    const secondPopulate = jest.fn().mockResolvedValue(reactions);
    const firstPopulate = jest.fn().mockReturnValue({
      populate: secondPopulate
    });

    Reaction.find = jest.fn().mockReturnValue({
      populate: firstPopulate
    });

    return { firstPopulate, secondPopulate };
  };

  const makeCommentWithToObject = (userId, spaceId, overrides = {}) => {
    const comment = sampleComment(userId, spaceId, overrides);

    comment.toObject = jest.fn().mockReturnValue({
      _id: comment._id,
      message: comment.message,
      rating: comment.rating,
      user: comment.user,
      coworkingSpace: comment.coworkingSpace,
      reportCount: comment.reportCount,
      reportStatus: comment.reportStatus
    });

    return comment;
  };

  describe('getComments', () => {
    it('should return all comments with reactions', async () => {
      const comments = [
        makeCommentWithToObject(userId, spaceId)
      ];

      const reactions = [
        { emojiType: 'default', emojiValue: '❤️' }
      ];

      const commentChain = mockCommentFindChain(comments);
      mockReactionFindChain(reactions);

      const req = mockRequest({
        params: {}
      });

      await getComments(req, res, mockNext);

      expect(Comment.find).toHaveBeenCalledWith();

      expect(commentChain.populate).toHaveBeenCalledWith({
        path: 'user',
        select: 'name email isBlocked'
      });

      expect(commentChain.populate).toHaveBeenCalledWith({
        path: 'coworkingSpace',
        select: 'name address'
      });

      expect(commentChain.sort).toHaveBeenCalledWith('-createdAt');

      expect(Reaction.find).toHaveBeenCalledWith({
        comment: comments[0]._id,
        status: 'active'
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: [
          expect.objectContaining({
            _id: comments[0]._id,
            reactions
          })
        ]
      });
    });

    it('should filter comments by coworkingSpaceId when provided', async () => {
      const comments = [
        makeCommentWithToObject(userId, spaceId)
      ];

      const commentChain = mockCommentFindChain(comments);
      mockReactionFindChain([]);

      const req = mockRequest({
        params: {
          coworkingSpaceId: spaceId.toString()
        }
      });

      await getComments(req, res, mockNext);

      expect(Comment.find).toHaveBeenCalledWith({
        coworkingSpace: spaceId.toString()
      });

      expect(commentChain.populate).toHaveBeenCalledWith({
        path: 'user',
        select: 'name email isBlocked'
      });

      expect(commentChain.sort).toHaveBeenCalledWith('-createdAt');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: [
          expect.objectContaining({
            _id: comments[0]._id,
            reactions: []
          })
        ]
      });
    });

    it('should return 500 on DB error', async () => {
      Comment.find = jest.fn().mockImplementation(() => {
        throw new Error('DB error');
      });

      const req = mockRequest({
        params: {}
      });

      await getComments(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot get comments'
      });
    });

    it('should return 500 when Reaction.find fails', async () => {
      const comments = [
        makeCommentWithToObject(userId, spaceId)
      ];

      mockCommentFindChain(comments);

      Reaction.find = jest.fn().mockImplementation(() => {
        throw new Error('Reaction error');
      });

      const req = mockRequest({
        params: {}
      });

      await getComments(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot get comments'
      });
    });
  });

  describe('getComment', () => {
    it('should return a single comment', async () => {
      const comment = sampleComment(userId, spaceId);

      const secondPopulate = jest.fn().mockResolvedValue(comment);
      const firstPopulate = jest.fn().mockReturnValue({
        populate: secondPopulate
      });

      Comment.findById = jest.fn().mockReturnValue({
        populate: firstPopulate
      });

      const req = mockRequest({
        params: {
          id: comment._id.toString()
        }
      });

      await getComment(req, res, mockNext);

      expect(Comment.findById).toHaveBeenCalledWith(comment._id.toString());

      expect(firstPopulate).toHaveBeenCalledWith({
        path: 'user',
        select: 'name email isBlocked'
      });

      expect(secondPopulate).toHaveBeenCalledWith({
        path: 'coworkingSpace',
        select: 'name address'
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: comment
      });
    });

    it('should return 404 when comment does not exist', async () => {
      const secondPopulate = jest.fn().mockResolvedValue(null);
      const firstPopulate = jest.fn().mockReturnValue({
        populate: secondPopulate
      });

      Comment.findById = jest.fn().mockReturnValue({
        populate: firstPopulate
      });

      const commentId = createCommentId().toString();

      const req = mockRequest({
        params: {
          id: commentId
        }
      });

      await getComment(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: `No comment with the id of ${commentId}`
      });
    });

    it('should return 500 on DB error', async () => {
      Comment.findById = jest.fn().mockImplementation(() => {
        throw new Error('DB error');
      });

      const req = mockRequest({
        params: {
          id: createCommentId().toString()
        }
      });

      await getComment(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot get comment'
      });
    });
  });

  describe('addComment', () => {
    it('should create a comment', async () => {
      const space = sampleCoworkingSpace({
        _id: spaceId
      });

      const user = sampleUser({
        _id: userId
      });

      const comment = sampleComment(userId, spaceId);

      CoworkingSpace.findById = jest.fn().mockResolvedValue(space);
      User.findById = jest.fn().mockResolvedValue(user);
      Comment.create = jest.fn().mockResolvedValue(comment);
      Comment.calculateAverageRating = jest.fn().mockResolvedValue(undefined);

      const req = mockRequest({
        user: {
          id: userId.toString(),
          _id: userId,
          role: 'user'
        },
        params: {
          coworkingSpaceId: spaceId.toString()
        },
        body: {
          message: 'Great place!',
          rating: 5
        }
      });

      await addComment(req, res, mockNext);

      expect(CoworkingSpace.findById).toHaveBeenCalledWith(spaceId.toString());
      expect(User.findById.mock.calls[0][0].toString()).toBe(userId.toString());

      expect(Comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Great place!',
          rating: 5,
          coworkingSpace: spaceId.toString(),
          user: userId.toString()
        })
      );

      expect(Comment.calculateAverageRating).toHaveBeenCalledWith(
        spaceId.toString()
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: comment
      });
    });

    it('should return 400 when coworkingSpaceId is missing', async () => {
      const req = mockRequest({
        user: {
          id: userId.toString(),
          _id: userId
        },
        params: {},
        body: {}
      });

      await addComment(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide coworkingSpaceId in URL'
      });

      expect(CoworkingSpace.findById).not.toHaveBeenCalled();
      expect(Comment.create).not.toHaveBeenCalled();
    });

    it('should return 404 when coworking space does not exist', async () => {
      CoworkingSpace.findById = jest.fn().mockResolvedValue(null);

      const req = mockRequest({
        user: {
          id: userId.toString(),
          _id: userId
        },
        params: {
          coworkingSpaceId: spaceId.toString()
        },
        body: {
          message: 'Nice',
          rating: 4
        }
      });

      await addComment(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: `No CoworkingSpace with the id of ${spaceId.toString()}`
      });

      expect(Comment.create).not.toHaveBeenCalled();
    });

    it('should still create comment even when User.findById returns null', async () => {
      const space = sampleCoworkingSpace({
        _id: spaceId
      });

      const comment = sampleComment(userId, spaceId);

      CoworkingSpace.findById = jest.fn().mockResolvedValue(space);
      User.findById = jest.fn().mockResolvedValue(null);
      Comment.create = jest.fn().mockResolvedValue(comment);
      Comment.calculateAverageRating = jest.fn().mockResolvedValue(undefined);

      const req = mockRequest({
        user: {
          id: userId.toString(),
          _id: userId
        },
        params: {
          coworkingSpaceId: spaceId.toString()
        },
        body: {
          message: 'Nice',
          rating: 4
        }
      });

      await addComment(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(Comment.create).toHaveBeenCalled();
      expect(Comment.calculateAverageRating).toHaveBeenCalledWith(
        spaceId.toString()
      );
    });

    it('should return 403 when the user is blocked', async () => {
      const space = sampleCoworkingSpace({
        _id: spaceId
      });

      const blockedUser = sampleUser({
        _id: userId,
        isBlocked: true
      });

      CoworkingSpace.findById = jest.fn().mockResolvedValue(space);
      User.findById = jest.fn().mockResolvedValue(blockedUser);

      const req = mockRequest({
        user: {
          id: userId.toString(),
          _id: userId
        },
        params: {
          coworkingSpaceId: spaceId.toString()
        },
        body: {
          message: 'Spam',
          rating: 1
        }
      });

      await addComment(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Your account has been blocked. You cannot post comments.'
      });

      expect(Comment.create).not.toHaveBeenCalled();
    });

    it('should return 500 on unexpected error', async () => {
      CoworkingSpace.findById = jest
        .fn()
        .mockRejectedValue(new Error('DB error'));

      const req = mockRequest({
        user: {
          id: userId.toString(),
          _id: userId
        },
        params: {
          coworkingSpaceId: spaceId.toString()
        },
        body: {
          message: 'Nice',
          rating: 4
        }
      });

      await addComment(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot create comment'
      });
    });
  });

  describe('updateComment', () => {
    it('should update own comment', async () => {
      const comment = sampleComment(userId, spaceId);
      const updated = sampleComment(userId, spaceId, {
        message: 'Updated!'
      });

      Comment.findById = jest.fn().mockResolvedValue(comment);
      Comment.findByIdAndUpdate = jest.fn().mockResolvedValue(updated);
      Comment.calculateAverageRating = jest.fn().mockResolvedValue(undefined);

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: comment._id.toString()
        },
        body: {
          message: 'Updated!'
        }
      });

      await updateComment(req, res, mockNext);

      expect(Comment.findById).toHaveBeenCalledWith(comment._id.toString());

      expect(Comment.findByIdAndUpdate).toHaveBeenCalledWith(
        comment._id.toString(),
        req.body,
        {
          new: true,
          runValidators: true
        }
      );

      expect(Comment.calculateAverageRating).toHaveBeenCalledWith(
        updated.coworkingSpace
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: updated
      });
    });

    it('should allow admin to update any comment', async () => {
      const admin = sampleAdmin();

      const comment = sampleComment(userId, spaceId);
      const updated = sampleComment(userId, spaceId, {
        message: 'Admin updated'
      });

      Comment.findById = jest.fn().mockResolvedValue(comment);
      Comment.findByIdAndUpdate = jest.fn().mockResolvedValue(updated);
      Comment.calculateAverageRating = jest.fn().mockResolvedValue(undefined);

      const req = mockRequest({
        user: {
          id: admin._id.toString(),
          role: 'admin'
        },
        params: {
          id: comment._id.toString()
        },
        body: {
          message: 'Admin updated'
        }
      });

      await updateComment(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(Comment.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should return 401 when user is not the owner', async () => {
      const otherId = createUserId();
      const comment = sampleComment(otherId, spaceId);

      Comment.findById = jest.fn().mockResolvedValue(comment);

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: comment._id.toString()
        },
        body: {
          message: 'Hack'
        }
      });

      await updateComment(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: `User ${userId.toString()} is not authorized to update this comment`
      });

      expect(Comment.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should return 404 when comment not found', async () => {
      const commentId = createCommentId().toString();

      Comment.findById = jest.fn().mockResolvedValue(null);

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: commentId
        },
        body: {}
      });

      await updateComment(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: `No comment with the id of ${commentId}`
      });
    });

    it('should return 500 on unexpected error', async () => {
      Comment.findById = jest.fn().mockRejectedValue(new Error('DB error'));

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: createCommentId().toString()
        },
        body: {}
      });

      await updateComment(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot update comment'
      });
    });
  });

  describe('deleteComment', () => {
    it('should delete own comment', async () => {
      const comment = sampleComment(userId, spaceId);
      comment.deleteOne = jest.fn().mockResolvedValue({});

      Comment.findById = jest.fn().mockResolvedValue(comment);
      Comment.calculateAverageRating = jest.fn().mockResolvedValue(undefined);

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: comment._id.toString()
        }
      });

      await deleteComment(req, res, mockNext);

      expect(comment.deleteOne).toHaveBeenCalled();

      expect(Comment.calculateAverageRating).toHaveBeenCalledWith(
        comment.coworkingSpace
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {}
      });
    });

    it('should return 404 when comment not found', async () => {
      const commentId = createCommentId().toString();

      Comment.findById = jest.fn().mockResolvedValue(null);

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: commentId
        }
      });

      await deleteComment(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: `No comment with the id of ${commentId}`
      });
    });

    it('should return 401 when user is not the owner', async () => {
      const otherId = createUserId();
      const comment = sampleComment(otherId, spaceId);

      Comment.findById = jest.fn().mockResolvedValue(comment);

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: comment._id.toString()
        }
      });

      await deleteComment(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: `User ${userId.toString()} is not authorized to delete this comment`
      });

      expect(comment.deleteOne).not.toHaveBeenCalled();
    });

    it('should allow admin to delete any comment', async () => {
      const admin = sampleAdmin();

      const comment = sampleComment(userId, spaceId);
      comment.deleteOne = jest.fn().mockResolvedValue({});

      Comment.findById = jest.fn().mockResolvedValue(comment);
      Comment.calculateAverageRating = jest.fn().mockResolvedValue(undefined);

      const req = mockRequest({
        user: {
          id: admin._id.toString(),
          role: 'admin'
        },
        params: {
          id: comment._id.toString()
        }
      });

      await deleteComment(req, res, mockNext);

      expect(comment.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 on unexpected error', async () => {
      Comment.findById = jest.fn().mockRejectedValue(new Error('DB error'));

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: createCommentId().toString()
        }
      });

      await deleteComment(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot delete comment'
      });
    });
  });

  describe('reportComment', () => {
    it('should increment reportCount and set reportStatus to reported', async () => {
      const comment = sampleComment(userId, spaceId, {
        reportCount: 0,
        reportStatus: 'normal'
      });

      comment.save = jest.fn().mockResolvedValue(comment);

      Comment.findById = jest.fn().mockResolvedValue(comment);

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: comment._id.toString()
        }
      });

      await reportComment(req, res, mockNext);

      expect(comment.reportCount).toBe(1);
      expect(comment.reportStatus).toBe('reported');
      expect(comment.save).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: comment
      });
    });

    it('should return 404 when comment not found', async () => {
      const commentId = createCommentId().toString();

      Comment.findById = jest.fn().mockResolvedValue(null);

      const req = mockRequest({
        user: {
          id: userId.toString()
        },
        params: {
          id: commentId
        }
      });

      await reportComment(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: `No comment with the id of ${commentId}`
      });
    });

    it('should return 500 on unexpected error', async () => {
      Comment.findById = jest.fn().mockRejectedValue(new Error('DB error'));

      const req = mockRequest({
        user: {
          id: userId.toString()
        },
        params: {
          id: createCommentId().toString()
        }
      });

      await reportComment(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot report comment'
      });
    });
  });

  describe('blockUser', () => {
    it('should block a user', async () => {
      const targetUser = sampleUser({
        _id: createUserId()
      });

      targetUser.save = jest.fn().mockResolvedValue(targetUser);

      User.findById = jest.fn().mockResolvedValue(targetUser);

      const req = mockRequest({
        user: {
          id: sampleAdmin()._id.toString(),
          role: 'admin'
        },
        params: {
          userId: targetUser._id.toString()
        }
      });

      await blockUser(req, res, mockNext);

      expect(User.findById).toHaveBeenCalledWith(targetUser._id.toString());
      expect(targetUser.isBlocked).toBe(true);
      expect(targetUser.save).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: `User ${targetUser.name} has been blocked`,
        data: {
          userId: targetUser._id,
          name: targetUser.name,
          isBlocked: true
        }
      });
    });

    it('should return 400 when trying to block an admin', async () => {
      const target = sampleAdmin();

      User.findById = jest.fn().mockResolvedValue(target);

      const req = mockRequest({
        user: {
          id: sampleAdmin()._id.toString(),
          role: 'admin'
        },
        params: {
          userId: target._id.toString()
        }
      });

      await blockUser(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot block an admin account'
      });

      expect(target.save).not.toHaveBeenCalled();
    });

    it('should return 404 when user not found', async () => {
      const targetId = createUserId().toString();

      User.findById = jest.fn().mockResolvedValue(null);

      const req = mockRequest({
        user: {
          id: sampleAdmin()._id.toString()
        },
        params: {
          userId: targetId
        }
      });

      await blockUser(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: `No user found with id ${targetId}`
      });
    });

    it('should return 500 on unexpected error', async () => {
      User.findById = jest.fn().mockRejectedValue(new Error('DB error'));

      const req = mockRequest({
        user: {
          id: sampleAdmin()._id.toString()
        },
        params: {
          userId: createUserId().toString()
        }
      });

      await blockUser(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot block user'
      });
    });
  });

  describe('unblockUser', () => {
    it('should unblock a user', async () => {
      const blockedUser = sampleUser({
        _id: createUserId(),
        isBlocked: true
      });

      blockedUser.save = jest.fn().mockResolvedValue(blockedUser);

      User.findById = jest.fn().mockResolvedValue(blockedUser);

      const req = mockRequest({
        user: {
          id: sampleAdmin()._id.toString(),
          role: 'admin'
        },
        params: {
          userId: blockedUser._id.toString()
        }
      });

      await unblockUser(req, res, mockNext);

      expect(User.findById).toHaveBeenCalledWith(blockedUser._id.toString());
      expect(blockedUser.isBlocked).toBe(false);
      expect(blockedUser.save).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: `User ${blockedUser.name} has been unblocked`,
        data: {
          userId: blockedUser._id,
          name: blockedUser.name,
          isBlocked: false
        }
      });
    });

    it('should return 404 when user not found', async () => {
      const targetId = createUserId().toString();

      User.findById = jest.fn().mockResolvedValue(null);

      const req = mockRequest({
        user: {
          id: sampleAdmin()._id.toString()
        },
        params: {
          userId: targetId
        }
      });

      await unblockUser(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: `No user found with id ${targetId}`
      });
    });

    it('should return 500 on unexpected error', async () => {
      User.findById = jest.fn().mockRejectedValue(new Error('DB error'));

      const req = mockRequest({
        user: {
          id: sampleAdmin()._id.toString()
        },
        params: {
          userId: createUserId().toString()
        }
      });

      await unblockUser(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot unblock user'
      });
    });
  });
});
describe('Comment Model', () => {
  let RealComment;
  let mongoose;

  beforeAll(() => {
    mongoose = require('mongoose');
    RealComment = jest.requireActual('../models/Comment');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('schema validation', () => {
    it('should create a valid comment model', () => {
      const comment = new RealComment({
        message: 'Great coworking space',
        rating: 5,
        coworkingSpace: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId()
      });

      const error = comment.validateSync();

      expect(error).toBeUndefined();
      expect(comment.message).toBe('Great coworking space');
      expect(comment.rating).toBe(5);
      expect(comment.reportCount).toBe(0);
      expect(comment.reportStatus).toBe('clean');
      expect(comment.createdAt).toBeDefined();
    });

    it('should require message', () => {
      const comment = new RealComment({
        rating: 5,
        coworkingSpace: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId()
      });

      const error = comment.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.message.message).toBe('Please add a comment message');
    });

    it('should require rating', () => {
      const comment = new RealComment({
        message: 'Nice place',
        coworkingSpace: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId()
      });

      const error = comment.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.rating.message).toBe('Please add a rating');
    });

    it('should not allow rating lower than 1', () => {
      const comment = new RealComment({
        message: 'Bad',
        rating: 0,
        coworkingSpace: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId()
      });

      const error = comment.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.rating.message).toBe('Rating must be at least 1');
    });

    it('should not allow rating more than 5', () => {
      const comment = new RealComment({
        message: 'Too high',
        rating: 6,
        coworkingSpace: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId()
      });

      const error = comment.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.rating.message).toBe('Rating must not be more than 5');
    });

    it('should not allow message longer than 500 characters', () => {
      const comment = new RealComment({
        message: 'a'.repeat(501),
        rating: 5,
        coworkingSpace: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId()
      });

      const error = comment.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.message.message).toBe(
        'Comment cannot be more than 500 characters'
      );
    });

    it('should require coworkingSpace', () => {
      const comment = new RealComment({
        message: 'Nice',
        rating: 5,
        user: new mongoose.Types.ObjectId()
      });

      const error = comment.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.coworkingSpace).toBeDefined();
    });

    it('should require user', () => {
      const comment = new RealComment({
        message: 'Nice',
        rating: 5,
        coworkingSpace: new mongoose.Types.ObjectId()
      });

      const error = comment.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.user).toBeDefined();
    });

    it('should only allow clean or reported reportStatus', () => {
      const comment = new RealComment({
        message: 'Nice',
        rating: 5,
        coworkingSpace: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        reportStatus: 'normal'
      });

      const error = comment.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.reportStatus).toBeDefined();
    });
  });

  describe('calculateAverageRating', () => {
    let CoworkingSpaceModel;

    beforeEach(() => {
      try {
        CoworkingSpaceModel = mongoose.model('CoworkingSpace');
      } catch (error) {
        CoworkingSpaceModel = mongoose.model(
          'CoworkingSpace',
          new mongoose.Schema({
            averageRating: Number,
            ratingsQuantity: Number
          })
        );
      }

      CoworkingSpaceModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});
    });

    it('should update coworking space average rating when comments exist', async () => {
      const coworkingSpaceId = new mongoose.Types.ObjectId();

      RealComment.aggregate = jest.fn().mockResolvedValue([
        {
          _id: coworkingSpaceId,
          averageRating: 4.666,
          ratingsQuantity: 3
        }
      ]);

      await RealComment.calculateAverageRating(coworkingSpaceId);

      expect(RealComment.aggregate).toHaveBeenCalled();

      expect(CoworkingSpaceModel.findByIdAndUpdate).toHaveBeenCalledWith(
        coworkingSpaceId,
        {
          averageRating: 4.7,
          ratingsQuantity: 3
        }
      );
    });

    it('should reset average rating when no comments exist', async () => {
      const coworkingSpaceId = new mongoose.Types.ObjectId();

      RealComment.aggregate = jest.fn().mockResolvedValue([]);

      await RealComment.calculateAverageRating(coworkingSpaceId);

      expect(RealComment.aggregate).toHaveBeenCalled();

      expect(CoworkingSpaceModel.findByIdAndUpdate).toHaveBeenCalledWith(
        coworkingSpaceId,
        {
          averageRating: 0,
          ratingsQuantity: 0
        }
      );
    });
  });

  describe('indexes', () => {
    it('should have unique index for coworkingSpace and user', () => {
      const indexes = RealComment.schema.indexes();

      expect(indexes).toContainEqual([
        {
          coworkingSpace: 1,
          user: 1
        },
        {
          unique: true
        }
      ]);
    });
  });
});