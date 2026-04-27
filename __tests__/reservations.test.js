/**
 * __tests__/reservations.test.js
 * Tests for controllers/reservations.js
 */

const mongoose = require('mongoose');

const {
  mockRequest,
  mockResponse,
  mockNext,
  sampleUser,
  sampleAdmin,
  sampleCoworkingSpace,
  sampleReservation,
  createUserId,
  createSpaceId
} = require('./helpers/testSetup');

jest.mock('../models/Reservation');
jest.mock('../models/CoworkingSpace');

const Reservation = require('../models/Reservation');
const CoworkingSpace = require('../models/CoworkingSpace');

const {
  getReservations,
  getReservation,
  addReservation,
  updateReservation,
  deleteReservation
} = require('../controllers/reservations');

describe('Reservation Controller', () => {
  let res;
  let userId;
  let spaceId;
  let admin;
  let consoleErrorSpy;

  beforeEach(() => {
    res = mockResponse();
    userId = createUserId();
    spaceId = createSpaceId();
    admin = sampleAdmin();

    jest.clearAllMocks();

    // Hide expected controller console.error logs during error-case tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('getReservations', () => {
    it("should return only current user's reservations for non-admin", async () => {
      const reservations = [sampleReservation(userId, spaceId)];

      Reservation.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(reservations)
      });

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        }
      });

      await getReservations(req, res, mockNext);

      expect(Reservation.find).toHaveBeenCalledWith({
        user: userId.toString()
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: reservations
      });
    });

    it('should return all reservations for admin', async () => {
      const reservations = [
        sampleReservation(userId, spaceId),
        sampleReservation(createUserId(), spaceId)
      ];

      Reservation.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(reservations)
      });

      const req = mockRequest({
        user: {
          id: admin._id.toString(),
          role: 'admin'
        }
      });

      await getReservations(req, res, mockNext);

      expect(Reservation.find).toHaveBeenCalledWith();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: reservations
      });
    });

    it('should filter reservations by coworkingSpaceId when provided', async () => {
      const reservations = [sampleReservation(userId, spaceId)];

      Reservation.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(reservations)
      });

      const req = mockRequest({
        user: {
          id: admin._id.toString(),
          role: 'admin'
        },
        params: {
          coworkingSpaceId: spaceId.toString()
        }
      });

      await getReservations(req, res, mockNext);

      expect(Reservation.find).toHaveBeenCalledWith({
        coworkingSpace: spaceId.toString()
      });

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 when database error occurs', async () => {
      Reservation.find = jest.fn().mockImplementation(() => {
        throw new Error('DB error');
      });

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        }
      });

      await getReservations(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });
  });

  describe('getReservation', () => {
    it('should return a reservation for the owner', async () => {
      const reservation = sampleReservation(userId, spaceId);

      Reservation.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(reservation)
      });

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: reservation._id.toString()
        }
      });

      await getReservation(req, res, mockNext);

      expect(Reservation.findById).toHaveBeenCalledWith(
        reservation._id.toString()
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: reservation
      });
    });

    it('should return 404 when reservation does not exist', async () => {
      Reservation.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: new mongoose.Types.ObjectId().toString()
        }
      });

      await getReservation(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('should return 401 when user is not owner', async () => {
      const otherUserId = createUserId();
      const reservation = sampleReservation(otherUserId, spaceId);

      Reservation.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(reservation)
      });

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: reservation._id.toString()
        }
      });

      await getReservation(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('should allow admin to access any reservation', async () => {
      const reservation = sampleReservation(userId, spaceId);

      Reservation.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(reservation)
      });

      const req = mockRequest({
        user: {
          id: admin._id.toString(),
          role: 'admin'
        },
        params: {
          id: reservation._id.toString()
        }
      });

      await getReservation(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: reservation
      });
    });

    it('should return 500 when unexpected error occurs', async () => {
      Reservation.findById = jest.fn().mockImplementation(() => {
        throw new Error('DB error');
      });

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: new mongoose.Types.ObjectId().toString()
        }
      });

      await getReservation(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });
  });

  describe('addReservation', () => {
    it('should create a reservation for normal user', async () => {
      const space = sampleCoworkingSpace({
        _id: spaceId
      });

      const reservation = sampleReservation(userId, spaceId);

      CoworkingSpace.findById = jest.fn().mockResolvedValue(space);
      Reservation.find = jest.fn().mockResolvedValue([]);
      Reservation.create = jest.fn().mockResolvedValue(reservation);

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          coworkingSpaceId: spaceId.toString()
        },
        body: {
          resvDate: '2025-12-01',
          capacity: 2,
          totalCost: 1000
        }
      });

      await addReservation(req, res, mockNext);

      expect(CoworkingSpace.findById).toHaveBeenCalledWith(spaceId.toString());

      expect(Reservation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: userId.toString(),
          coworkingSpace: spaceId.toString()
        })
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: reservation
      });
    });

    it('should return 400 when coworkingSpaceId is missing', async () => {
      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {},
        body: {}
      });

      await addReservation(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );

      expect(CoworkingSpace.findById).not.toHaveBeenCalled();
      expect(Reservation.create).not.toHaveBeenCalled();
    });

    it('should return 404 when coworking space does not exist', async () => {
      CoworkingSpace.findById = jest.fn().mockResolvedValue(null);

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          coworkingSpaceId: spaceId.toString()
        },
        body: {}
      });

      await addReservation(req, res, mockNext);

      expect(CoworkingSpace.findById).toHaveBeenCalledWith(spaceId.toString());

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );

      expect(Reservation.create).not.toHaveBeenCalled();
    });

    it('should return 400 when user already has 3 reservations', async () => {
      const space = sampleCoworkingSpace({
        _id: spaceId
      });

      CoworkingSpace.findById = jest.fn().mockResolvedValue(space);

      Reservation.find = jest.fn().mockResolvedValue([
        sampleReservation(userId, spaceId),
        sampleReservation(userId, spaceId),
        sampleReservation(userId, spaceId)
      ]);

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          coworkingSpaceId: spaceId.toString()
        },
        body: {
          resvDate: '2025-12-05',
          capacity: 1,
          totalCost: 500
        }
      });

      await addReservation(req, res, mockNext);

      expect(Reservation.find).toHaveBeenCalledWith({
        user: userId.toString()
      });

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );

      expect(Reservation.create).not.toHaveBeenCalled();
    });

    it('should allow admin to exceed 3 reservations', async () => {
      const space = sampleCoworkingSpace({
        _id: spaceId
      });

      const reservation = sampleReservation(admin._id, spaceId);

      CoworkingSpace.findById = jest.fn().mockResolvedValue(space);

      Reservation.find = jest.fn().mockResolvedValue([
        sampleReservation(admin._id, spaceId),
        sampleReservation(admin._id, spaceId),
        sampleReservation(admin._id, spaceId)
      ]);

      Reservation.create = jest.fn().mockResolvedValue(reservation);

      const req = mockRequest({
        user: {
          id: admin._id.toString(),
          role: 'admin'
        },
        params: {
          coworkingSpaceId: spaceId.toString()
        },
        body: {
          resvDate: '2025-12-10',
          capacity: 3,
          totalCost: 1500
        }
      });

      await addReservation(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(Reservation.create).toHaveBeenCalled();
    });

    it('should return 500 when unexpected error occurs', async () => {
      CoworkingSpace.findById = jest.fn().mockRejectedValue(
        new Error('DB error')
      );

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          coworkingSpaceId: spaceId.toString()
        },
        body: {
          resvDate: '2025-12-01'
        }
      });

      await addReservation(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });
  });

  describe('updateReservation', () => {
    it('should update a reservation for owner', async () => {
      const reservation = sampleReservation(userId, spaceId);
      const updatedReservation = sampleReservation(userId, spaceId, {
        capacity: 5
      });

      Reservation.findById = jest.fn().mockResolvedValue(reservation);
      Reservation.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue(updatedReservation);

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: reservation._id.toString()
        },
        body: {
          capacity: 5
        }
      });

      await updateReservation(req, res, mockNext);

      expect(Reservation.findById).toHaveBeenCalledWith(
        reservation._id.toString()
      );

      expect(Reservation.findByIdAndUpdate).toHaveBeenCalledWith(
        reservation._id.toString(),
        req.body,
        expect.objectContaining({
          new: true,
          runValidators: true
        })
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: updatedReservation
      });
    });

    it('should allow admin to update any reservation', async () => {
      const otherUserId = createUserId();

      const reservation = sampleReservation(otherUserId, spaceId);
      const updatedReservation = sampleReservation(otherUserId, spaceId, {
        capacity: 4
      });

      Reservation.findById = jest.fn().mockResolvedValue(reservation);
      Reservation.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue(updatedReservation);

      const req = mockRequest({
        user: {
          id: admin._id.toString(),
          role: 'admin'
        },
        params: {
          id: reservation._id.toString()
        },
        body: {
          capacity: 4
        }
      });

      await updateReservation(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(Reservation.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should return 404 when reservation is not found', async () => {
      Reservation.findById = jest.fn().mockResolvedValue(null);

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: new mongoose.Types.ObjectId().toString()
        },
        body: {}
      });

      await updateReservation(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );

      expect(Reservation.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not owner', async () => {
      const otherUserId = createUserId();
      const reservation = sampleReservation(otherUserId, spaceId);

      Reservation.findById = jest.fn().mockResolvedValue(reservation);

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: reservation._id.toString()
        },
        body: {}
      });

      await updateReservation(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );

      expect(Reservation.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should return 500 when unexpected error occurs', async () => {
      Reservation.findById = jest.fn().mockRejectedValue(new Error('DB error'));

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: new mongoose.Types.ObjectId().toString()
        },
        body: {}
      });

      await updateReservation(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });
  });

  describe('deleteReservation', () => {
    it('should delete a reservation for owner', async () => {
      const reservation = sampleReservation(userId, spaceId);
      reservation.deleteOne = jest.fn().mockResolvedValue({});

      Reservation.findById = jest.fn().mockResolvedValue(reservation);

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: reservation._id.toString()
        }
      });

      await deleteReservation(req, res, mockNext);

      expect(Reservation.findById).toHaveBeenCalledWith(
        reservation._id.toString()
      );

      expect(reservation.deleteOne).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {}
      });
    });

    it('should return 404 when reservation is not found', async () => {
      Reservation.findById = jest.fn().mockResolvedValue(null);

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: new mongoose.Types.ObjectId().toString()
        }
      });

      await deleteReservation(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('should return 401 when user is not owner', async () => {
      const otherUserId = createUserId();
      const reservation = sampleReservation(otherUserId, spaceId);

      Reservation.findById = jest.fn().mockResolvedValue(reservation);

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: reservation._id.toString()
        }
      });

      await deleteReservation(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );

      expect(reservation.deleteOne).not.toHaveBeenCalled();
    });

    it('should allow admin to delete any reservation', async () => {
      const otherUserId = createUserId();
      const reservation = sampleReservation(otherUserId, spaceId);
      reservation.deleteOne = jest.fn().mockResolvedValue({});

      Reservation.findById = jest.fn().mockResolvedValue(reservation);

      const req = mockRequest({
        user: {
          id: admin._id.toString(),
          role: 'admin'
        },
        params: {
          id: reservation._id.toString()
        }
      });

      await deleteReservation(req, res, mockNext);

      expect(reservation.deleteOne).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {}
      });
    });

    it('should return 500 when unexpected error occurs', async () => {
      Reservation.findById = jest.fn().mockRejectedValue(new Error('DB error'));

      const req = mockRequest({
        user: {
          id: userId.toString(),
          role: 'user'
        },
        params: {
          id: new mongoose.Types.ObjectId().toString()
        }
      });

      await deleteReservation(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });
  });
});