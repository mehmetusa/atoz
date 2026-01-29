// lib/mongo.js
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("Please define MONGODB_URI in .env.local");

// global cache for hot reloads in dev
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

// named export
export async function getDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then(m => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
