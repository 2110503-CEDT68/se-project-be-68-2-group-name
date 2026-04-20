const CoworkingSpace = require('../models/CoworkingSpace');
const Reservation = require('../models/Reservation');

exports.getCoworkingSpaces = async (req, res, next) => {
    let query;

    const reqQuery = { ...req.query };
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);
    console.log(reqQuery);

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    query = CoworkingSpace.find(JSON.parse(queryStr))
        .populate('reservations')
        .populate({
            path: 'comments',
            populate: {
                path: 'user',
                select: 'name email'
            }
        });

    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }

    try {

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 25;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await CoworkingSpace.countDocuments(JSON.parse(queryStr));

        query = query.skip(startIndex).limit(limit);

        // Execute query
        const coworkingSpace = await query;

        // Pagination result
        const pagination = {};
        if (endIndex < total) {
            pagination.next = { page: page + 1, limit };
        }
        if (startIndex > 0) {
            pagination.prev = { page: page - 1, limit };
        }

        res.status(200).json({
            success: true,
            count: coworkingSpace.length,
            data: coworkingSpace
        });
    } catch (err) {
        res.status(400).json({ success: false });
    }
}

exports.getCoworkingSpace = async (req, res, next) => {
    try {
        const coworkingSpace = await CoworkingSpace.findById(req.params.id);

        // const coworkingSpace = await CoworkingSpace.findById(req.params.id).populate({
        //     path: 'comments',
        //     populate: {
        //         path: 'user',
        //         select: 'name email'
        //     }
        // });

        if (!coworkingSpace) {
            return res.status(400).json({ success: false });
        }

        res.status(200).json({ success: true, data: coworkingSpace });
    } catch (err) {
        res.status(400).json({ success: false });
    }
}

exports.createCoworkingSpace = async (req, res, next) => {
    const coworkingSpace = await CoworkingSpace.create(req.body);
    res.status(201).json({ success: true, data: coworkingSpace });
}

exports.updateCoworkingSpace = async (req, res, next) => {
    try {
        const coworkingSpace = await CoworkingSpace.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!coworkingSpace) {
            return res.status(404).json({ success: false });
        }

        res.status(200).json({ success: true, data: coworkingSpace });
    } catch (err) {
        res.status(400).json({ success: false });
    }
}

exports.deleteCoworkingSpace = async (req, res, next) => {
    try {
        const coworkingSpace = await CoworkingSpace.findById(req.params.id);

        if (!coworkingSpace) {
            return res.status(404).json({ success: false });
        }

        await Reservation.deleteMany({ coworkingSpace: req.params.id });
        await CoworkingSpace.deleteOne({ _id: req.params.id });

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false });
    }
}