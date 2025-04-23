import mongoose from 'mongoose';
import config from '../config';

// Try environment variables first, fall back to config
const MONGODB_URI = process.env.MONGODB_URI || config?.mongodb?.uri;

if (!MONGODB_URI) {
  console.error('Warning: MONGODB_URI is not defined in environment variables or config.js');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    console.log("Using cached MongoDB connection");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
      maxPoolSize: 10
    };

    try {
      console.log("Connecting to MongoDB...");
      cached.promise = mongoose.connect(MONGODB_URI, opts)
        .then((mongoose) => {
          console.log("Connected to MongoDB successfully");
          return mongoose;
        })
        .catch(err => {
          console.error("MongoDB connection error:", err);
          cached.promise = null;
          throw err;
        });
    } catch (error) {
      console.error("Error initializing MongoDB connection:", error);
      cached.promise = null;
      throw error;
    }
  }
  
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error("Failed to establish MongoDB connection:", error);
    cached.promise = null;
    throw error;
  }
}

export default connectDB; 