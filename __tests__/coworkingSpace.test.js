/**
 * __tests__/coworkingSpace.test.js
 * Tests for controllers/coworkingSpace.js
 */

const {
  mockRequest,
  mockResponse,
  mockNext,
  sampleCoworkingSpace,
  createSpaceId
} = require('./helpers/testSetup');

jest.mock('../models/CoworkingSpace');
jest.mock('../models/Reservation');

const CoworkingSpace = require('../models/CoworkingSpace');
const Reservation = require('../models/Reservation');

const {
  getCoworkingSpaces,
  getCoworkingSpace,
  createCoworkingSpace,
  updateCoworkingSpace,
  deleteCoworkingSpace
} = require('../controllers/coworkingSpace');

describe('CoworkingSpace Controller', () => {
  let res;
  let consoleErrorSpy;

  beforeEach(() => {
    res = mockResponse();
    jest.clearAllMocks();

    // Hide expected console.error output from controller error tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const createQueryChain = (resolvedValue) => ({
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(resolvedValue)
  });

  describe('getCoworkingSpaces', () => {
    it('should return all coworking spaces with default pagination', async () => {
      const spaces = [
        sampleCoworkingSpace(),
        sampleCoworkingSpace()
      ];

      const chainMock = createQueryChain(spaces);

      CoworkingSpace.find = jest.fn().mockReturnValue(chainMock);
      CoworkingSpace.countDocuments = jest.fn().mockResolvedValue(2);

      const req = mockRequest({
        query: {}
      });

      await getCoworkingSpaces(req, res, mockNext);

      expect(CoworkingSpace.find).toHaveBeenCalled();

      expect(chainMock.populate).toHaveBeenCalledWith('reservations');
      expect(chainMock.sort).toHaveBeenCalledWith('-createdAt');
      expect(chainMock.skip).toHaveBeenCalledWith(0);
      expect(chainMock.limit).toHaveBeenCalledWith(25);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: spaces
      });
    });

    it('should support select query parameter', async () => {
      const spaces = [sampleCoworkingSpace()];
      const chainMock = createQueryChain(spaces);

      CoworkingSpace.find = jest.fn().mockReturnValue(chainMock);
      CoworkingSpace.countDocuments = jest.fn().mockResolvedValue(1);

      const req = mockRequest({
        query: {
          select: 'name,address'
        }
      });

      await getCoworkingSpaces(req, res, mockNext);

      expect(chainMock.select).toHaveBeenCalledWith('name address');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: spaces
      });
    });

    it('should support sort query parameter', async () => {
      const spaces = [sampleCoworkingSpace()];
      const chainMock = createQueryChain(spaces);

      CoworkingSpace.find = jest.fn().mockReturnValue(chainMock);
      CoworkingSpace.countDocuments = jest.fn().mockResolvedValue(1);

      const req = mockRequest({
        query: {
          sort: 'name'
        }
      });

      await getCoworkingSpaces(req, res, mockNext);

      expect(chainMock.sort).toHaveBeenCalledWith('name');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: spaces
      });
    });

    it('should apply page and limit query params', async () => {
      const spaces = Array.from({ length: 5 }, () => sampleCoworkingSpace());
      const chainMock = createQueryChain(spaces);

      CoworkingSpace.find = jest.fn().mockReturnValue(chainMock);
      CoworkingSpace.countDocuments = jest.fn().mockResolvedValue(50);

      const req = mockRequest({
        query: {
          page: '1',
          limit: '5'
        }
      });

      await getCoworkingSpaces(req, res, mockNext);

      expect(chainMock.skip).toHaveBeenCalledWith(0);
      expect(chainMock.limit).toHaveBeenCalledWith(5);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 5,
        data: spaces
      });
    });

    it('should skip correct number of documents when page is greater than 1', async () => {
      const spaces = Array.from({ length: 5 }, () => sampleCoworkingSpace());
      const chainMock = createQueryChain(spaces);

      CoworkingSpace.find = jest.fn().mockReturnValue(chainMock);
      CoworkingSpace.countDocuments = jest.fn().mockResolvedValue(50);

      const req = mockRequest({
        query: {
          page: '2',
          limit: '5'
        }
      });

      await getCoworkingSpaces(req, res, mockNext);

      expect(chainMock.skip).toHaveBeenCalledWith(5);
      expect(chainMock.limit).toHaveBeenCalledWith(5);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 5,
        data: spaces
      });
    });

    it('should return 400 when query execution fails', async () => {
      const chainMock = {
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error('DB error'))
      };

      CoworkingSpace.find = jest.fn().mockReturnValue(chainMock);
      CoworkingSpace.countDocuments = jest.fn().mockResolvedValue(0);

      const req = mockRequest({
        query: {}
      });

      await getCoworkingSpaces(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('should return 400 when countDocuments fails', async () => {
      const spaces = [sampleCoworkingSpace()];
      const chainMock = createQueryChain(spaces);

      CoworkingSpace.find = jest.fn().mockReturnValue(chainMock);
      CoworkingSpace.countDocuments = jest
        .fn()
        .mockRejectedValue(new Error('Count error'));

      const req = mockRequest({
        query: {}
      });

      await getCoworkingSpaces(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });
  });

  describe('getCoworkingSpace', () => {
    it('should return a single coworking space', async () => {
      const space = sampleCoworkingSpace();

      CoworkingSpace.findById = jest.fn().mockResolvedValue(space);

      const req = mockRequest({
        params: {
          id: space._id.toString()
        }
      });

      await getCoworkingSpace(req, res, mockNext);

      expect(CoworkingSpace.findById).toHaveBeenCalledWith(
        space._id.toString()
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: space
      });
    });

    it('should return 400 when coworking space is not found', async () => {
      CoworkingSpace.findById = jest.fn().mockResolvedValue(null);

      const req = mockRequest({
        params: {
          id: createSpaceId().toString()
        }
      });

      await getCoworkingSpace(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('should return 400 when database error occurs', async () => {
      CoworkingSpace.findById = jest
        .fn()
        .mockRejectedValue(new Error('DB error'));

      const req = mockRequest({
        params: {
          id: 'invalidId'
        }
      });

      await getCoworkingSpace(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });
  });

  describe('createCoworkingSpace', () => {
    it('should create a coworking space and return 201', async () => {
      const space = sampleCoworkingSpace();

      CoworkingSpace.create = jest.fn().mockResolvedValue(space);

      const req = mockRequest({
        body: {
          name: space.name,
          address: space.address,
          tel: space.tel,
          openCloseTime: space.openCloseTime,
          description: space.description,
          imageUrl: space.imageUrl,
          price: space.price
        }
      });

      await createCoworkingSpace(req, res, mockNext);

      expect(CoworkingSpace.create).toHaveBeenCalledWith(req.body);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: space
      });
    });

    it('should throw error when create fails', async () => {
      CoworkingSpace.create = jest
        .fn()
        .mockRejectedValue(new Error('Validation error'));

      const req = mockRequest({
        body: {}
      });

      await expect(createCoworkingSpace(req, res, mockNext))
        .rejects
        .toThrow('Validation error');

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('updateCoworkingSpace', () => {
    it('should update a coworking space', async () => {
      const updated = sampleCoworkingSpace({
        name: 'Updated Space'
      });

      CoworkingSpace.findByIdAndUpdate = jest.fn().mockResolvedValue(updated);

      const req = mockRequest({
        params: {
          id: updated._id.toString()
        },
        body: {
          name: 'Updated Space'
        }
      });

      await updateCoworkingSpace(req, res, mockNext);

      expect(CoworkingSpace.findByIdAndUpdate).toHaveBeenCalledWith(
        updated._id.toString(),
        req.body,
        expect.objectContaining({
          new: true,
          runValidators: true
        })
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: updated
      });
    });

    it('should return 404 when coworking space does not exist', async () => {
      CoworkingSpace.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      const req = mockRequest({
        params: {
          id: createSpaceId().toString()
        },
        body: {
          name: 'Ghost'
        }
      });

      await updateCoworkingSpace(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('should return 400 when update fails', async () => {
      CoworkingSpace.findByIdAndUpdate = jest
        .fn()
        .mockRejectedValue(new Error('Validation error'));

      const req = mockRequest({
        params: {
          id: 'bad'
        },
        body: {}
      });

      await updateCoworkingSpace(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });
  });

  describe('deleteCoworkingSpace', () => {
    it('should delete a coworking space and cascade reservations', async () => {
      const space = sampleCoworkingSpace();

      CoworkingSpace.findById = jest.fn().mockResolvedValue(space);
      Reservation.deleteMany = jest.fn().mockResolvedValue({});
      CoworkingSpace.deleteOne = jest.fn().mockResolvedValue({});

      const req = mockRequest({
        params: {
          id: space._id.toString()
        }
      });

      await deleteCoworkingSpace(req, res, mockNext);

      expect(CoworkingSpace.findById).toHaveBeenCalledWith(
        space._id.toString()
      );

      expect(Reservation.deleteMany).toHaveBeenCalledWith({
        coworkingSpace: space._id.toString()
      });

      expect(CoworkingSpace.deleteOne).toHaveBeenCalledWith({
        _id: space._id.toString()
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {}
      });
    });

    it('should return 404 when coworking space does not exist', async () => {
      CoworkingSpace.findById = jest.fn().mockResolvedValue(null);

      const req = mockRequest({
        params: {
          id: createSpaceId().toString()
        }
      });

      await deleteCoworkingSpace(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );

      expect(Reservation.deleteMany).not.toHaveBeenCalled();
      expect(CoworkingSpace.deleteOne).not.toHaveBeenCalled();
    });

    it('should return 400 when findById fails', async () => {
      CoworkingSpace.findById = jest
        .fn()
        .mockRejectedValue(new Error('DB error'));

      const req = mockRequest({
        params: {
          id: 'bad'
        }
      });

      await deleteCoworkingSpace(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });

    it('should return 400 when Reservation.deleteMany fails', async () => {
      const space = sampleCoworkingSpace();

      CoworkingSpace.findById = jest.fn().mockResolvedValue(space);
      Reservation.deleteMany = jest
        .fn()
        .mockRejectedValue(new Error('Delete reservation error'));

      const req = mockRequest({
        params: {
          id: space._id.toString()
        }
      });

      await deleteCoworkingSpace(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });
  });
});