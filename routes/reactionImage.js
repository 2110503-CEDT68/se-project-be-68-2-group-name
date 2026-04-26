const express = require('express');

const router = express.Router();

const {
  getReactionImages,
  deleteReactionImage
} = require('../controllers/reactionImage');

const { protect } = require('../middleware/auth');

router
  .route('/')
  .get(protect, getReactionImages);

router
  .route('/:id')
  .delete(protect, deleteReactionImage);

module.exports = router;