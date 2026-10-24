import path from 'path';
import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../db/connection';
import { authService } from '../services/authService';
import { listingStore } from '../services/listingStore';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

/**
 * Connects to MongoDB for integration tests and resets demo datasets.
 * Uses MONGODB_URI when set; otherwise defaults to a local test database.
 */
export async function setupIntegrationTestDatabase(): Promise<void> {
  if (!process.env.MONGODB_URI) {
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/surpluslabel_test';
  }

  const connected = await connectDatabase();
  if (!connected) {
    throw new Error(
      'Integration tests require MongoDB. Set MONGODB_URI or run a local MongoDB instance on 127.0.0.1:27017.'
    );
  }

  await authService.resetToDemo();
  await listingStore.resetToDemo();
}

export async function teardownIntegrationTestDatabase(): Promise<void> {
  await disconnectDatabase();
}
