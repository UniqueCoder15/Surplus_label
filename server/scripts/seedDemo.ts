/**
 * Explicit demo seed for SurplusLabel (does NOT run on server startup).
 *
 * Creates clearly labeled demo accounts and sample listings:
 *   donor@greenmarket.org / DemoPass123!
 *   rescue@foodpantry.org / DemoPass123!
 *   admin@surpluslabel.org / DemoPass123!
 *
 * Usage:
 *   MONGODB_URI="mongodb+srv://..." tsx server/scripts/seedDemo.ts
 *
 * Options:
 *   --force   Replace existing demo records (isDemo: true) before inserting
 */

import dotenv from 'dotenv';
import path from 'path';
import { connectDatabase, disconnectDatabase } from '../db/connection';
import { UserModel } from '../models/User';
import { ListingModel } from '../models/Listing';
import { getInitialDemoUsers, getInitialDemoListings } from '../data/demoSeed';
import { enrichListingWithUrgency, FoodListing } from '../services/listingStore';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

async function main(): Promise<void> {
  const force = process.argv.includes('--force');

  if (!process.env.MONGODB_URI) {
    console.error('[Seed] MONGODB_URI is required.');
    process.exit(1);
  }

  const connected = await connectDatabase();
  if (!connected) {
    console.error('[Seed] Failed to connect to MongoDB.');
    process.exit(1);
  }

  const demoUsers = getInitialDemoUsers();
  const demoListings = getInitialDemoListings().map((item) =>
    enrichListingWithUrgency({
      ...item,
      urgencyBand: 'normal',
      urgencyLabel: 'Normal',
      daysRemaining: null,
      urgencyBadgeVariant: 'neutral',
      canDriveUrgency: true,
    } as FoodListing)
  );

  if (force) {
    const demoUserIds = demoUsers.map((u) => u.id);
    const demoListingIds = demoListings.map((l) => l.id);
    await UserModel.deleteMany({ $or: [{ isDemo: true }, { id: { $in: demoUserIds } }] });
    await ListingModel.deleteMany({ $or: [{ isDemo: true }, { id: { $in: demoListingIds } }] });
  }

  let usersInserted = 0;
  for (const user of demoUsers) {
    const exists = await UserModel.findOne({ $or: [{ id: user.id }, { email: user.email }] }).lean();
    if (exists && !force) {
      console.log(`[Seed] User ${user.email} already exists — skipping (use --force to replace demo data)`);
      continue;
    }
    if (exists && force) {
      await UserModel.updateOne({ id: user.id }, { $set: user }, { upsert: true });
    } else {
      await UserModel.create(user);
    }
    usersInserted += 1;
  }

  let listingsInserted = 0;
  for (const listing of demoListings) {
    const exists = await ListingModel.findOne({ id: listing.id }).lean();
    if (exists && !force) {
      continue;
    }
    if (exists && force) {
      await ListingModel.updateOne({ id: listing.id }, { $set: listing }, { upsert: true });
    } else if (!exists) {
      await ListingModel.create(listing);
      listingsInserted += 1;
    }
  }

  console.log(`[Seed] Demo users ready: ${usersInserted}/${demoUsers.length}`);
  console.log(`[Seed] Demo listings ready: ${listingsInserted}/${demoListings.length} newly inserted`);
  console.log('[Seed] Demo password for all demo accounts: DemoPass123!');
  await disconnectDatabase();
}

main().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
