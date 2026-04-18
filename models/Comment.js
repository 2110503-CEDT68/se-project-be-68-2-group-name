const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    message: {
        type: String,
        required: [true, 'Please add a comment message'],
        trim: true,
        maxlength: [500, 'Comment cannot be more than 500 characters']
    },
    coworkingSpace: {
        type: mongoose.Schema.ObjectId,
        ref: 'CoworkingSpace',
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Comment', CommentSchema);