// lib/mongo.js
import mongoose from "mongoose";

/* ============================================================================
   ENV CHECK
============================================================================ */
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in your environment variables");
}

/* ============================================================================
   GLOBAL CACHE (PREVENTS HOT-RELOAD DUPES)
============================================================================ */
// eslint-disable-next-line no-var
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/* ============================================================================
   CONNECTION
============================================================================ */
async function connectMongo() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI)
      .then(mongoose => mongoose);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

/* ============================================================================
   EXPORTS
============================================================================ */
// default export (most common)
export default connectMongo;

// named export (optional convenience)
export { connectMongo as getDB };
