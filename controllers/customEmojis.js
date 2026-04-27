const cloudinary = require('../config/cloudinary');
const CustomEmoji = require('../models/CustomEmoji');

const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'custom-emojis',
                resource_type: 'image',

                width: 64,
                height: 64,
                crop: 'fill',
                gravity: 'auto'
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve(result);
            }
        );

        uploadStream.end(fileBuffer);
    });
};

exports.uploadCustomEmoji = async (req, res) => {
    try {
        console.log('BODY:', req.body);
        console.log('FILE:', req.file);

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an image'
            });
        }

        const result = await uploadToCloudinary(req.file.buffer);

        const emoji = await CustomEmoji.create({
            name: req.body.name,
            imageUrl: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            user: req.user.id
        });

        res.status(201).json({
            success: true,
            data: emoji
        });
    } catch (error) {
        console.error('UPLOAD ERROR:', error);

        res.status(500).json({
            success: false,
            message: 'Cannot upload image',
            error: error.message
        });
    }
};

exports.getMyCustomEmojis = async (req, res) => {
    try {
        const emojis = await CustomEmoji.find({
            user: req.user.id
        }).sort('-createdAt');

        res.status(200).json({
            success: true,
            count: emojis.length,
            data: emojis
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Cannot get custom emojis'
        });
    }
};

exports.deleteCustomEmoji = async (req, res) => {
    try {
        const emoji = await CustomEmoji.findById(req.params.id);

        if (!emoji) {
            return res.status(404).json({
                success: false,
                message: 'Custom emoji not found'
            });
        }

        if (emoji.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to delete this emoji'
            });
        }

        await cloudinary.uploader.destroy(emoji.publicId);

        await emoji.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Cannot delete custom emoji'
        });
    }
};