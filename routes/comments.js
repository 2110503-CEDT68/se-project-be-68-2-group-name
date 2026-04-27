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

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Comment management for coworking spaces
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       required:
 *         - message
 *         - coworkingSpace
 *         - user
 *       properties:
 *         _id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the comment
 *           example: 665f123abc4567890def3333
 *         message:
 *           type: string
 *           description: Text message of the comment
 *           example: This coworking space is very nice.
 *         rating:
 *           type: number
 *           description: Rating score given by the user
 *           example: 5
 *         coworkingSpace:
 *           type: string
 *           description: ID of the coworking space that this comment belongs to
 *           example: 665f123abc4567890def1111
 *         user:
 *           type: string
 *           description: ID of the user who created the comment
 *           example: 665f123abc4567890def2222
 *         reportCount:
 *           type: number
 *           description: Number of times this comment has been reported
 *           example: 0
 *         reportStatus:
 *           type: string
 *           description: Report status of the comment
 *           enum: [normal, reported]
 *           example: normal
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the comment was created
 *           example: 2026-04-27T10:00:00.000Z
 */

/**
 * @swagger
 * /api/v1/comments:
 *   get:
 *     summary: Get all comments
 *     tags: [Comments]
 *     responses:
 *       200:
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       500:
 *         description: Server error
 *   post:
 *     summary: Add a new comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router
  .route('/')
  .get(getComments)
  .post(protect, authorize('admin', 'user'), addComment);

/**
 * @swagger
 * /api/v1/comments/block/{userId}:
 *   put:
 *     summary: Block a user from commenting
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to block
 *     responses:
 *       200:
 *         description: User blocked successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       404:
 *         description: User not found
 */
router
  .route('/block/:userId')
  .put(protect, authorize('admin'), blockUser);

/**
 * @swagger
 * /api/v1/comments/unblock/{userId}:
 *   put:
 *     summary: Unblock a user from commenting
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to unblock
 *     responses:
 *       200:
 *         description: User unblocked successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       404:
 *         description: User not found
 */
router
  .route('/unblock/:userId')
  .put(protect, authorize('admin'), unblockUser);

/**
 * @swagger
 * /api/v1/comments/{id}:
 *   get:
 *     summary: Get a single comment by ID
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Comment not found
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 */
router
  .route('/:id')
  .get(getComment)
  .put(protect, authorize('admin', 'user'), updateComment)
  .delete(protect, authorize('admin', 'user'), deleteComment);

/**
 * @swagger
 * /api/v1/comments/{id}/report:
 *   put:
 *     summary: Report a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment reported successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 */
router
  .route('/:id/report')
  .put(protect, authorize('admin', 'user'), reportComment);

module.exports = router;