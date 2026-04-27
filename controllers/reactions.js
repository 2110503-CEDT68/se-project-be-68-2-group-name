const Reaction = require('../models/Reaction');
const Comment = require('../models/Comment');
const CustomEmoji = require('../models/CustomEmoji');

exports.getReactionsByComment = async (req, res) => {
    try {
        const reactions = await Reaction.find({
            comment: req.params.commentId,
            status: 'active'
        })
            .populate('user', 'name email')
            .populate('customEmoji', 'name imageUrl status');

        res.status(200).json({
            success: true,
            count: reactions.length,
            data: reactions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Cannot get reactions'
        });
    }
};

exports.toggleReaction = async (req, res) => {
    try {
        const { emojiType, emojiValue, customEmoji } = req.body;

        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        if (!emojiType || !emojiValue) {
            return res.status(400).json({
                success: false,
                message: 'Please provide emojiType and emojiValue'
            });
        }

        if (emojiType === 'custom') {
            if (!customEmoji) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide customEmoji id'
                });
            }

            const emoji = await CustomEmoji.findById(customEmoji);

            if (!emoji || emoji.status !== 'active') {
                return res.status(400).json({
                    success: false,
                    message: 'Custom emoji is not available'
                });
            }
        }

        const existingReaction = await Reaction.findOne({
            comment: req.params.commentId,
            user: req.user.id,
            emojiValue
        });

        if (existingReaction) {
            await existingReaction.deleteOne();

            return res.status(200).json({
                success: true,
                action: 'removed',
                data: {}
            });
        }

        const reaction = await Reaction.create({
            comment: req.params.commentId,
            user: req.user.id,
            emojiType,
            emojiValue,
            customEmoji: emojiType === 'custom' ? customEmoji : undefined
        });

        res.status(201).json({
            success: true,
            action: 'added',
            data: reaction
        });
    } catch (error) {
        console.error('REACTION ERROR:', error);

        res.status(500).json({
            success: false,
            message: 'Cannot toggle reaction',
            error: error.message
        });
    }
};