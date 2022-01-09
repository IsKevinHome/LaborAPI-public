const mongoose = require("mongoose");
const slugify = require("slugify");
const geocoder = require("../utils/geocoder");

const UnionSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: [true, "Please add a company name"],
        unique: true,
        trim: true,
        maxlength: [100, "Company name can not be more than 10 characters"],
    },
    unionName: {
        type: String,
        required: [true, "Please add a union name"],
        unique: false,
        trim: true,
        maxlength: [100, "Union name can not be more than 10 characters"],
    },
    slug: String,
    description: {
        type: String,
        required: [true, "Please add a name"],
        trim: true,
        maxlength: [750, "Description can not be more than 500 characters"],
    },
    demands: {
        type: Array,
        trim: true,
        required: [true, "Please add union demands"],
        maxlength: [10, "Cannot have more than 10 demands."],
    },
    source: {
        type: Array,
        match: [
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
            "Please use a valid URL with HTTP or HTTPS",
        ],
    },
    address: {
        type: String,
        required: [true, "Please add an address"],
    },
    location: {
        // Mongoose GeoJSON Point
        type: {
            type: String,
            enum: ["Point"],
        },
        coordinates: {
            type: [Number],
            index: "2dsphere",
        },
        formattedAddress: String,
        street: String,
        city: String,
        state: String,
        zipcode: String,
        country: String,
    },
    startDate: {
        type: Date,
        required: [true, "Please enter a start date"],
    },
    endDate: {
        type: Date,
    },
    ongoing: {
        type: Boolean,
        required: [true, "please indicate if strike is ongoing"],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Create bootcamp slug from the companyName (using slugify)
UnionSchema.pre("save", function (next) {
    this.slug = slugify(this.companyName, { lower: true });
    next();
});

// GEOCODE & CREATE LOCATION FIELD
UnionSchema.pre("save", async function (next) {
    const loc = await geocoder.geocode(this.address);
    this.location = {
        type: "Point",
        coordinates: [loc[0].longitude, loc[0].latitude],
        formattedAddress: loc[0].formattedAddress,
        street: loc[0].streetName,
        street: loc[0].city,
        state: loc[0].stateCode,
        zipcode: loc[0].zipcode,
        country: loc[0].countryCode,
    };

    //Do not save address in DB (prevents it from being saved to DB)
    this.address = undefined;

    next();
});

module.exports = mongoose.model("Union", UnionSchema);
