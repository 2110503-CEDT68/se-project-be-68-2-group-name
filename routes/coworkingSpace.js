const express = require('express');
const reservationRouter = require('./reservations');
const commentRouter = require('./comments');

const router = express.Router();

const {
  getCoworkingSpaces,
  getCoworkingSpace,
  createCoworkingSpace,
  updateCoworkingSpace,
  deleteCoworkingSpace
} = require('../controllers/coworkingSpace');

const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Coworking Spaces
 *   description: Coworking space management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CoworkingSpace:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - tel
 *         - openCloseTime
 *         - description
 *         - imageUrl
 *         - price
 *       properties:
 *         _id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the coworking space
 *           example: 665f123abc4567890def1111
 *         name:
 *           type: string
 *           description: Coworking space name
 *           example: Siam Workspace
 *         address:
 *           type: string
 *           description: Coworking space address
 *           example: Siam Square, Bangkok
 *         tel:
 *           type: string
 *           description: Telephone number of the coworking space
 *           example: "021234567"
 *         openCloseTime:
 *           type: string
 *           description: Opening and closing time
 *           example: "09:00-18:00"
 *         description:
 *           type: string
 *           description: Description of the coworking space
 *           example: A modern coworking space near BTS.
 *         imageUrl:
 *           type: string
 *           description: Image URL of the coworking space
 *           example: https://example.com/image.jpg
 *         price:
 *           type: number
 *           description: Price of the coworking space
 *           example: 250
 *         averageRating:
 *           type: number
 *           description: Average rating calculated from comments
 *           example: 4.5
 *         ratingsQuantity:
 *           type: number
 *           description: Number of ratings/comments
 *           example: 10
 */

// Nested routes
router.use('/:coworkingSpaceId/reservations', reservationRouter);
router.use('/:coworkingSpaceId/comments', commentRouter);

/**
 * @swagger
 * /api/v1/coworkingspaces:
 *   get:
 *     summary: Get all coworking spaces
 *     tags: [Coworking Spaces]
 *     responses:
 *       200:
 *         description: List of coworking spaces
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CoworkingSpace'
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a new coworking space
 *     tags: [Coworking Spaces]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CoworkingSpace'
 *     responses:
 *       201:
 *         description: Coworking space created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 */
router
  .route('/')
  .get(getCoworkingSpaces)
  .post(protect, authorize('admin'), createCoworkingSpace);

/**
 * @swagger
 * /api/v1/coworkingspaces/{id}:
 *   get:
 *     summary: Get a single coworking space by ID
 *     tags: [Coworking Spaces]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coworking space ID
 *         example: 665f123abc4567890def1111
 *     responses:
 *       200:
 *         description: Coworking space data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CoworkingSpace'
 *       404:
 *         description: Coworking space not found
 *   put:
 *     summary: Update a coworking space
 *     tags: [Coworking Spaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coworking space ID
 *         example: 665f123abc4567890def1111
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CoworkingSpace'
 *     responses:
 *       200:
 *         description: Coworking space updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       404:
 *         description: Coworking space not found
 *   delete:
 *     summary: Delete a coworking space
 *     tags: [Coworking Spaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coworking space ID
 *         example: 665f123abc4567890def1111
 *     responses:
 *       200:
 *         description: Coworking space deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       404:
 *         description: Coworking space not found
 */
router
  .route('/:id')
  .get(getCoworkingSpace)
  .put(protect, authorize('admin'), updateCoworkingSpace)
  .delete(protect, authorize('admin'), deleteCoworkingSpace);

module.exports = router;