const express = require('express');

const {
    uploadCustomEmoji,
    getMyCustomEmojis,
    deleteCustomEmoji
} = require('../controllers/customEmojis');

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router
    .route('/')
    .post(
        protect,
        authorize('user', 'admin'),
        upload.single('image'),
        uploadCustomEmoji
    );

router
    .route('/me')
    .get(
        protect,
        authorize('user', 'admin'),
        getMyCustomEmojis
    );

router
    .route('/:id')
    .delete(
        protect,
        authorize('user', 'admin'),
        deleteCustomEmoji
    );

module.exports = router;