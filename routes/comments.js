const express = require('express');
const {
    getComments,
    getComment,
    addComment,
    updateComment,
    deleteComment
} = require('../controllers/comments');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.route('/').get(getComments).post(protect, authorize('admin', 'user'), addComment);

router.route('/:id').get(getComment).put(protect, authorize('admin', 'user'), updateComment).delete(protect, authorize('admin', 'user'), deleteComment);

module.exports = router;