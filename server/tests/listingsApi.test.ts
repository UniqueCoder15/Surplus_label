import http from 'http';
import app from '../index';
import { listingStore } from '../services/listingStore';
import { authService } from '../services/authService';

let server: http.Server;
let port: number;

function makeRequest(
  method: string,
  path: string,
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any }> {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const reqHeaders: Record<string, string> = {
      ...headers,
    };

    if (body) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(dataString).toString();
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed: any;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolve({ status: res.statusCode || 500, headers: res.headers, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(dataString);
    }
    req.end();
  });
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runListingsApiTests() {
  console.log('\n====================================================');
  console.log('🧪 Running SurplusLabel Food Listings & Claims API Tests');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  // Start test server on dynamic port
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address() as any;
      port = address.port;
      resolve();
    });
  });

  try {
    // Reset listing store to clean initial demo state
    listingStore.resetToDemo();

    // 1. GET /api/listings
    console.log('1. Fetch Listings & Summary Metrics:');
    const resAll = await makeRequest('GET', '/api/listings');
    total++;
    assert(resAll.status === 200, 'GET /api/listings responds with 200 OK');
    passed++;

    total++;
    assert(resAll.body.success === true, 'Response reports success: true');
    passed++;

    total++;
    assert(Array.isArray(resAll.body.data) && resAll.body.data.length >= 5, 'Returns initial seeded listings (>= 5)');
    passed++;

    total++;
    assert(
      typeof resAll.body.metrics?.totalListings === 'number' &&
      typeof resAll.body.metrics?.availableQuantity === 'number' &&
      typeof resAll.body.metrics?.urgentListings === 'number' &&
      typeof resAll.body.metrics?.claimedListings === 'number',
      'Returns complete summary metrics payload'
    );
    passed++;

    // 2. Search & Filter
    console.log('\n2. Search, Filtering, and Sorting:');
    const resSearch = await makeRequest('GET', '/api/listings?search=sourdough');
    total++;
    assert(
      resSearch.body.data.length >= 1 && resSearch.body.data[0].title.toLowerCase().includes('sourdough'),
      'Search query filter accurately matches food item title'
    );
    passed++;

    const resCategory = await makeRequest('GET', '/api/listings?category=dairy');
    total++;
    assert(
      resCategory.body.data.every((item: any) => item.category === 'dairy'),
      'Category filter returns only dairy products'
    );
    passed++;

    const resStatus = await makeRequest('GET', '/api/listings?status=claimed');
    total++;
    assert(
      resStatus.body.data.every((item: any) => item.status === 'claimed'),
      'Status filter returns only claimed listings'
    );
    passed++;

    // 3. GET /api/listings/:id
    console.log('\n3. Single Listing Retrieval & 404 Handlers:');
    const existingId = resAll.body.data[0].id;
    const resSingle = await makeRequest('GET', `/api/listings/${existingId}`);
    total++;
    assert(resSingle.status === 200 && resSingle.body.data.id === existingId, 'Retrieves existing listing by ID');
    passed++;

    const resNotFound = await makeRequest('GET', '/api/listings/lst_nonexistent_999');
    total++;
    assert(resNotFound.status === 404, 'Returns 404 Not Found for non-existent ID');
    passed++;

    // 4. POST /api/listings Validation Gates
    console.log('\n4. Listing Creation & Strict Human Verification Enforcement:');
    const demoDonor = authService.findById('usr_demo_donor_01')!;
    const donorToken = authService.generateToken(demoDonor);
    const donorHeaders = { Authorization: `Bearer ${donorToken}` };

    const demoRecipient = authService.findById('usr_demo_recipient_01')!;
    const recipientToken = authService.generateToken(demoRecipient);
    const recipientHeaders = { Authorization: `Bearer ${recipientToken}` };

    // Missing required fields
    const resMissing = await makeRequest('POST', '/api/listings', {
      title: 'Incomplete Listing',
    }, donorHeaders);
    total++;
    assert(resMissing.status === 400, 'Rejects incomplete payload with 400 Bad Request');
    passed++;

    // Impossible calendar date
    const resBadDate = await makeRequest('POST', '/api/listings', {
      title: 'Impossible Date Item',
      category: 'produce',
      quantity: 10,
      unit: 'kg',
      donorOrg: 'Organic Orchard',
      pickupLocation: 'Gate 2',
      relevantDate: '2026-02-30', // Feb 30th is impossible
      dateType: 'expiry',
      isManuallyConfirmed: true,
      verifiedBy: 'Quality Inspector',
    }, donorHeaders);
    total++;
    assert(resBadDate.status === 400, 'Rejects impossible calendar date (Feb 30) with 400 Bad Request');
    passed++;

    // STRICT HUMAN CONFIRMATION REQUIREMENT: Unconfirmed OCR must be blocked
    const resUnconfirmed = await makeRequest('POST', '/api/listings', {
      title: 'Automated Unverified OCR Item',
      category: 'pantry_grains',
      quantity: 20,
      unit: 'packs',
      donorOrg: 'Mega Mart',
      pickupLocation: 'Loading Bay 1',
      relevantDate: '2026-11-20',
      dateType: 'expiry',
      isManuallyConfirmed: false, // NOT CONFIRMED BY HUMAN
      verifiedBy: '',
    }, donorHeaders);
    total++;
    assert(
      resUnconfirmed.status === 400 && resUnconfirmed.body.error.includes('human confirmation'),
      'Rejects listing submission without explicit human verification sign-off'
    );
    passed++;

    // Valid listing creation
    const newListingPayload = {
      title: 'Fresh Packaged Baby Spinach 250g',
      category: 'produce',
      quantity: 15,
      unit: 'bags',
      storageCondition: 'chilled',
      handlingNotes: 'Pre-washed baby spinach in perforated bags. Must remain refrigerated.',
      donorOrg: 'GreenMarket Community Co-op',
      pickupLocation: 'Bay 5, Farmer Market Terminal, Route 9',
      contactPhone: '+1 (555) 789-0123',
      relevantDate: '2026-10-30',
      dateType: 'use_by',
      isManuallyConfirmed: true,
      verifiedBy: 'Chef Gordon Miller (Mess Lead)',
      rawOcrText: 'USE BY 30 OCT 2026 PACKED FRESH',
      ocrConfidence: 93,
    };

    const resCreated = await makeRequest('POST', '/api/listings', newListingPayload, donorHeaders);
    total++;
    assert(resCreated.status === 201, 'Successfully creates validated listing with 201 Created');
    passed++;

    total++;
    assert(resCreated.body.data.id.startsWith('lst_'), 'Assigns unique persistent listing ID');
    passed++;

    total++;
    assert(
      resCreated.body.data.isManuallyConfirmed === true &&
      resCreated.body.data.verifiedBy === 'Chef Gordon Miller (Mess Lead)',
      'Preserves human verifier sign-off and audit timestamps'
    );
    passed++;

    const createdId = resCreated.body.data.id;

    // 5. Duplicate Submission Protection
    console.log('\n5. Duplicate Submission Protection:');
    const resDuplicate = await makeRequest('POST', '/api/listings', newListingPayload, donorHeaders);
    total++;
    assert(resDuplicate.status === 400 && resDuplicate.body.error.includes('Duplicate'), 'Prevents rapid duplicate submission');
    passed++;

    // 6. Recipient Claim Flow & Conflicting Claim Prevention
    console.log('\n6. Donation Coordination & Claim Conflict Prevention:');
    const claimPayload = {
      recipientOrg: 'Hope Community Food Pantry',
      contactName: 'David Kalu',
      contactPhone: '+1 (555) 876-5432',
      contactEmail: 'rescue@foodpantry.org',
      pickupWindowStart: '2026-10-24T10:00:00Z',
      pickupWindowEnd: '2026-10-24T12:00:00Z',
      notes: 'Our temperature-monitored refrigerated van will arrive at 10:30 AM.',
    };

    const resClaim = await makeRequest('PATCH', `/api/listings/${createdId}/claim`, claimPayload, recipientHeaders);
    total++;
    assert(resClaim.status === 200, 'Successfully claims available food listing');
    passed++;

    total++;
    assert(resClaim.body.data.status === 'claimed', 'Updates listing status to claimed');
    passed++;

    total++;
    assert(
      typeof resClaim.body.data.claim?.verificationPin === 'string' &&
      resClaim.body.data.claim.verificationPin.length === 4,
      'Generates 4-digit recipient verification handover PIN'
    );
    passed++;

    // CONFLICTING CLAIM TEST: Attempting to claim an already claimed listing must return HTTP 409
    const resConflictingClaim = await makeRequest('PATCH', `/api/listings/${createdId}/claim`, {
      recipientOrg: 'Another Food Bank',
      contactName: 'Bob Smith',
      contactPhone: '+1 (555) 111-2222',
      pickupWindowStart: '2026-10-24T14:00:00Z',
      pickupWindowEnd: '2026-10-24T16:00:00Z',
    }, recipientHeaders);
    total++;
    assert(
      resConflictingClaim.status === 409,
      'Prevents conflicting double-claims with HTTP 409 Conflict'
    );
    passed++;

    // 7. Status Transitions
    console.log('\n7. Donation Status Lifecycle Transitions:');
    // Transition from claimed -> collected (donor owner)
    const resCollected = await makeRequest('PATCH', `/api/listings/${createdId}/status`, {
      status: 'collected',
      notes: 'Handover complete. Verified by donor supervisor with recipient PIN.',
    }, donorHeaders);
    total++;
    assert(resCollected.status === 200 && resCollected.body.data.status === 'collected', 'Transitions status to collected');
    passed++;

    // Invalid transition: collected is terminal, cannot transition back to available
    const resInvalidTransition = await makeRequest('PATCH', `/api/listings/${createdId}/status`, {
      status: 'available',
    }, donorHeaders);
    total++;
    assert(
      resInvalidTransition.status === 400,
      'Blocks invalid transition from terminal collected state with HTTP 400'
    );
    passed++;

    console.log(`\n====================================================`);
    console.log(`📊 Listings API Tests Passed: ${passed}/${total}`);
    console.log(`====================================================\n`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

runListingsApiTests().catch((err) => {
  console.error('\n❌ Listings API Test Suite failed:', err);
  process.exit(1);
});
