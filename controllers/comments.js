const Comment = require('../models/Comment');
const CoworkingSpace = require('../models/CoworkingSpace');


exports.getComments = async (req, res, next) => {
    try {
        let query;

        if (req.params.coworkingSpaceId) {
            query = Comment.find({
                coworkingSpace: req.params.coworkingSpaceId
            }).populate({
                path: 'user',
                select: 'name email'
            });
        } else {
            query = Comment.find().populate({
                path: 'user',
                select: 'name email'
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
                select: 'name email'
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

        req.body.coworkingSpace = req.params.coworkingSpaceId;
        req.body.user = req.user.id;

        const comment = await Comment.create(req.body);

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

        await comment.deleteOne();

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