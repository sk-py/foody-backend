const mongoose = require("mongoose")


const ConnectToMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Database connected successfully");
    } catch (error) {
        console.log(error);
        process.exit(1)
    }
}

module.exports  = ConnectToMongo
