// ===================
// node seeder -d
// to delete
// node seeder -i
// to import
// ===================

// 'fs' is the file system module, included with node
const fs = require("fs");
const mongoose = require("mongoose");
const colors = require("colors");
const dotenv = require("dotenv");

// Load env vars
dotenv.config({ path: "./config/config.env" });

// Load models
const Union = require("./models/Union");

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

//Read JSON files
const unions = JSON.parse(fs.readFileSync(`${__dirname}/_data/unions.json`, "utf-8"));

// Import into DB
const importData = async () => {
    try {
        await Union.create(unions);

        console.log("Data Imported...".green.inverse);
        process.exit();
    } catch (err) {
        console.log(err);
    }
};

// Delete data
const deleteData = async () => {
    try {
        await Union.deleteMany();

        console.log("Data Destroyed...".red.inverse);
        process.exit();
    } catch (err) {
        console.log(err);
    }
};

if (process.argv[2] === "-i") {
    importData();
} else if (process.argv[2] === "-d") {
    deleteData();
}
