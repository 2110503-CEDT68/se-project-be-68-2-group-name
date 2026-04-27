/**
 * __tests__/user.model.test.js
 * Tests for models/User.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

describe('User Model', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        process.env.JWT_SECRET = 'testsecret';
        process.env.JWT_EXPIRE = '30d';
    });

    describe('schema validation', () => {
        it('should create a valid user model', () => {
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                tel: '0812345678',
                password: 'password123'
            });

            const error = user.validateSync();

            expect(error).toBeUndefined();
            expect(user.name).toBe('Test User');
            expect(user.email).toBe('test@example.com');
            expect(user.tel).toBe('0812345678');
            expect(user.role).toBe('user');
            expect(user.isBlocked).toBe(false);
            expect(user.createdAt).toBeDefined();
        });

        it('should require name', () => {
            const user = new User({
                email: 'test@example.com',
                tel: '0812345678',
                password: 'password123'
            });

            const error = user.validateSync();

            expect(error).toBeDefined();
            expect(error.errors.name.message).toBe('Please add a name');
        });

        it('should require email', () => {
            const user = new User({
                name: 'Test User',
                tel: '0812345678',
                password: 'password123'
            });

            const error = user.validateSync();

            expect(error).toBeDefined();
            expect(error.errors.email.message).toBe('Please add an email');
        });

        it('should reject invalid email', () => {
            const user = new User({
                name: 'Test User',
                email: 'wrong-email',
                tel: '0812345678',
                password: 'password123'
            });

            const error = user.validateSync();

            expect(error).toBeDefined();
            expect(error.errors.email.message).toBe('Please add a valid email');
        });

        it('should require telephone number', () => {
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            });

            const error = user.validateSync();

            expect(error).toBeDefined();
            expect(error.errors.tel.message).toBe('Please add a telephone number');
        });

        it('should reject invalid telephone number', () => {
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                tel: '12345',
                password: 'password123'
            });

            const error = user.validateSync();

            expect(error).toBeDefined();
            expect(error.errors.tel.message).toBe(
                'Please add a valid telephone number'
            );
        });

        it('should reject role that is not user or admin', () => {
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                tel: '0812345678',
                role: 'manager',
                password: 'password123'
            });

            const error = user.validateSync();

            expect(error).toBeDefined();
            expect(error.errors.role).toBeDefined();
        });

        it('should require password', () => {
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                tel: '0812345678'
            });

            const error = user.validateSync();

            expect(error).toBeDefined();
            expect(error.errors.password.message).toBe('Please add a password');
        });

        it('should reject password shorter than 6 characters', () => {
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                tel: '0812345678',
                password: '123'
            });

            const error = user.validateSync();

            expect(error).toBeDefined();
            expect(error.errors.password).toBeDefined();
        });
    });

    describe('pre save password hashing', () => {
        it('should hash password before saving when password is modified', async () => {
            const genSaltSpy = jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt');
            const hashSpy = jest
                .spyOn(bcrypt, 'hash')
                .mockResolvedValue('hashedPassword');

            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                tel: '0812345678',
                password: 'password123'
            });

            user.isModified = jest.fn().mockReturnValue(true);

            await user.validate();
            await user.constructor.schema.s.hooks.execPre('save', user);

            expect(user.isModified).toHaveBeenCalledWith('password');
            expect(genSaltSpy).toHaveBeenCalledWith(10);
            expect(hashSpy).toHaveBeenCalledWith('password123', 'salt');
            expect(user.password).toBe('hashedPassword');

            genSaltSpy.mockRestore();
            hashSpy.mockRestore();
        });

        it('should not hash password when password is not modified', async () => {
            const genSaltSpy = jest.spyOn(bcrypt, 'genSalt');
            const hashSpy = jest.spyOn(bcrypt, 'hash');

            const user = new User({
                name: 'Test User',
                email: 'test2@example.com',
                tel: '0812345679',
                password: 'password123'
            });

            user.isModified = jest.fn().mockReturnValue(false);

            await user.constructor.schema.s.hooks.execPre('save', user);

            expect(user.isModified).toHaveBeenCalledWith('password');
            expect(genSaltSpy).not.toHaveBeenCalled();
            expect(hashSpy).not.toHaveBeenCalled();

            genSaltSpy.mockRestore();
            hashSpy.mockRestore();
        });
    });

    describe('getSignedJwtToken', () => {
        it('should return a signed JWT token', () => {
            const user = new User({
                _id: new mongoose.Types.ObjectId(),
                name: 'Test User',
                email: 'test@example.com',
                tel: '0812345678',
                password: 'password123'
            });

            const token = user.getSignedJwtToken();
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            expect(decoded.id).toBe(user._id.toString());
        });
    });

    describe('matchPassword', () => {
        it('should return true when password matches', async () => {
            const compareSpy = jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                tel: '0812345678',
                password: 'hashedPassword'
            });

            const result = await user.matchPassword('password123');

            expect(compareSpy).toHaveBeenCalledWith('password123', 'hashedPassword');
            expect(result).toBe(true);

            compareSpy.mockRestore();
        });

        it('should return false when password does not match', async () => {
            const compareSpy = jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                tel: '0812345678',
                password: 'hashedPassword'
            });

            const result = await user.matchPassword('wrongpassword');

            expect(compareSpy).toHaveBeenCalledWith('wrongpassword', 'hashedPassword');
            expect(result).toBe(false);

            compareSpy.mockRestore();
        });
    });
});