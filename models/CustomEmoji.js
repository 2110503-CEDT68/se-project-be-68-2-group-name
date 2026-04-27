const mongoose = require('mongoose');

const CustomEmojiSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add emoji name'],
        trim: true,
        maxlength: [50, 'Emoji name cannot be more than 50 characters']
    },

    imageUrl: {
        type: String,
        required: true
    },

    publicId: {
        type: String,
        required: true
    },

    width: {
        type: Number,
        default: 64
    },

    height: {
        type: Number,
        default: 64
    },

    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
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

module.exports = mongoose.model('CustomEmoji', CustomEmojiSchema);