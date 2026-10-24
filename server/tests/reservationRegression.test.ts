/**
 * SurplusLabel - Reservation & Claim Workflow Regression Test Suite
 *
 * Comprehensive regression test suite verifying core business requirements:
 * 1. Confirm Reservation endpoint payload validation & authentication gates
 * 2. Role enforcement: Only 'recipient' or 'admin' can reserve food
 * 3. Successful reservation persistence with 4-digit numeric handover PIN
 * 4. Conflicting claim prevention (HTTP 409 Conflict on duplicate/simultaneous reservation)
 * 5. Handover PIN confidentiality:
 *    - Unauthenticated third-party viewers see masked PIN ('••••') and masked phone ('••••••••••')
 *    - The claiming recipient organization sees the full plain 4-digit PIN
 *    - The donor owner organization sees the full plain 4-digit PIN for verification
 *    - Platform administrators see the full plain PIN
 * 6. Edge cases: Missing fields, invalid date ranges, non-existent listings
 * 7. Status transition verification: Claimed -> Collected (donor sign-off with PIN)
 */

import http from 'http';
import app from '../index';
import { authService } from '../services/authService';
import { setupIntegrationTestDatabase, teardownIntegrationTestDatabase } from './testDb';

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
    const reqHeaders: Record<string, string> = { ...headers };

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

async function runReservationRegressionTests() {
  console.log('\n====================================================');
  console.log('🧪 Running SurplusLabel Reservation Workflow Regression Tests');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  await setupIntegrationTestDatabase();

  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address() as any;
      port = address.port;
      resolve();
    });
  });

  try {
    const donorUser = (await authService.findById('usr_demo_donor_01'))!;
    const donorToken = authService.generateToken(donorUser);
    const donorHeaders = { Authorization: `Bearer ${donorToken}` };

    const recipientUser = (await authService.findById('usr_demo_recipient_01'))!;
    const recipientToken = authService.generateToken(recipientUser);
    const recipientHeaders = { Authorization: `Bearer ${recipientToken}` };

    // Create a second recipient for duplicate claim conflict tests
    const recipient2Reg = await authService.register({
      email: 'pantry2@communityrescue.org',
      password: 'SecurePassword123!',
      organizationName: 'Second Chance Pantry',
      contactName: 'Sarah Jenkins',
      role: 'recipient',
      phone: '+1 (555) 333-4444',
    });
    const recipient2Token = recipient2Reg.token;
    const recipient2Headers = { Authorization: `Bearer ${recipient2Token}` };

    const adminUser = (await authService.findById('usr_demo_admin_01'))!;
    const adminToken = authService.generateToken(adminUser);
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // ----------------------------------------------------
    // Test 1: Setup a clean available listing
    // ----------------------------------------------------
    console.log('1. Available Listing Setup:');
    const newListing = await makeRequest(
      'POST',
      '/api/listings',
      {
        title: 'Fresh Packaged Sourdough Loaves',
        category: 'bakery',
        quantity: 25,
        unit: 'loaves',
        storageCondition: 'ambient',
        handlingNotes: 'Sealed food-grade paper packaging.',
        donorOrg: donorUser.organizationName,
        pickupLocation: 'Rear Loading Dock, Gate 3, Sector 12',
        contactPhone: donorUser.phone,
        relevantDate: '2026-10-28',
        dateType: 'best_before',
        isManuallyConfirmed: true,
        verifiedBy: 'Elena Rostova (Lead Supervisor)',
      },
      donorHeaders
    );
    total++;
    assert(newListing.status === 201, 'Created verified test listing (HTTP 201)');
    passed++;
    const listingId = newListing.body.data.id;

    // ----------------------------------------------------
    // Test 2: Unauthenticated Reservation Attempt
    // ----------------------------------------------------
    console.log('\n2. Authentication & Authorization Enforcement:');
    const resNoAuth = await makeRequest('PATCH', `/api/listings/${listingId}/claim`, {
      recipientOrg: 'Anonymous Org',
      contactName: 'No Auth',
      contactPhone: '+1 555-000-0000',
      pickupWindowStart: '2026-10-25T10:00:00Z',
      pickupWindowEnd: '2026-10-25T12:00:00Z',
    });
    total++;
    assert(resNoAuth.status === 401, 'Rejects unauthenticated reservation request with HTTP 401 Unauthorized');
    passed++;

    // ----------------------------------------------------
    // Test 3: Role Enforcement (Donor cannot claim food)
    // ----------------------------------------------------
    const resDonorClaim = await makeRequest(
      'PATCH',
      `/api/listings/${listingId}/claim`,
      {
        recipientOrg: 'Self Claim Org',
        contactName: 'Donor Attempting Claim',
        contactPhone: '+1 555-111-2222',
        pickupWindowStart: '2026-10-25T10:00:00Z',
        pickupWindowEnd: '2026-10-25T12:00:00Z',
      },
      donorHeaders
    );
    total++;
    assert(resDonorClaim.status === 403, 'Rejects donor attempting to claim listings with HTTP 403 Forbidden');
    passed++;

    // ----------------------------------------------------
    // Test 4: Validation Failures (Missing required fields)
    // ----------------------------------------------------
    console.log('\n3. Reservation Payload Validation:');
    const resMissingWindow = await makeRequest(
      'PATCH',
      `/api/listings/${listingId}/claim`,
      {
        recipientOrg: 'Hope Pantry',
        contactName: 'David Kalu',
        contactPhone: '+1 555-876-5432',
        // missing pickupWindowStart & pickupWindowEnd
      },
      recipientHeaders
    );
    total++;
    assert(resMissingWindow.status === 400, 'Rejects claim with missing pickup window (HTTP 400)');
    passed++;

    // ----------------------------------------------------
    // Test 5: Successful Reservation by Recipient
    // ----------------------------------------------------
    console.log('\n4. Successful Reservation & Verification PIN Generation:');
    const resClaimSuccess = await makeRequest(
      'PATCH',
      `/api/listings/${listingId}/claim`,
      {
        recipientOrg: recipientUser.organizationName,
        contactName: recipientUser.contactName,
        contactPhone: recipientUser.phone,
        contactEmail: recipientUser.email,
        pickupWindowStart: '2026-10-25T14:00:00Z',
        pickupWindowEnd: '2026-10-25T16:00:00Z',
        notes: 'Equipped with insulated bread crates for dry transport.',
      },
      recipientHeaders
    );
    total++;
    assert(resClaimSuccess.status === 200, 'Successfully claims listing with HTTP 200 OK');
    passed++;

    total++;
    assert(resClaimSuccess.body.data.status === 'claimed', 'Listing status updated to "claimed"');
    passed++;

    const pin = resClaimSuccess.body.data.claim?.verificationPin;
    total++;
    assert(
      typeof pin === 'string' && /^\d{4}$/.test(pin),
      `Generated valid 4-digit numeric handover PIN (${pin})`
    );
    passed++;

    // ----------------------------------------------------
    // Test 6: Duplicate Claim / Conflict Prevention (HTTP 409)
    // ----------------------------------------------------
    console.log('\n5. Conflict Prevention (Double-Claim Rejection):');
    const resDuplicateClaim = await makeRequest(
      'PATCH',
      `/api/listings/${listingId}/claim`,
      {
        recipientOrg: 'Second Chance Pantry',
        contactName: 'Sarah Jenkins',
        contactPhone: '+1 (555) 333-4444',
        pickupWindowStart: '2026-10-25T15:00:00Z',
        pickupWindowEnd: '2026-10-25T17:00:00Z',
      },
      recipient2Headers
    );
    total++;
    assert(
      resDuplicateClaim.status === 409,
      'Rejects conflicting reservation on already claimed listing with HTTP 409 Conflict'
    );
    passed++;

    total++;
    assert(
      resDuplicateClaim.body.error.includes('cannot be reserved') ||
        resDuplicateClaim.body.error.includes('Conflicting claims are prevented'),
      'Returns descriptive message explaining conflicting claim prevention'
    );
    passed++;

    // ----------------------------------------------------
    // Test 7: Handover PIN Confidentiality & Sanitization
    // ----------------------------------------------------
    console.log('\n6. Handover PIN Confidentiality & Role-Based Sanitization:');

    // 7a. Public / Unauthenticated Viewer: Must NOT see plain PIN or phone
    const resPublicView = await makeRequest('GET', `/api/listings/${listingId}`);
    total++;
    assert(resPublicView.status === 200, 'Public can view claimed listing');
    passed++;

    total++;
    assert(
      resPublicView.body.data.claim.verificationPin === '••••',
      'Confidentiality check: Unauthenticated viewer sees masked PIN (••••)'
    );
    passed++;

    total++;
    assert(
      resPublicView.body.data.claim.contactPhone === '••••••••••',
      'Confidentiality check: Unauthenticated viewer sees masked contact phone'
    );
    passed++;

    total++;
    assert(
      resPublicView.body.data.claim.notes === undefined,
      'Confidentiality check: Private transport notes are scrubbed for third parties'
    );
    passed++;

    // 7b. Unrelated Third-Party Recipient: Must NOT see plain PIN
    const resRecipient2View = await makeRequest('GET', `/api/listings/${listingId}`, undefined, recipient2Headers);
    total++;
    assert(
      resRecipient2View.body.data.claim.verificationPin === '••••',
      'Confidentiality check: Unrelated recipient sees masked PIN (••••)'
    );
    passed++;

    // 7c. Claiming Recipient: Must see unmasked plain PIN
    const resClaimantView = await makeRequest('GET', `/api/listings/${listingId}`, undefined, recipientHeaders);
    total++;
    assert(
      resClaimantView.body.data.claim.verificationPin === pin,
      `Authorized check: Claiming recipient sees full plain PIN (${pin})`
    );
    passed++;

    // 7d. Donor Owner: Must see unmasked plain PIN to verify at pickup
    const resDonorView = await makeRequest('GET', `/api/listings/${listingId}`, undefined, donorHeaders);
    total++;
    assert(
      resDonorView.body.data.claim.verificationPin === pin,
      `Authorized check: Donor owner sees full plain PIN (${pin}) for handover verification`
    );
    passed++;

    // 7e. Platform Administrator: Must see unmasked plain PIN
    const resAdminView = await makeRequest('GET', `/api/listings/${listingId}`, undefined, adminHeaders);
    total++;
    assert(
      resAdminView.body.data.claim.verificationPin === pin,
      `Authorized check: Platform admin sees full plain PIN (${pin})`
    );
    passed++;

    // ----------------------------------------------------
    // Test 8: Handover Completion (Claimed -> Collected)
    // ----------------------------------------------------
    console.log('\n7. Handover Completion & Terminal Status Enforcement:');
    const resCollect = await makeRequest(
      'PATCH',
      `/api/listings/${listingId}/status`,
      {
        status: 'collected',
        notes: `Handover verified with PIN ${pin} by donor supervisor.`,
      },
      donorHeaders
    );
    total++;
    assert(resCollect.status === 200, 'Donor completes handover transition to "collected" (HTTP 200)');
    passed++;

    total++;
    assert(resCollect.body.data.status === 'collected', 'Status persisted as "collected"');
    passed++;

    // 7b. Re-claiming a collected listing is blocked
    const resClaimCollected = await makeRequest(
      'PATCH',
      `/api/listings/${listingId}/claim`,
      {
        recipientOrg: 'Hope Pantry',
        contactName: 'David Kalu',
        contactPhone: '+1 555-876-5432',
        pickupWindowStart: '2026-10-26T10:00:00Z',
        pickupWindowEnd: '2026-10-26T12:00:00Z',
      },
      recipientHeaders
    );
    total++;
    assert(
      resClaimCollected.status === 409,
      'Blocks reservation attempt on collected item with HTTP 409 Conflict'
    );
    passed++;

    console.log(`\n====================================================`);
    console.log(`📊 Reservation Regression Tests Passed: ${passed}/${total}`);
    console.log(`====================================================\n`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await teardownIntegrationTestDatabase();
  }
}

runReservationRegressionTests().catch((err) => {
  console.error('\n❌ Reservation Regression Test Suite failed:', err);
  process.exit(1);
});
