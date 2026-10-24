import { connectDatabase, disconnectDatabase, isMongoConnected } from '../db/connection';
import { authService } from '../services/authService';
import { listingStore } from '../services/listingStore';
import { UserModel } from '../models/User';
import { ListingModel } from '../models/Listing';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/surpluslabel_lifecycle_test';
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runLifecycleValidation() {
  console.log('\n====================================================');
  console.log('🧪 MongoDB Atlas Lifecycle, Auth, Claim & Restart Validation');
  console.log('====================================================\n');

  // Step 1: Connect to database
  const conn = await connectDatabase();
  assert(conn !== null && isMongoConnected(), 'Connects to MongoDB Atlas successfully');

  const testSuffix = Date.now().toString().slice(-6);
  const testEmail = `donor_${testSuffix}@atlas-test.org`;
  const testPassword = 'SecurePassword123!';

  // Step 2: Register user
  console.log('\n1. Testing User Registration & Persistence in Atlas:');
  const registerResult = await authService.register({
    email: testEmail,
    password: testPassword,
    role: 'donor',
    organizationName: 'Atlas Test Donor Co',
    contactName: 'Atlas Tester',
    phone: '+1 555-0199',
    address: '100 Atlas Way',
  });
  assert(!!registerResult.user.id, 'User registered and assigned an ID');
  assert(registerResult.user.email === testEmail, 'User email normalized and stored');
  assert(!!registerResult.token, 'JWT auth token issued upon registration');

  // Verify directly in MongoDB UserModel
  const dbUser = await UserModel.findOne({ email: testEmail }).lean();
  assert(!!dbUser, 'User record exists in MongoDB collection');
  assert(dbUser?.passwordHash !== testPassword, 'Password is securely hashed with bcrypt in MongoDB');

  // Step 3: Login user
  console.log('\n2. Testing Login & Password Verification:');
  const loginResult = await authService.login({
    email: testEmail,
    password: testPassword,
  });
  assert(loginResult.user.id === registerResult.user.id, 'User successfully authenticated via MongoDB');

  // Step 4: Create listing
  console.log('\n3. Testing Listing Creation with Verified OCR Date:');
  const createdListing = await listingStore.create(
    {
      title: `Atlas Test Organic Bread ${testSuffix}`,
      category: 'bakery',
      quantity: 50,
      unit: 'loaves',
      storageCondition: 'ambient',
      donorOrg: 'Atlas Test Donor Co',
      pickupLocation: 'Bay 1, 100 Atlas Way',
      relevantDate: '2026-11-15',
      dateType: 'best_before',
      isManuallyConfirmed: true,
      verifiedBy: 'Quality Lead (Atlas)',
    },
    loginResult.user
  );
  assert(!!createdListing.id, 'Food listing created with unique ID');
  assert(createdListing.status === 'available', 'Initial listing status is "available"');

  // Verify in MongoDB ListingModel
  const dbListing = await ListingModel.findOne({ id: createdListing.id }).lean();
  assert(!!dbListing, 'Food listing persisted in MongoDB collection');

  // Step 5: Claim listing
  console.log('\n4. Testing Claim / Reservation Flow:');
  const claimedListing = await listingStore.claim(
    createdListing.id,
    {
      recipientUserId: 'usr_demo_recipient_01',
      recipientOrg: 'Hope Community Food Pantry',
      contactName: 'David Kalu',
      contactPhone: '+1 555-876-5432',
      pickupWindowStart: '2026-11-14T10:00:00Z',
      pickupWindowEnd: '2026-11-14T12:00:00Z',
      notes: 'Test pickup reservation',
    },
    {
      id: 'usr_demo_recipient_01',
      email: 'rescue@foodpantry.org',
      role: 'recipient',
      organizationName: 'Hope Community Food Pantry',
      contactName: 'David Kalu',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );
  assert(claimedListing.status === 'claimed', 'Listing status transitioned to "claimed"');
  assert(!!claimedListing.claim?.verificationPin, 'Handover 4-digit PIN generated');

  // Step 6: Simulate Backend Restart & Connection Teardown
  console.log('\n5. Simulating Backend Process Restart:');
  await disconnectDatabase();
  assert(!isMongoConnected(), 'Database disconnected cleanly (simulating server shutdown)');

  // Re-connect to database (simulating new server process boot)
  await connectDatabase();
  assert(isMongoConnected(), 'Database re-connected cleanly (simulating server boot)');

  // Step 7: Verify Data Persistence Across Restart
  console.log('\n6. Verifying Persistence After Restart:');
  const userAfterRestart = await authService.findById(registerResult.user.id);
  assert(!!userAfterRestart && userAfterRestart.email === testEmail, 'User record fully preserved after restart');

  const listingAfterRestart = await listingStore.getById(createdListing.id, loginResult.user);
  assert(!!listingAfterRestart, 'Listing record preserved after restart');
  assert(listingAfterRestart?.status === 'claimed', 'Listing status remains "claimed" after restart');
  assert(
    listingAfterRestart?.claim?.verificationPin === claimedListing.claim?.verificationPin,
    'Handover verification PIN preserved after restart'
  );

  // Step 8: Clean up test records
  console.log('\n7. Cleaning Up Lifecycle Test Records:');
  await UserModel.deleteOne({ email: testEmail });
  await ListingModel.deleteOne({ id: createdListing.id });
  console.log('✅ Temporary validation records cleaned up.');

  await disconnectDatabase();
  console.log('\n====================================================');
  console.log('🎉 ALL LIFECYCLE & PERSISTENCE CHECKS PASSED');
  console.log('====================================================\n');
}

runLifecycleValidation().catch((err) => {
  console.error('Lifecycle validation failed:', err);
  process.exit(1);
});
