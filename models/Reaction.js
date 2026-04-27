const mongoose = require('mongoose');

const ReactionSchema = new mongoose.Schema({
    comment: {
        type: mongoose.Schema.ObjectId,
        ref: 'Comment',
        required: true
    },

    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },

    emojiType: {
        type: String,
        enum: ['default', 'custom'],
        required: true
    },

    emojiValue: {
        type: String,
        required: true
    },

    customEmoji: {
        type: mongoose.Schema.ObjectId,
        ref: 'CustomEmoji'
    },

    status: {
        type: String,
        enum: ['active', 'disabled'],
        default: 'active'
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

ReactionSchema.index(
    { comment: 1, user: 1, emojiValue: 1 },
    { unique: true }
);

module.exports = mongoose.model('Reaction', ReactionSchema);