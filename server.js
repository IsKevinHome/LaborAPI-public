const express = require("express");
const path = require("path");
// security
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
// end security
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const colors = require("colors");
const errorHandler = require("./middleware/error");
const connectDB = require("./config/db");

// load env vars (put this at top, need access)
dotenv.config({ path: "./config/config.env" });

// Route files
const unions = require("./routes/unions");

const { connect } = require("mongoose");

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

// Rate limiting
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 60 minutes
    max: 100, // request per 60 minutes
});

app.use(limiter);

// Enable CORS
app.use(cors());

// Prevent http param pollution
app.use(hpp());

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Mount routers
app.use("/api/v1/unions", unions);

// this middleware has to be below our router mounting
app.use(errorHandler);

app.use(express.static("build"));

const PORT = process.env.PORT || 5000;

const server = app.listen(
    PORT,
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold)
);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
    console.log(`Error: ${err.message}`.red);
    // Close server & exit process
    server.close(() => process.exit(1));
});
