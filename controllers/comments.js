const Comment = require('../models/Comment');
const CoworkingSpace = require('../models/CoworkingSpace');
const User = require('../models/User');


exports.getComments = async (req, res, next) => {
    try {
        let query;

        if (req.params.coworkingSpaceId) {
            query = Comment.find({
                coworkingSpace: req.params.coworkingSpaceId
            }).populate({
                path: 'user',
                select: 'name email isBlocked'
            });
        } else {
            query = Comment.find().populate({
                path: 'user',
                select: 'name email isBlocked'
            }).populate({
                path: 'coworkingSpace',
                select: 'name address'
            });
        }

        const comments = await query.sort('-createdAt');

        res.status(200).json({
            success: true,
            count: comments.length,
            data: comments
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Cannot get comments'
        });
    }
};


exports.getComment = async (req, res, next) => {
    try {
        const comment = await Comment.findById(req.params.id)
            .populate({
                path: 'user',
                select: 'name email isBlocked'
            })
            .populate({
                path: 'coworkingSpace',
                select: 'name address'
            });

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: `No comment with the id of ${req.params.id}`
            });
        }

        res.status(200).json({
            success: true,
            data: comment
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Cannot get comment'
        });
    }
};


exports.addComment = async (req, res, next) => {
    if (!req.params.coworkingSpaceId) {
        return res.status(400).json({
            success: false,
            message: 'Please provide coworkingSpaceId in URL'
        });
    }

    try {
        const coworkingSpace = await CoworkingSpace.findById(req.params.coworkingSpaceId);

        if (!coworkingSpace) {
            return res.status(404).json({
                success: false,
                message: `No CoworkingSpace with the id of ${req.params.coworkingSpaceId}`
            });
        }

        // Check if user is blocked
        const requestingUser = await User.findById(req.user._id);
        if (requestingUser && requestingUser.isBlocked) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been blocked. You cannot post comments.'
            });
        }

        req.body.coworkingSpace = req.params.coworkingSpaceId;
        req.body.user = req.user.id;

        const comment = await Comment.create(req.body);
        await Comment.calculateAverageRating(req.params.coworkingSpaceId);

        res.status(201).json({
            success: true,
            data: comment
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Cannot create comment'
        });
    }
};


exports.updateComment = async (req, res, next) => {
    try {
        let comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: `No comment with the id of ${req.params.id}`
            });
        }

        if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to update this comment`
            });
        }

        comment = await Comment.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        await Comment.calculateAverageRating(comment.coworkingSpace);

        res.status(200).json({
            success: true,
            data: comment
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Cannot update comment'
        });
    }
};


exports.deleteComment = async (req, res, next) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: `No comment with the id of ${req.params.id}`
            });
        }

        if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to delete this comment`
            });
        }

        await comment.deleteOne();  // FIXME soft delete

        await Comment.calculateAverageRating(comment.coworkingSpace);

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Cannot delete comment'
        });
    }
};

exports.reportComment = async (req, res, next) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: `No comment with the id of ${req.params.id}`
            });
        }

        comment.reportCount += 1;

        if (comment.reportCount === 0) {
            comment.reportStatus = 'clean';
        } else {
            comment.reportStatus = 'reported';
        }

        await comment.save();

        res.status(200).json({
            success: true,
            data: comment
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Cannot report comment'
        });
    }
};

// @desc    Block a user (admin only)
// @route   PUT /api/v1/comments/block/:userId
// @access  Admin
exports.blockUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: `No user found with id ${req.params.userId}`
            });
        }

        if (user.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Cannot block an admin account'
            });
        }

        user.isBlocked = true;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User ${user.name} has been blocked`,
            data: { userId: user._id, name: user.name, isBlocked: user.isBlocked }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Cannot block user'
        });
    }
};


// @desc    Unblock a user (admin only)
// @route   PUT /api/v1/comments/unblock/:userId
// @access  Admin
exports.unblockUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: `No user found with id ${req.params.userId}`
            });
        }

        user.isBlocked = false;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User ${user.name} has been unblocked`,
            data: { userId: user._id, name: user.name, isBlocked: user.isBlocked }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Cannot unblock user'
        });
    }
};
