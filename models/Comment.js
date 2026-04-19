const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    message: {
        type: String,
        required: [true, 'Please add a comment message'],
        trim: true,
        maxlength: [500, 'Comment cannot be more than 500 characters']
    },
    rating: {
        type: Number,
        required: [true, 'Please add a rating'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating must not be more than 5']
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

CommentSchema.statics.calculateAverageRating = async function (coworkingSpaceId) {
    const stats = await this.aggregate([
        {
            $match: { coworkingSpace: new mongoose.Types.ObjectId(coworkingSpaceId) }
        },
        {
            $group: {
                _id: '$coworkingSpace',
                averageRating: { $avg: '$rating' },
                ratingsQuantity: { $sum: 1 }
            }
        }
    ]);

    if (stats.length > 0) {
        await this.model('CoworkingSpace').findByIdAndUpdate(coworkingSpaceId, {
            averageRating: Math.round(stats[0].averageRating * 10) / 10,
            ratingsQuantity: stats[0].ratingsQuantity
        });
    } else {
        await this.model('CoworkingSpace').findByIdAndUpdate(coworkingSpaceId, {
            averageRating: 0,
            ratingsQuantity: 0
        });
    }
};

CommentSchema.index({ coworkingSpace: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Comment', CommentSchema);