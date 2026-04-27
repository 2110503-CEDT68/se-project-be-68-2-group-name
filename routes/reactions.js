const express = require('express');

const {
    getReactionsByComment,
    toggleReaction
} = require('../controllers/reactions');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router
    .route('/comments/:commentId/reactions')
    .get(getReactionsByComment);

router
    .route('/comments/:commentId/reactions/toggle')
    .put(protect, authorize('user', 'admin'), toggleReaction);

module.exports = router;