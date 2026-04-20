const express = require('express');
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

const { protect, authorize } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.route('/').get(getComments).post(protect, authorize('admin', 'user'), addComment);

// ✅ These must come BEFORE /:id
router.route('/block/:userId').put(protect, authorize('admin'), blockUser);
router.route('/unblock/:userId').put(protect, authorize('admin'), unblockUser);

// /:id must come AFTER the named routes above
router.route('/:id').get(getComment).put(protect, authorize('admin', 'user'), updateComment).delete(protect, authorize('admin', 'user'), deleteComment);
router.route('/:id/report').put(protect, authorize('admin', 'user'), reportComment);

module.exports = router;