const Reservation = require('../models/Reservation');
const CoworkingSpace = require('../models/CoworkingSpace');

// @desc    Get all Reservations
// @route   GET /api/v1/reservations
// @access  Public
exports.getReservations = async (req, res, next) => {
  let query;

  try {
    // General users can see only their Reservations
    if (req.user.role !== 'admin') {
      query = Reservation.find({ user: req.user.id }).populate({
        path: 'coworkingSpace',
        select: 'name address tel openCloseTime'
      });
    } else {
      // If you are admin, you can see all
      if(req.params.coworkingSpaceId){
        query = Reservation.find({ coworkingSpace: req.params.coworkingSpaceId }).populate({
        path: 'coworkingSpace',
        select: 'name address tel openCloseTime'
        });
      }
      else{
        query = Reservation.find().populate({
          path: 'coworkingSpace',
          select: 'name address tel openCloseTime'
        });
      }
    }

    const reservations = await query;

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Cannot find Reservation"
    });
  }
};

// @desc    Get single Reservation
// @route   GET /api/v1/reservations/:id
// @access  Public
exports.getReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate({
      path: 'coworkingSpace',
      select: 'name address tel openCloseTime'
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: `No Reservation with the id of ${req.params.id}`
      });
    }

        //Make sure user is the appointment owner
    if(reservation.user.toString() !== req.user.id && req.user.role !== 'admin'){
        return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to get this reservation`
      });
    }

    res.status(200).json({
      success: true,
      data: reservation
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Cannot find Reservation'
    });
  }
};

// @desc    Add Reservation
// @route   POST /api/v1/coworkingSpaces/:coworkingSpaceId/reservations
// @access  Private
exports.addReservation = async (req, res, next) => {

  if (!req.params.coworkingSpaceId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide coworkingSpaceId in URL'
    });
}

  try {
    // Add CoworkingSpace id from URL into body
    req.body.coworkingSpace = req.params.coworkingSpaceId;


    // Check if CoworkingSpace exists
    const coworkingSpace = await CoworkingSpace.findById(req.params.coworkingSpaceId);

    if (!coworkingSpace) {
      return res.status(404).json({
        success: false,
        message: `No CoworkingSpace with the id of ${req.params.coworkingSpaceId}`
      });
    }

    // Add user id from logged in user
    req.body.user = req.user.id;

    // Check for existed Reservation
    const existedReservations = await Reservation.find({ user: req.user.id });

    // If the user is not an admin, they can only create 3 Reservation.
    if (existedReservations.length >= 3 && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: `The user with ID ${req.user.id} has already made 3 Reservations`
      });
    }

    // Create Reservation
    const reservation = await Reservation.create(req.body);

    res.status(201).json({
      success: true,
      data: reservation
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Cannot create Reservation"
    });
  }
};

// @desc    Update Reservation
// @route   PUT /api/v1/reservations/:id
// @access  Private
exports.updateReservation = async (req, res, next) => {
  try {
    let reservation = await Reservation.findById(req.params.id);

    // Check if Reservation exists
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: `No Reservation with the id of ${req.params.id}`
      });
    }

    //Make sure user is the Reservation owner
    if(reservation.user.toString() !== req.user.id && req.user.role !== 'admin'){
        return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this Reservation`
      });
    }

    // Update Reservation
    reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: reservation
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Cannot update Reservation'
    });
  }
};

// @desc    Delete Reservation
// @route   DELETE /api/v1/reservations/:id
// @access  Private
exports.deleteReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    // Check if Reservation exists
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: `No Reservation with the id of ${req.params.id}`
      });
    }

    //Make sure user is the Reservation owner
    if(reservation.user.toString() !== req.user.id && req.user.role !== 'admin'){
        return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this Reservation`
      });
    }


    await reservation.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Cannot delete Reservation'
    });
  }
};