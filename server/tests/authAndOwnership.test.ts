import http from 'http';
import app from '../index';
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

async function runAuthAndOwnershipTests() {
  console.log('\n====================================================');
  console.log('🧪 Running SurplusLabel Authentication & Data Ownership Tests');
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
    // ==========================================
    // 1. REGISTRATION & VALIDATION TESTS
    // ==========================================
    console.log('1. Registration, Password Policies & Role Escalation Prevention:');

    // Missing email
    const resNoEmail = await makeRequest('POST', '/api/auth/register', {
      password: 'StrongPassword123!',
      organizationName: 'Test Org',
      contactName: 'Test User',
      role: 'donor',
    });
    total++;
    assert(resNoEmail.status === 400, 'Rejects registration with missing email (HTTP 400)');
    passed++;

    // Invalid email format
    const resBadEmail = await makeRequest('POST', '/api/auth/register', {
      email: 'not-an-email',
      password: 'StrongPassword123!',
      organizationName: 'Test Org',
      contactName: 'Test User',
      role: 'donor',
    });
    total++;
    assert(resBadEmail.status === 400, 'Rejects registration with invalid email format (HTTP 400)');
    passed++;

    // Weak password (< 8 chars)
    const resShortPass = await makeRequest('POST', '/api/auth/register', {
      email: 'shortpass@example.com',
      password: 'pass1',
      organizationName: 'Test Org',
      contactName: 'Test User',
      role: 'donor',
    });
    total++;
    assert(resShortPass.status === 400, 'Rejects short password (< 8 chars) with HTTP 400');
    passed++;

    // Weak password (no number)
    const resNoNumPass = await makeRequest('POST', '/api/auth/register', {
      email: 'nonum@example.com',
      password: 'allletterspassword',
      organizationName: 'Test Org',
      contactName: 'Test User',
      role: 'donor',
    });
    total++;
    assert(resNoNumPass.status === 400, 'Rejects password without digits with HTTP 400');
    passed++;

    // CRITICAL SECURITY REQUIREMENT: Role escalation prevention
    // Public registration must NEVER allow creating an admin account!
    const resAdminEscalate = await makeRequest('POST', '/api/auth/register', {
      email: 'hacker@example.com',
      password: 'AdminPassword123!',
      organizationName: 'Exploit Org',
      contactName: 'Hacker',
      role: 'admin',
    });
    total++;
    assert(
      resAdminEscalate.status === 403,
      'Blocks unauthorized admin role escalation on public registration (HTTP 403 Forbidden)'
    );
    passed++;

    // Successful Donor Registration with uppercase email (checks normalization)
    const resRegDonor = await makeRequest('POST', '/api/auth/register', {
      email: '  NEW_DONOR@FreshFarms.Org  ',
      password: 'SecurePassword123!',
      organizationName: 'Fresh Valley Farms',
      contactName: 'Sarah Jenkins',
      phone: '+1 555-4321',
      role: 'donor',
    });
    total++;
    assert(resRegDonor.status === 201, 'Successfully registers new donor with HTTP 201 Created');
    passed++;

    total++;
    assert(
      resRegDonor.body.data.user.email === 'new_donor@freshfarms.org',
      'Normalizes email to lowercase and trims whitespace'
    );
    passed++;

    total++;
    assert(
      resRegDonor.body.data.user.passwordHash === undefined,
      'Never returns or exposes password hash to client'
    );
    passed++;

    // Duplicate Email Prevention
    const resDuplicateEmail = await makeRequest('POST', '/api/auth/register', {
      email: 'new_donor@freshfarms.org',
      password: 'AnotherPassword123!',
      organizationName: 'Duplicate Org',
      contactName: 'Someone Else',
      role: 'donor',
    });
    total++;
    assert(
      resDuplicateEmail.status === 409,
      'Rejects duplicate email registration with HTTP 409 Conflict'
    );
    passed++;

    // Successful Recipient Registration
    const resRegRecipient = await makeRequest('POST', '/api/auth/register', {
      email: 'recipient@soupkitchen.org',
      password: 'RescuePassword123!',
      organizationName: 'Downtown Soup Kitchen',
      contactName: 'Michael Brown',
      phone: '+1 555-7890',
      role: 'recipient',
    });
    total++;
    assert(resRegRecipient.status === 201, 'Successfully registers new recipient with HTTP 201 Created');
    passed++;

    // ==========================================
    // 2. LOGIN, SESSION & RATE LIMITING
    // ==========================================
    console.log('\n2. Authentication, Cookies, Sessions & Rate Limiting:');

    // Invalid email login
    const resUnknownUser = await makeRequest('POST', '/api/auth/login', {
      email: 'nonexistent@example.com',
      password: 'DemoPass123!',
    });
    total++;
    assert(resUnknownUser.status === 401, 'Rejects unknown user with HTTP 401 Unauthorized');
    passed++;

    // Incorrect password login
    const resWrongPass = await makeRequest('POST', '/api/auth/login', {
      email: 'donor@greenmarket.org',
      password: 'WrongPassword999!',
    });
    total++;
    assert(resWrongPass.status === 401, 'Rejects incorrect password with HTTP 401 Unauthorized');
    passed++;

    // Successful login for Seed Donor
    const resLoginDonor = await makeRequest('POST', '/api/auth/login', {
      email: 'donor@greenmarket.org',
      password: 'DemoPass123!',
    });
    total++;
    assert(resLoginDonor.status === 200, 'Successful login returns HTTP 200 OK');
    passed++;

    total++;
    assert(
      typeof resLoginDonor.body.data.token === 'string' && resLoginDonor.body.data.token.length > 20,
      'Returns valid JWT authorization token'
    );
    passed++;

    // Check Set-Cookie header for HttpOnly, SameSite
    const setCookie = resLoginDonor.headers['set-cookie'];
    total++;
    const cookieString = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie || '';
    assert(
      cookieString.includes('sl_auth_token') &&
      cookieString.toLowerCase().includes('httponly') &&
      cookieString.toLowerCase().includes('samesite=lax'),
      'Sets HttpOnly session cookie with SameSite protection'
    );
    passed++;

    const donorToken = resLoginDonor.body.data.token;
    const donorHeaders = { Authorization: `Bearer ${donorToken}` };

    // Login for Seed Recipient
    const resLoginRecipient = await makeRequest('POST', '/api/auth/login', {
      email: 'rescue@foodpantry.org',
      password: 'DemoPass123!',
    });
    const recipientToken = resLoginRecipient.body.data.token;
    const recipientHeaders = { Authorization: `Bearer ${recipientToken}` };

    // Login for Seed Admin
    const resLoginAdmin = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@surpluslabel.org',
      password: 'DemoPass123!',
    });
    const adminToken = resLoginAdmin.body.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // Test GET /api/auth/me (Unauthenticated vs Authenticated)
    const resMeUnauth = await makeRequest('GET', '/api/auth/me');
    total++;
    assert(resMeUnauth.status === 401, 'GET /api/auth/me rejects unauthenticated request with HTTP 401');
    passed++;

    const resMeAuth = await makeRequest('GET', '/api/auth/me', undefined, donorHeaders);
    total++;
    assert(
      resMeAuth.status === 200 && resMeAuth.body.data.user.email === 'donor@greenmarket.org',
      'GET /api/auth/me returns current user identity with valid Bearer token'
    );
    passed++;

    // Test Rate Limiter (simulate 5 failed attempts)
    console.log('Testing authentication rate limiter:');
    const attackTarget = 'ratelimit_test@example.com';
    for (let i = 0; i < 5; i++) {
      await makeRequest('POST', '/api/auth/login', {
        email: attackTarget,
        password: 'BadPassword!',
      });
    }
    const resRateLimited = await makeRequest('POST', '/api/auth/login', {
      email: attackTarget,
      password: 'BadPassword!',
    });
    total++;
    assert(
      resRateLimited.status === 429,
      'Enforces rate limit (HTTP 429 Too Many Requests) after repeated failed attempts'
    );
    passed++;

    // ==========================================
    // 3. ROLE-BASED ACCESS CONTROL (RBAC)
    // ==========================================
    console.log('\n3. Role-Based Access Control (RBAC):');

    // Unauthenticated user attempting to create listing
    const listingPayload = {
      title: 'Surplus Fresh Strawberries 500g',
      category: 'produce',
      quantity: 20,
      unit: 'punnets',
      storageCondition: 'chilled',
      donorOrg: 'GreenMarket Community Co-op',
      pickupLocation: 'Loading Dock A',
      relevantDate: '2026-10-31',
      dateType: 'use_by',
      isManuallyConfirmed: true,
      verifiedBy: 'Elena Rostova',
    };

    const resCreateUnauth = await makeRequest('POST', '/api/listings', listingPayload);
    total++;
    assert(
      resCreateUnauth.status === 401,
      'Rejects listing creation from unauthenticated user with HTTP 401 Unauthorized'
    );
    passed++;

    // Recipient attempting to create listing (Forbidden)
    const resCreateRecipient = await makeRequest('POST', '/api/listings', listingPayload, recipientHeaders);
    total++;
    assert(
      resCreateRecipient.status === 403,
      'Rejects recipient attempting to create food listing with HTTP 403 Forbidden'
    );
    passed++;

    // Donor creates listing (Authorized)
    const resCreateDonor = await makeRequest('POST', '/api/listings', listingPayload, donorHeaders);
    total++;
    assert(resCreateDonor.status === 201, 'Donor successfully creates food listing with HTTP 201 Created');
    passed++;

    const newListingId = resCreateDonor.body.data.id;
    total++;
    assert(
      resCreateDonor.body.data.donorUserId === 'usr_demo_donor_01',
      'Automatically associates listing with authenticated donor user ID'
    );
    passed++;

    // Donor attempting to claim listing (Forbidden)
    const claimPayload = {
      recipientOrg: 'Hope Community Food Pantry',
      contactName: 'David Kalu',
      contactPhone: '+1 555-876-5432',
      pickupWindowStart: '2026-10-25T10:00:00Z',
      pickupWindowEnd: '2026-10-25T12:00:00Z',
      notes: 'Temperature-monitored refrigerated transport',
    };

    const resClaimDonor = await makeRequest(
      'PATCH',
      `/api/listings/${newListingId}/claim`,
      claimPayload,
      donorHeaders
    );
    total++;
    assert(
      resClaimDonor.status === 403,
      'Rejects donor attempting to claim food listing with HTTP 403 Forbidden'
    );
    passed++;

    // Recipient claims listing (Authorized)
    const resClaimRecipient = await makeRequest(
      'PATCH',
      `/api/listings/${newListingId}/claim`,
      claimPayload,
      recipientHeaders
    );
    total++;
    assert(resClaimRecipient.status === 200, 'Recipient successfully claims food listing with HTTP 200 OK');
    passed++;

    const generatedPin = resClaimRecipient.body.data.claim.verificationPin;
    total++;
    assert(
      typeof generatedPin === 'string' && generatedPin.length === 4,
      'Generates secure 4-digit verification handover PIN'
    );
    passed++;

    // ==========================================
    // 4. SENSITIVE DATA REDACTION & SCRUBBING
    // ==========================================
    console.log('\n4. Sensitive Data Masking & PIN Confidentiality:');

    // Third-party unauthenticated GET /api/listings/:id
    const resGetUnauth = await makeRequest('GET', `/api/listings/${newListingId}`);
    total++;
    assert(resGetUnauth.status === 200, 'Unauthenticated user can view listing');
    passed++;

    total++;
    assert(
      resGetUnauth.body.data.claim.verificationPin === '••••',
      'Masks verification handover PIN (••••) for unauthenticated viewers'
    );
    passed++;

    total++;
    assert(
      resGetUnauth.body.data.claim.contactPhone === '••••••••••',
      'Masks recipient contact phone number for unauthenticated viewers'
    );
    passed++;

    // Claiming recipient viewing their own claimed listing (Authorized to view PIN)
    const resGetClaimant = await makeRequest(
      'GET',
      `/api/listings/${newListingId}`,
      undefined,
      recipientHeaders
    );
    total++;
    assert(
      resGetClaimant.body.data.claim.verificationPin === generatedPin,
      'Reveals unmasked verification PIN to the authenticated claiming recipient'
    );
    passed++;

    // Donor owner viewing their claimed listing (Authorized to view PIN)
    const resGetDonor = await makeRequest(
      'GET',
      `/api/listings/${newListingId}`,
      undefined,
      donorHeaders
    );
    total++;
    assert(
      resGetDonor.body.data.claim.verificationPin === generatedPin,
      'Reveals unmasked verification PIN to the listing donor organization'
    );
    passed++;

    // Admin viewing claimed listing (Authorized to view PIN)
    const resGetAdmin = await makeRequest(
      'GET',
      `/api/listings/${newListingId}`,
      undefined,
      adminHeaders
    );
    total++;
    assert(
      resGetAdmin.body.data.claim.verificationPin === generatedPin,
      'Reveals unmasked verification PIN to platform administrator'
    );
    passed++;

    // ==========================================
    // 5. CROSS-ORGANIZATION DATA OWNERSHIP
    // ==========================================
    console.log('\n5. Cross-Organization Modification Protection:');

    // Register a second donor (Donor B)
    const resDonorBLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'new_donor@freshfarms.org',
      password: 'SecurePassword123!',
    });
    const donorBHeaders = { Authorization: `Bearer ${resDonorBLogin.body.data.token}` };

    // Donor B attempts to cancel or update Donor A's listing
    const resDonorBCancel = await makeRequest(
      'PATCH',
      `/api/listings/${newListingId}/status`,
      { status: 'cancelled' },
      donorBHeaders
    );
    total++;
    assert(
      resDonorBCancel.status === 403,
      'Prevents Donor B from cancelling or altering Donor A\'s listing (HTTP 403 Forbidden)'
    );
    passed++;

    // Recipient attempts to mark listing as collected (Only donor or admin can confirm collection)
    const resRecipientCollect = await makeRequest(
      'PATCH',
      `/api/listings/${newListingId}/status`,
      { status: 'collected' },
      recipientHeaders
    );
    total++;
    assert(
      resRecipientCollect.status === 403,
      'Prevents recipient from marking listing collected without donor handover (HTTP 403 Forbidden)'
    );
    passed++;

    // Donor A updates their own listing to 'collected'
    const resDonorACollect = await makeRequest(
      'PATCH',
      `/api/listings/${newListingId}/status`,
      { status: 'collected', notes: 'Verified PIN with recipient driver' },
      donorHeaders
    );
    total++;
    assert(
      resDonorACollect.status === 200 && resDonorACollect.body.data.status === 'collected',
      'Donor A successfully marks their own listing as collected with HTTP 200 OK'
    );
    passed++;

    // Admin can update status of any listing
    // Create another listing with Donor A
    const resListing2 = await makeRequest('POST', '/api/listings', {
      title: 'Surplus Milk Cartons 1L',
      category: 'dairy',
      quantity: 10,
      unit: 'cartons',
      storageCondition: 'chilled',
      donorOrg: 'GreenMarket Community Co-op',
      pickupLocation: 'Loading Bay 2',
      relevantDate: '2026-11-05',
      dateType: 'expiry',
      isManuallyConfirmed: true,
      verifiedBy: 'Elena Rostova',
    }, donorHeaders);

    const listing2Id = resListing2.body.data.id;
    const resAdminCancel = await makeRequest(
      'PATCH',
      `/api/listings/${listing2Id}/status`,
      { status: 'cancelled', notes: 'Administrative compliance cancellation' },
      adminHeaders
    );
    total++;
    assert(
      resAdminCancel.status === 200 && resAdminCancel.body.data.status === 'cancelled',
      'Administrator can perform authorized actions on any listing with HTTP 200 OK'
    );
    passed++;

    console.log(`\n====================================================`);
    console.log(`📊 Auth & Ownership Tests Passed: ${passed}/${total}`);
    console.log(`====================================================\n`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await teardownIntegrationTestDatabase();
  }
}

runAuthAndOwnershipTests().catch((err) => {
  console.error('\n❌ Auth & Ownership Test Suite failed:', err);
  process.exit(1);
});
