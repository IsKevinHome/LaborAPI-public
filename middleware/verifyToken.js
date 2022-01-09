const jwt = require("jsonwebtoken");
const asyncHandler = require("./async");
const ErrorResponse = require("../utils/errorResponse");

exports.verifyToken = (req, res, next) => {
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
    } else {
        // Forbidden
        return next(new ErrorResponse("Not authorized to access this route", 401));
    }

    jwt.verify(req.token, process.env.JWT_SECRET, (err, authData) => {
        if (err) {
            return next(new ErrorResponse("Not authorized to access this route", 401));
        } else {
            next();
        }
    });
};

// Admin verification
exports.verifyAdmin = (req, res, next) => {
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
    } else {
        // Forbidden
        return next(new ErrorResponse("Not authorized to access this route", 401));
    }

    jwt.verify(req.token, "adminSecret", (err, authData) => {
        if (err) {
            return next(new ErrorResponse("Not authorized to access this route", 401));
        } else {
            next();
        }
    });
};
