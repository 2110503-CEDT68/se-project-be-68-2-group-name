const express = require('express');

const {
  uploadCustomEmoji,
  getAllCustomEmojis,
  getMyCustomEmojis,
  deleteCustomEmoji
} = require('../controllers/customEmojis');

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Custom Emojis
 *   description: Custom emoji image upload and management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CustomEmoji:
 *       type: object
 *       required:
 *         - name
 *         - imageUrl
 *         - publicId
 *         - user
 *       properties:
 *         _id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the custom emoji
 *           example: 665f123abc4567890def1111
 *         name:
 *           type: string
 *           description: Name of the custom emoji
 *           example: cat smile
 *         imageUrl:
 *           type: string
 *           description: URL of the uploaded emoji image
 *           example: https://res.cloudinary.com/demo/image/upload/custom-emojis/cat.png
 *         publicId:
 *           type: string
 *           description: Cloudinary public id of the uploaded image
 *           example: custom-emojis/abc123
 *         width:
 *           type: number
 *           description: Width of the emoji image
 *           example: 64
 *         height:
 *           type: number
 *           description: Height of the emoji image
 *           example: 64
 *         user:
 *           type: string
 *           description: ID of the user who uploaded the emoji
 *           example: 665f123abc4567890def2222
 *         status:
 *           type: string
 *           description: Status of the custom emoji
 *           enum: [active, disabled]
 *           example: active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the custom emoji was created
 *           example: 2026-04-27T10:00:00.000Z
 */

/**
 * @swagger
 * /api/v1/custom-emojis:
 *   get:
 *     summary: Get all active custom emojis
 *     tags: [Custom Emojis]
 *     responses:
 *       200:
 *         description: List of active custom emojis
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CustomEmoji'
 */
router
  .route('/')
  .get(getAllCustomEmojis)

/**
 * @swagger
 * /api/v1/custom-emojis:
 *   post:
 *     summary: Upload a custom emoji image
 *     tags: [Custom Emojis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *                 example: cat smile
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Custom emoji uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomEmoji'
 *       400:
 *         description: Missing name or image
 *       401:
 *         description: Unauthorized
 */
  .post(
    protect,
    authorize('user', 'admin'),
    upload.single('image'),
    uploadCustomEmoji
  );

/**
 * @swagger
 * /api/v1/custom-emojis/me:
 *   get:
 *     summary: Get custom emojis uploaded by the logged-in user
 *     tags: [Custom Emojis]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's custom emojis
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CustomEmoji'
 *       401:
 *         description: Unauthorized
 */
router
  .route('/me')
  .get(
    protect,
    authorize('user', 'admin'),
    getMyCustomEmojis
  );

/**
 * @swagger
 * /api/v1/custom-emojis/{id}:
 *   delete:
 *     summary: Delete a custom emoji
 *     tags: [Custom Emojis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Custom emoji ID
 *         example: 665f123abc4567890def1111
 *     responses:
 *       200:
 *         description: Custom emoji and related reactions deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Custom emoji not found
 */
router
  .route('/:id')
  .delete(
    protect,
    authorize('user', 'admin'),
    deleteCustomEmoji
  );

module.exports = router;