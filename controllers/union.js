const Union = require("../models/Union");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const geocoder = require("../utils/geocoder");
const jwt = require("jsonwebtoken");
const express = require("express");

//@desc     Get token
//@route    /api/v1/gettoken
//@access   Public
exports.getToken = asyncHandler(async (req, res, next) => {
    // Mock user
    const user = { id: 2, username: "guest" };

    jwt.sign({ user: user }, process.env.JWT_SECRET, { expiresIn: "30d" }, (err, token) => {
        res.json({ token: token });
    });
});

// @desc        Get all unions
// @route       GET /api/v1/unions
//@access       Public
exports.getUnions = asyncHandler(async (req, res, next) => {
    let query;

    // Copy req.query (spread the request.query object into a new variable.)
    let reqQuery = { ...req.query };
    console.log("before removeFields".red, reqQuery);

    // Fields to exclude (fields we don't want to be matched for filtering)
    const removeFields = ["select", "sort", "page", "limit"];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach((param) => delete reqQuery[param]);
    console.log("after removeFields".blue, reqQuery);

    // Create Query String
    let queryStr = JSON.stringify(req.query);

    // regular expression to allow us to use mongo operators.
    // Don't really need this line if you aren't using these operators
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`);

    // Finding resource (we parase it back into json.)
    query = Union.find(JSON.parse(queryStr));

    // Select Fields
    if (req.query.select) {
        const fields = req.query.select.split(",").join(" ");
        query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
        const sortBy = req.query.sort.split(",").join(" ");
        query = query.sort(sortBy);
    } else {
        query = query.sort("-createdAt");
    }

    if (!req.query.page) {
        const union = await query;
        return res.status(200).json({ success: true, count: union.length, data: union });
    }

    // Pagination

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Union.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const unions = await query;

    // Pagination result
    let pagination = {};
    // The two below if statements are to check if there is another page, or a previous page
    if (endIndex < total) {
        pagination.next = {
            page: page + 1,
            // below is the same as doing limit: limit, just some syntactic sugar.
            limit,
        };
    }

    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit,
        };
    }

    res.status(200).json({
        success: true,
        count: unions.length,
        pagination: pagination,
        data: unions,
    });
});

// @desc        Get single union
// @route       GET /api/v1/unions/:id
//@access       Public
exports.getUnion = asyncHandler(async (req, res, next) => {
    const union = await Union.findById(req.params.id);

    if (!union) {
        return next(new ErrorResponse(`Union not found  with id of ${req.params.id}`, 404));
    }
    res.status(200).json({ success: true, data: union });
});

// @desc        Create new union
// @route       POST /api/v1/unions
//@access       Private
exports.createUnion = asyncHandler(async (req, res, next) => {
    const union = await Union.create(req.body);

    res.status(201).json({
        success: true,
        data: union,
    });
});

// @desc        Update union
// @route       PUT /api/v1/unions/:id
//@access       Private
exports.updateUnion = asyncHandler(async (req, res, next) => {
    const union = await Union.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!union) {
        return next(new ErrorResponse(`Union not found  with id of ${req.params.id}`, 404));
    }
    res.status(200).json({ success: true, data: union });
});

// @desc        Delete union
// @route       DELETE /api/v1/unions/:id
//@access       Private
exports.deleteUnion = asyncHandler(async (req, res, next) => {
    const union = await Union.findByIdAndDelete(req.params.id);

    if (!union) {
        return next(new ErrorResponse(`Union not found  with id of ${req.params.id}`, 404));
    }
    res.status(200).json({ success: true, data: {} });
});

// @desc        Get unions within a radius
// @route       GET /api/v1/unions/radius/:zipcode/:distance
//@access       public
exports.getUnionsInRadius = asyncHandler(async (req, res, next) => {
    const { zipcode, distance } = req.params;

    // Get latitude / longitude from geocoder
    const loc = await geocoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const lng = loc[0].longitude;

    // Calculate radius using radians
    // Divide distance by radius of Earth
    // Earth Radius = 3,963 miles / 6,378 km
    const radius = distance / 3963;

    const unions = await Union.find({
        location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });
    res.status(200).json({
        success: true,
        count: unions.length,
        data: unions,
    });
});

// Verify Token middleware
function verifyToken(req, res, next) {
    // Get auth header value
    const bearerHeader = req.headers["authorization"];
    // Check if bearer is undefined
    if (typeof bearerHeader !== "undefined") {
        // Split at the space (we dont want the 'bearer' string)
        const bearer = bearerHeader.split(" ");
        // Get token from array
        const bearerToken = bearer[1];
        // Set the token
        req.token = bearerToken;
        //Next middleware
        next();
    } else {
        // Forbidden
        res.sendStatus(403);
    }
}
