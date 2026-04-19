const express = require('express');
const {
    getComments,
    getComment,
    addComment,
    updateComment,
    deleteComment,
    reportComment
} = require('../controllers/comments');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.route('/').get(getComments).post(protect, authorize('admin', 'user'), addComment);
router.route('/:id').get(getComment).put(protect, authorize('admin', 'user'), updateComment).delete(protect, authorize('admin', 'user'), deleteComment);
router.route('/:id/report').put(protect, authorize('admin', 'user'), reportComment);

module.exports = router;