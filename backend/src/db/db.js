const mongoose = require("mongoose");

async function connectDB() {
    try {

        await mongoose.connect(process.env.MONGODB_URL);

        console.log("MongoDB Connected Successfully");

    } catch (err) {

        console.log(err);

        process.exit(1);

    }
}

module.exports = connectDB;