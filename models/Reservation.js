const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  resvDate: {
    type: Date,
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  coworkingSpace: {
    type: mongoose.Schema.ObjectId,
    ref: 'CoworkingSpace',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  capacity: {
    type: Number,
    required: true
  },
  totalCost: {
    type: Number,
    require: true
  }
});

module.exports = mongoose.model('Reservation', ReservationSchema);
