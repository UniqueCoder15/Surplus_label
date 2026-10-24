/**
 * One-time migration: import legacy server/data/users.json and listings.json into MongoDB.
 *
 * Usage:
 *   MONGODB_URI="mongodb+srv://..." tsx server/scripts/migrateJsonToMongo.ts
 *
 * Options:
 *   --data-dir=/path/to/data   Override DATA_DIR (default: server/data)
 *   --dry-run                  Parse files and report counts without writing
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../db/connection';
import { UserModel } from '../models/User';
import { ListingModel } from '../models/Listing';
import { enrichListingWithUrgency, FoodListing } from '../services/listingStore';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

function resolveDataDir(): string {
  const flag = process.argv.find((arg) => arg.startsWith('--data-dir='));
  if (flag) {
    return path.resolve(flag.split('=')[1]);
  }
  return process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.resolve(process.cwd(), 'server/data');
}

function readJsonFile<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`[Migrate] Skipping missing file: ${filePath}`);
    return [];
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected JSON array in ${filePath}`);
  }
  return parsed as T[];
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const dataDir = resolveDataDir();
  const usersFile = path.join(dataDir, 'users.json');
  const listingsFile = path.join(dataDir, 'listings.json');

  const users = readJsonFile<Record<string, unknown>>(usersFile);
  const listings = readJsonFile<Record<string, unknown>>(listingsFile);

  console.log(`[Migrate] Found ${users.length} users and ${listings.length} listings in ${dataDir}`);

  if (dryRun) {
    console.log('[Migrate] Dry run complete. No database writes performed.');
    return;
  }

  if (!process.env.MONGODB_URI) {
    console.error('[Migrate] MONGODB_URI is required.');
    process.exit(1);
  }

  const connected = await connectDatabase();
  if (!connected) {
    console.error('[Migrate] Failed to connect to MongoDB.');
    process.exit(1);
  }

  let usersUpserted = 0;
  for (const user of users) {
    if (!user.id || !user.email) {
      console.warn('[Migrate] Skipping user record without id/email');
      continue;
    }
    await UserModel.updateOne({ id: user.id }, { $set: user }, { upsert: true });
    usersUpserted += 1;
  }

  let listingsUpserted = 0;
  for (const listing of listings) {
    if (!listing.id) {
      console.warn('[Migrate] Skipping listing record without id');
      continue;
    }
    const enriched = enrichListingWithUrgency(listing as unknown as FoodListing);
    await ListingModel.updateOne({ id: enriched.id }, { $set: enriched }, { upsert: true });
    listingsUpserted += 1;
  }

  console.log(`[Migrate] Upserted ${usersUpserted} users and ${listingsUpserted} listings.`);
  await disconnectDatabase();
}

main().catch((err) => {
  console.error('[Migrate] Failed:', err);
  process.exit(1);
});
