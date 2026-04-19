const mongoose = require('mongoose');

const CoworkingSpaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name can not be more than 50 characters']
  },
  address: {
    type: String,
    required: [true, 'Please add an address']
  },
  tel: {
    type: String,
    required: [true, 'Please add a telephone number'],
    match: [/^[0-9]{9,10}$/, 'Please add a valid telephone number']
  },
  openCloseTime: {
    type: String,
    required: [true, 'Please add open-close time']
  },
  description: {
    type: String,
    required: [true, 'Please add CoworkingSpace description'],
  },
  imageUrl: {
    type: String,
    required: [true, 'Please add an image URL'],
  },
  price: {
    type: String,
    required: [true, 'Please add a price'],
  },
  averageRating: {
    type: Number,
    default: 0
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


CoworkingSpaceSchema.virtual('reservations', {
  ref: 'Reservation',
  localField: '_id',
  foreignField: 'coworkingSpace',
  justOne: false
});

CoworkingSpaceSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'coworkingSpace',
  justOne: false
});

module.exports = mongoose.model('CoworkingSpace', CoworkingSpaceSchema);