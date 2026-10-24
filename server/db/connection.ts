import mongoose from 'mongoose';

let isConnecting = false;

/**
 * Connect to MongoDB Atlas using MONGODB_URI.
 * Manages singleton connection to prevent duplicate connections during hot reload.
 */
export async function connectDatabase(): Promise<typeof mongoose | null> {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '' || uri === 'your_mongodb_connection_string_here') {
    return null;
  }

  // If already connected (readyState 1), return active instance
  if (isMongoConnected()) {
    return mongoose;
  }

  if (isConnecting) {
    // Wait for in-flight connection
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (isMongoConnected() || !isConnecting) {
          clearInterval(interval);
          resolve(null);
        }
      }, 50);
    });
    return isMongoConnected() ? mongoose : null;
  }

  try {
    isConnecting = true;
    console.log('[Database] Connecting to MongoDB Atlas...');

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      autoIndex: true, // Build indexes in production
    });

    console.log('[Database] ✅ Connected to MongoDB Atlas successfully.');
    return conn;
  } catch (err: any) {
    console.error('[Database] ❌ Failed to connect to MongoDB Atlas:', err?.message || err);
    return null;
  } finally {
    isConnecting = false;
  }
}

/**
 * Checks whether MongoDB is actively connected.
 */
export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected;
}

/**
 * Disconnects from MongoDB (for graceful shutdown or test teardown).
 */
export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[Database] Disconnected from MongoDB Atlas.');
  }
}
