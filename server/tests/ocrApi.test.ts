/**
 * SurplusLabel - API Integration Tests for OCR & Upload Endpoints
 * Tests:
 * 1. Missing file in multipart form (400)
 * 2. Unsupported file MIME type (400)
 * 3. Disguised/spoofed non-image file with invalid magic bytes (400)
 * 4. Oversized upload exceeding 5MB limit (400)
 * 5. Live label image processing and candidate extraction (200)
 */

import { existsSync, writeFileSync, unlinkSync } from 'fs';
import path from 'path';

let passed = 0;
let total = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✓ ${testName}`);
  } else {
    console.error(`  ✕ FAILED: ${testName} ${detail ? `(${detail})` : ''}`);
    process.exitCode = 1;
  }
}

async function runApiTests() {
  console.log('====================================================');
  console.log('🧪 Running SurplusLabel OCR Endpoint Validation Tests');
  console.log('====================================================\n');

  const BASE_URL = process.env.API_URL || 'http://localhost:4000';

  // 1. Health check
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200 && healthJson.status === 'ok', 'Server health check responds 200 OK');
  } catch (err: any) {
    console.error('Cannot connect to server at', BASE_URL, err.message);
    process.exit(1);
  }

  // 2. Missing image field
  {
    const res = await fetch(`${BASE_URL}/api/ocr/food-label`, {
      method: 'POST',
      body: new FormData(),
    });
    const json = await res.json();
    assert(res.status === 400, 'Rejects request missing file with HTTP 400');
    assert(json.success === false && json.error.includes("No image file provided"), 'Returns clear error for missing file');
  }

  // 3. Unsupported MIME type
  {
    const form = new FormData();
    const fakeTextFile = new Blob(['name: surplus-label'], { type: 'text/plain' });
    form.append('image', fakeTextFile, 'notes.txt');

    const res = await fetch(`${BASE_URL}/api/ocr/food-label`, {
      method: 'POST',
      body: form,
    });
    const json = await res.json();
    assert(res.status === 400, 'Rejects text/plain MIME type with HTTP 400');
    assert(json.error.includes('Unsupported file type'), 'Returns unsupported file type message');
  }

  // 4. Spoofed magic bytes
  {
    const form = new FormData();
    // Claims to be image/jpeg but content is plain ASCII
    const spoofedFile = new Blob(['THIS IS NOT A VALID JPEG FILE HEADER'], { type: 'image/jpeg' });
    form.append('image', spoofedFile, 'spoofed.jpg');

    const res = await fetch(`${BASE_URL}/api/ocr/food-label`, {
      method: 'POST',
      body: form,
    });
    const json = await res.json();
    assert(res.status === 415 || res.status === 400, 'Rejects spoofed magic bytes with HTTP 415/400');
    assert(json.error.includes('File signature does not match'), 'Detects invalid file signature');
  }

  // 5. Oversized upload (> 5MB)
  {
    const form = new FormData();
    // 5.5 MB dummy JPEG header
    const oversizedBuffer = new Uint8Array(5.5 * 1024 * 1024);
    oversizedBuffer[0] = 0xff;
    oversizedBuffer[1] = 0xd8;
    oversizedBuffer[2] = 0xff;
    oversizedBuffer[3] = 0xe0;

    const oversizedBlob = new Blob([oversizedBuffer], { type: 'image/jpeg' });
    form.append('image', oversizedBlob, 'too-big.jpg');

    const res = await fetch(`${BASE_URL}/api/ocr/food-label`, {
      method: 'POST',
      body: form,
    });
    const json = await res.json();
    assert(res.status === 413 || res.status === 400, 'Rejects oversized file (> 5MB) with HTTP 413/400');
    assert(json.error.includes('exceeds maximum allowed limit'), 'Returns oversized file limit message');
  }

  // 6. Live OCR Recognition with Sample Image
  {
    const samplePath = path.resolve(process.cwd(), 'public/sample-food-label-crisp.jpg');
    if (existsSync(samplePath)) {
      const fs = await import('fs');
      const fileBytes = fs.readFileSync(samplePath);
      const form = new FormData();
      const blob = new Blob([fileBytes], { type: 'image/jpeg' });
      form.append('image', blob, 'sample-food-label-crisp.jpg');

      const res = await fetch(`${BASE_URL}/api/ocr/food-label`, {
        method: 'POST',
        body: form,
      });
      const json = await res.json();

      assert(res.status === 200, 'Live OCR returns HTTP 200 OK');
      assert(json.success === true, 'Response reports success: true');
      assert(Array.isArray(json.data.candidates), 'Response contains date candidates array');
      assert(json.data.candidates.length >= 2, 'Live OCR detected at least 2 date candidates on sample label');
      
      const hasExp = json.data.candidates.some((c: any) => c.dateType === 'expiry');
      const hasMfg = json.data.candidates.some((c: any) => c.dateType === 'manufacturing');
      assert(hasExp, 'Live OCR accurately detected expiry date candidate');
      assert(hasMfg, 'Live OCR accurately detected manufacturing date candidate');
    } else {
      console.warn('⚠️  Sample image not found, skipping live image step');
    }
  }

  console.log('\n====================================================');
  console.log(`📊 API Test Results: ${passed}/${total} tests passed.`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runApiTests();
