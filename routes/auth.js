// routes/auth.js

const express = require('express');
const { register, login, getMe, logout } = require('../controllers/auth');
const { blockUser, unblockUser } = require('../controllers/comments');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user account management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the user
 *           example: 665f123abc4567890def1111
 *         name:
 *           type: string
 *           description: User full name
 *           example: John Doe
 *         email:
 *           type: string
 *           description: User email
 *           example: john@example.com
 *         tel:
 *           type: string
 *           description: User telephone number
 *           example: "0812345678"
 *         password:
 *           type: string
 *           description: User password
 *           example: password123
 *         role:
 *           type: string
 *           description: User role
 *           enum: [user, admin]
 *           example: user
 *         isBlocked:
 *           type: boolean
 *           description: Whether the user is blocked from commenting
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the user was created
 *           example: 2026-04-27T10:00:00.000Z
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input or user already exists
 */
router.post('/register', register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user and receive JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Missing email/password or invalid credentials
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', login);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current logged-in user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   get:
 *     summary: Logout current user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.get('/logout', logout);

/**
 * @swagger
 * /api/v1/auth/users/{userId}/block:
 *   put:
 *     summary: Block a user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to block
 *         example: 665f123abc4567890def1111
 *     responses:
 *       200:
 *         description: User blocked successfully
 *       400:
 *         description: Cannot block admin account
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 *       404:
 *         description: User not found
 */
router.put('/users/:userId/block', protect, authorize('admin'), blockUser);

/**
 * @swagger
 * /api/v1/auth/users/{userId}/unblock:
 *   put:
 *     summary: Unblock a user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to unblock
 *         example: 665f123abc4567890def1111
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
router.put('/users/:userId/unblock', protect, authorize('admin'), unblockUser);

module.exports = router;