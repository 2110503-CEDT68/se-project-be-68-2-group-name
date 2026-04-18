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

const {protect, authorize} = require('../middleware/auth');

router.use('/:coworkingSpaceId/reservations', reservationRouter);
router.use('/:coworkingSpaceId/comments', commentRouter);

router.route('/').get(getCoworkingSpaces).post(protect, authorize('admin'),createCoworkingSpace);
router.route('/:id').get(getCoworkingSpace).put(protect,authorize('admin') ,updateCoworkingSpace).delete(protect,authorize('admin') ,deleteCoworkingSpace);

module.exports = router;