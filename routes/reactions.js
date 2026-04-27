const express = require('express');

const {
  getReactionsByComment,
  toggleReaction
} = require('../controllers/reactions');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reactions
 *   description: Emoji reactions for comments
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Reaction:
 *       type: object
 *       required:
 *         - comment
 *         - user
 *         - emojiType
 *         - emojiValue
 *       properties:
 *         _id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the reaction
 *           example: 665f123abc4567890def3333
 *         comment:
 *           type: string
 *           description: ID of the comment that this reaction belongs to
 *           example: 665f123abc4567890def1111
 *         user:
 *           type: string
 *           description: ID of the user who reacted to the comment
 *           example: 665f123abc4567890def2222
 *         emojiType:
 *           type: string
 *           description: Type of emoji reaction
 *           enum: [default, custom]
 *           example: default
 *         emojiValue:
 *           type: string
 *           description: Emoji value or custom emoji name
 *           example: ❤️
 *         customEmoji:
 *           type: string
 *           description: ID of custom emoji. Required only when emojiType is custom
 *           example: 665f123abc4567890def4444
 *         status:
 *           type: string
 *           description: Status of the reaction
 *           enum: [active, disabled]
 *           example: active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the reaction was created
 *           example: 2026-04-27T10:00:00.000Z
 */

/**
 * @swagger
 * /api/v1/comments/{commentId}/reactions:
 *   get:
 *     summary: Get all reactions for a comment
 *     tags: [Reactions]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *         example: 665f123abc4567890def1111
 *     responses:
 *       200:
 *         description: List of reactions for the comment
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reaction'
 *       500:
 *         description: Cannot get reactions
 */
router
  .route('/comments/:commentId/reactions')
  .get(getReactionsByComment);

/**
 * @swagger
 * /api/v1/comments/{commentId}/reactions/toggle:
 *   put:
 *     summary: Add or remove reaction for a comment
 *     tags: [Reactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *         example: 665f123abc4567890def1111
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Reaction'
 *     responses:
 *       200:
 *         description: Reaction removed
 *       201:
 *         description: Reaction added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reaction'
 *       400:
 *         description: Invalid emoji data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 */
router
  .route('/comments/:commentId/reactions/toggle')
  .put(protect, authorize('user', 'admin'), toggleReaction);

module.exports = router;