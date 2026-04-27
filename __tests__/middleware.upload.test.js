/**
 * __tests__/middleware.upload.test.js
 * Tests for middleware/upload.js
 */

const upload = require('../middleware/upload');

describe('Upload Middleware', () => {
    describe('fileFilter', () => {
        it('should accept image files', () => {
            const req = {};
            const file = {
                mimetype: 'image/png'
            };
            const cb = jest.fn();

            upload.fileFilter(req, file, cb);

            expect(cb).toHaveBeenCalledWith(null, true);
        });

        it('should accept another image type', () => {
            const req = {};
            const file = {
                mimetype: 'image/jpeg'
            };
            const cb = jest.fn();

            upload.fileFilter(req, file, cb);

            expect(cb).toHaveBeenCalledWith(null, true);
        });

        it('should reject non-image files', () => {
            const req = {};
            const file = {
                mimetype: 'application/pdf'
            };
            const cb = jest.fn();

            upload.fileFilter(req, file, cb);

            expect(cb).toHaveBeenCalledTimes(1);

            const error = cb.mock.calls[0][0];
            const accepted = cb.mock.calls[0][1];

            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('Please upload only image files');
            expect(accepted).toBe(false);
        });
    });

    describe('multer config', () => {
        it('should export upload middleware', () => {
            expect(upload).toBeDefined();
            expect(typeof upload.single).toBe('function');
            expect(typeof upload.array).toBe('function');
            expect(typeof upload.fields).toBe('function');
        });

        it('should export fileFilter for testing', () => {
            expect(upload.fileFilter).toBeDefined();
            expect(typeof upload.fileFilter).toBe('function');
        });

        it('should export storage for testing', () => {
            expect(upload.storage).toBeDefined();
        });
    });
});