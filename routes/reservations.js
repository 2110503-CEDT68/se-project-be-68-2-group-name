const express = require('express');
const {
    getReservations,
    getReservation,
    addReservation,
    updateReservation,
    deleteReservation
} = require('../controllers/reservations');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Reservations
 *   description: Reservation management for coworking spaces
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Reservation:
 *       type: object
 *       required:
 *         - resvDate
 *         - user
 *         - coworkingSpace
 *         - capacity
 *         - totalCost
 *       properties:
 *         _id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the reservation
 *           example: 665f123abc4567890def3333
 *         resvDate:
 *           type: string
 *           format: date-time
 *           description: Date and time of the reservation
 *           example: 2026-05-01T10:00:00.000Z
 *         user:
 *           type: string
 *           description: ID of the user who made the reservation
 *           example: 665f123abc4567890def2222
 *         coworkingSpace:
 *           type: string
 *           description: ID of the coworking space being reserved
 *           example: 665f123abc4567890def1111
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the reservation was created
 *           example: 2026-04-27T10:00:00.000Z
 *         capacity:
 *           type: number
 *           description: Number of people/seats reserved
 *           example: 2
 *         totalCost:
 *           type: number
 *           description: Total cost of the reservation
 *           example: 500
 */

/**
 * @swagger
 * /api/v1/reservations:
 *   get:
 *     summary: Get all reservations
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of reservations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reservation'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a new reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Reservation'
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router
    .route('/')
    .get(protect, getReservations)
    .post(protect, authorize('admin', 'user'), addReservation);

/**
 * @swagger
 * /api/v1/reservations/{id}:
 *   get:
 *     summary: Get a single reservation by ID
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *         example: 665f123abc4567890def3333
 *     responses:
 *       200:
 *         description: Reservation data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Reservation not found
 *   put:
 *     summary: Update a reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *         example: 665f123abc4567890def3333
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Reservation'
 *     responses:
 *       200:
 *         description: Reservation updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Reservation not found
 *   delete:
 *     summary: Delete a reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *         example: 665f123abc4567890def3333
 *     responses:
 *       200:
 *         description: Reservation deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Reservation not found
 */
router
    .route('/:id')
    .get(protect, getReservation)
    .put(protect, authorize('admin', 'user'), updateReservation)
    .delete(protect, authorize('admin', 'user'), deleteReservation);

module.exports = router;