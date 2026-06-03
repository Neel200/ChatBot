// lib/dbConnect.ts
import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache =
  global.mongooseCache ?? { conn: null, promise: null };

global.mongooseCache = cached;

export async function dbConnect(): Promise<Mongoose> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined");
  }

  // Return existing connection if healthy
  if (cached.conn) {
    const state = cached.conn.connection.readyState;
    // 1 = connected, 2 = connecting — both are fine to reuse
    if (state === 1 || state === 2) {
      return cached.conn;
    }
    // Connection dropped — reset and reconnect
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,       // fail fast instead of queuing commands
        maxPoolSize: 10,             // reuse up to 10 sockets
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      })
      .catch((err) => {
        // Don't permanently cache a failed promise
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  global.mongooseCache = cached;
  return cached.conn;
}
