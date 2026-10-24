import fs from 'fs';
import path from 'path';
import { setupIntegrationTestDatabase, teardownIntegrationTestDatabase } from './testDb';
import { cloudinary, configureCloudinary, isCloudinaryConfigured } from '../cloudinary';
import { listingStore } from '../services/listingStore';
import { ListingModel } from '../models/Listing';
import { SafeUser } from '../services/authService';

const mockDonorUser: SafeUser = {
  id: 'usr_test_donor',
  contactName: 'QA Test Donor',
  email: 'qa-donor@surpluslabel.org',
  role: 'donor',
  organizationName: 'QA Test Org',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

async function run() {
  console.log('\n====================================================');
  console.log('🧪 Running SurplusLabel Cloudinary Image Flow Validation');
  console.log('====================================================\n');

  console.log('1. Cloudinary Credential and Configuration Check:');
  configureCloudinary();
  const isConfigured = isCloudinaryConfigured();
  if (!isConfigured) {
    throw new Error('Cloudinary credentials missing or unconfigured!');
  }
  console.log('  ✓ Cloudinary configuration initialized.');

  const ping = await cloudinary.api.ping();
  console.log('  ✓ Cloudinary API reachable:', ping);

  console.log('\n2. Database Setup:');
  await setupIntegrationTestDatabase();
  console.log('  ✓ Database connected.');

  console.log('\n3. Real Image Stream Upload to Cloudinary:');
  const sampleImagePath = path.resolve(process.cwd(), 'public/noodles.jpg');
  const fileBuffer = fs.readFileSync(sampleImagePath);

  const uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'surpluslabel/food_listings',
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto' },
        ],
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Upload stream produced no result'));
        }
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );
    uploadStream.end(fileBuffer);
  });

  console.log('  ✓ Cloudinary upload succeeded with HTTPS URL:', uploadResult.secure_url);
  console.log('  ✓ Cloudinary public_id:', uploadResult.public_id);

  if (!uploadResult.secure_url.startsWith('https://res.cloudinary.com/')) {
    throw new Error('Returned URL is not a valid HTTPS Cloudinary URL!');
  }

  console.log('\n4. Persisting Listing with Cloudinary Image to Database:');
  const createdListing = await listingStore.create(
    {
      title: 'Cloudinary Verified Test Product',
      category: 'canned_packaged',
      quantity: 12,
      unit: 'packets',
      storageCondition: 'cool_dry',
      handlingNotes: 'Verified Cloudinary persistence',
      donorOrg: 'QA Test Org',
      pickupLocation: 'Main Warehouse Sector 4',
      contactPhone: '+1 (555) 234-5678',
      imageUrl: uploadResult.secure_url,
      imagePublicId: uploadResult.public_id,
      relevantDate: '2026-11-20',
      dateType: 'expiry',
      isManuallyConfirmed: true,
      verifiedBy: 'QA Image Verifier',
      rawOcrText: 'EXP 20/11/2026',
      ocrConfidence: 99,
    },
    mockDonorUser
  );

  console.log('  ✓ Listing persisted with ID:', createdListing.id);
  console.log('  ✓ Stored imageUrl:', createdListing.imageUrl);

  if (createdListing.imageUrl !== uploadResult.secure_url) {
    throw new Error('Stored listing imageUrl does not match Cloudinary secure_url!');
  }

  console.log('\n5. Re-fetching Listing from Database:');
  const fetchedListing = await listingStore.getById(createdListing.id);
  console.log('  ✓ Fetched listing imageUrl:', fetchedListing?.imageUrl);

  if (fetchedListing?.imageUrl !== uploadResult.secure_url) {
    throw new Error('Re-fetched imageUrl does not match Cloudinary secure_url!');
  }

  console.log('\n6. Legacy Stale Blob URL Sanitization Verification:');
  const legacyListing = await listingStore.create(
    {
      title: 'Legacy Listing with Stale Blob URL',
      category: 'dairy',
      quantity: 4,
      unit: 'bottles',
      storageCondition: 'chilled',
      donorOrg: 'Legacy Dairy Org',
      pickupLocation: 'Hub B',
      contactPhone: '+1 (555) 345-6789',
      imageUrl: 'blob:https://surplus-label.vercel.app/test-stale-uuid-1234',
      relevantDate: '2026-10-31',
      dateType: 'expiry',
      isManuallyConfirmed: true,
      verifiedBy: 'QA Image Verifier',
    },
    mockDonorUser
  );

  const fetchedLegacy = await listingStore.getById(legacyListing.id);
  console.log('  ✓ Legacy raw blob saved:', legacyListing.imageUrl);
  console.log('  ✓ Legacy sanitized on read:', fetchedLegacy?.imageUrl);

  if (fetchedLegacy?.imageUrl?.startsWith('blob:')) {
    throw new Error('Legacy blob URL was not sanitized on read!');
  }
  if (fetchedLegacy?.imageUrl !== '/milk.jpg') {
    throw new Error(`Expected category fallback '/milk.jpg', received: ${fetchedLegacy?.imageUrl}`);
  }

  console.log('\n7. Cleanup Test Records:');
  await ListingModel.deleteOne({ id: createdListing.id });
  await ListingModel.deleteOne({ id: legacyListing.id });
  console.log('  ✓ Test listings cleaned up from database.');

  await teardownIntegrationTestDatabase();

  console.log('\n====================================================');
  console.log('🎉 ALL CLOUDINARY FLOW CHECKS PASSED SUCCESSFULLY');
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
