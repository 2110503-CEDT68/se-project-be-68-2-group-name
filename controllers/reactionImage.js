const ReactionImage = require('../models/ReactionImage');

// @desc    Get user's reaction images
// @route   GET /api/v1/reactionImages
// @access  Private
exports.getCustomImages = async (req, res, next) => {
  return res.status(200).json({ success: true });
};

// @desc    Delete reaction image
// @route   DELETE /api/v1/reactionImages/:id
// @access  Private
exports.deleteCustomImage = async (req, res, next) => {
  return res.status(200).json({ success: true });
};