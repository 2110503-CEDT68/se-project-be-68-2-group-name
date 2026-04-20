// routes/auth.js

const express = require('express');
const { register, login, getMe, logout } = require('../controllers/auth');
const { blockUser, unblockUser } = require('../controllers/comments');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', logout);
router.put('/users/:userId/block', protect, authorize('admin'), blockUser);
router.put('/users/:userId/unblock', protect, authorize('admin'), unblockUser);

module.exports = router;
