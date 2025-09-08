import mongoose from "mongoose";

// Connect to MongoDB

export const connectDB = async () => {
    try {

        mongoose.connection.on('connected', ()=> console.log('MongoDB Connected'))

        await mongoose.connect(`${process.env.MONGODB_URI}/chattrix`)
    } catch (error) {
        console.log(error);
    }
}