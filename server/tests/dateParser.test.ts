/**
 * SurplusLabel - Unit Test Suite for OCR Date Parser and Urgency Engine
 * Validates edge cases: leap years, impossible dates, ambiguous numeric formats,
 * manufacturing vs expiry keyword prioritization, urgency band boundaries,
 * and timezone-safe date-only calculations.
 */

import {
  extractDateCandidates,
  calculateUrgency,
  isValidCalendarDate,
  isLeapYear,
  getDaysInMonth,
  getLocalCalendarDiff,
} from '../services/dateParser';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${testName}`);
  } else {
    console.error(`  ✕ FAILED: ${testName} ${details ? `(${details})` : ''}`);
    process.exitCode = 1;
  }
}

console.log('====================================================');
console.log('🧪 Running SurplusLabel Date & Urgency Logic Tests');
console.log('====================================================\n');

// ----------------------------------------------------------------------------
// 1. Calendar Validation Tests
// ----------------------------------------------------------------------------
console.log('1. Strict Calendar Validation Tests:');
assert(isValidCalendarDate(2026, 10, 25), 'Standard date 2026-10-25 is valid');
assert(!isValidCalendarDate(2026, 2, 30), 'Feb 30th is rejected as impossible');
assert(!isValidCalendarDate(2026, 4, 31), 'April 31st is rejected as impossible');
assert(!isValidCalendarDate(2026, 13, 1), 'Month 13 is rejected as impossible');
assert(!isValidCalendarDate(2026, 0, 15), 'Month 0 is rejected as impossible');
assert(!isValidCalendarDate(2026, 10, 32), 'Day 32 is rejected as impossible');

// Leap Year Tests
assert(isLeapYear(2024), '2024 is recognized as leap year');
assert(!isLeapYear(2025), '2025 is not a leap year');
assert(!isLeapYear(2026), '2026 is not a leap year');
assert(isValidCalendarDate(2024, 2, 29), 'Feb 29 on leap year 2024 is valid');
assert(!isValidCalendarDate(2025, 2, 29), 'Feb 29 on non-leap year 2025 is rejected');
assert(!isValidCalendarDate(2026, 2, 29), 'Feb 29 on non-leap year 2026 is rejected');

// ----------------------------------------------------------------------------
// 2. Format Extraction Tests
// ----------------------------------------------------------------------------
console.log('\n2. Supported Date Format Extraction Tests:');

// Format: Textual Month (DD MON YYYY)
const textMonthOcr = 'Yippee Noodles BEST BEFORE: 28 NOV 2026 BATCH #A49';
const cands1 = extractDateCandidates(textMonthOcr, 95);
assert(cands1.length === 1, 'Extracted exactly 1 candidate from text month');
assert(cands1[0]?.normalizedDate === '2026-11-28', 'Normalized 28 NOV 2026 to 2026-11-28');
assert(cands1[0]?.dateType === 'best_before', 'Classified 28 NOV 2026 as best_before');

// Format: Standard ISO YYYY-MM-DD
const isoOcr = 'MILK PACKET EXP: 2026-10-25 LOT 44';
const cands2 = extractDateCandidates(isoOcr, 90);
assert(cands2.length === 1, 'Extracted ISO date candidate');
assert(cands2[0]?.normalizedDate === '2026-10-25', 'Parsed 2026-10-25 correctly');
assert(cands2[0]?.dateType === 'expiry', 'Classified as expiry date');

// Format: Standard Slash DD/MM/YYYY
const slashOcr = 'BREAD LOAF USE BY: 24/10/2026';
const cands3 = extractDateCandidates(slashOcr, 92);
assert(cands3.length === 1, 'Extracted DD/MM/YYYY slash date');
assert(cands3[0]?.normalizedDate === '2026-10-24', 'Parsed 24/10/2026 to 2026-10-24');
assert(cands3[0]?.dateType === 'use_by', 'Classified as use_by date');

// Format: Dot notation DD.MM.YYYY
const dotOcr = 'COOKIE TIN EXP. 15.12.2026';
const cands4 = extractDateCandidates(dotOcr, 88);
assert(cands4.length === 1, 'Extracted DD.MM.YYYY dot date');
assert(cands4[0]?.normalizedDate === '2026-12-15', 'Parsed 15.12.2026 to 2026-12-15');

// Format: Month-Only date (e.g. "OCT 2026")
const monthOnlyOcr = 'CEREAL BOX BEST BEFORE: OCT 2026';
const cands5 = extractDateCandidates(monthOnlyOcr, 85);
assert(cands5.length === 1, 'Extracted month-only date');
assert(cands5[0]?.normalizedDate === '2026-10-31', 'Month-only normalized to end of month 2026-10-31');
assert(Boolean(cands5[0]?.ambiguityWarning), 'Month-only generates an ambiguity advisory warning');

// ----------------------------------------------------------------------------
// 3. Ambiguity & Multi-Candidate Tests
// ----------------------------------------------------------------------------
console.log('\n3. Ambiguity & Multi-Candidate Detection Tests:');

// Ambiguous numeric format: 04/05/2026 (both day & month <= 12)
const ambigOcr = 'SNACK PACK EXP: 04/05/2026';
const candsAmbig = extractDateCandidates(ambigOcr, 80);
assert(candsAmbig.length === 1, 'Extracted ambiguous candidate');
assert(Boolean(candsAmbig[0]?.ambiguityWarning), 'Ambiguous 04/05 flagged for user manual confirmation');

// Multi-Candidate on same label: Manufacturing AND Expiry on separate lines
const multiOcr = `
ABC FOOD PRODUCTS
MFD: 10/01/2026
EXP DATE: 10/11/2026
BATCH: B-9912
`;
const candsMulti = extractDateCandidates(multiOcr, 92);
assert(candsMulti.length === 2, 'Detected both MFD and EXP candidates from single label');
const mfgCand = candsMulti.find((c) => c.dateType === 'manufacturing');
const expCand = candsMulti.find((c) => c.dateType === 'expiry');
assert(Boolean(mfgCand), 'Correctly classified MFD date as manufacturing');
assert(Boolean(expCand), 'Correctly classified EXP date as expiry');
assert(mfgCand?.normalizedDate !== expCand?.normalizedDate, 'Preserved distinct dates for MFD and EXP');

// Empty or Garbage Text
const emptyOcr = extractDateCandidates('NO DATES PRINTED ON THIS WRAPPER BARCODE ONLY');
assert(emptyOcr.length === 0, 'No dates fabricated when text contains zero date patterns');

// ----------------------------------------------------------------------------
// 4. Urgency Prioritization Band Tests
// ----------------------------------------------------------------------------
console.log('\n4. Operational Urgency Prioritization Tests:');

// Reference fixed date: 2026-10-23
const referenceDate = new Date(2026, 9, 23, 12, 0, 0); // Oct 23, 2026

// Past Expiry (e.g. 2026-10-20, 3 days ago)
const urgPast = calculateUrgency('2026-10-20', 'expiry', referenceDate);
assert(urgPast.band === 'past', 'Past date categorized in "past" band');
assert(urgPast.badgeVariant === 'danger', 'Past expiry triggers danger badge');
assert(urgPast.daysRemaining === -3, 'Correctly computed -3 days remaining');

// Past Best-Before (e.g. 2026-10-21, 2 days ago)
const urgPastBB = calculateUrgency('2026-10-21', 'best_before', referenceDate);
assert(urgPastBB.band === 'past_best_before', 'Past best-before categorized as past_best_before');
assert(urgPastBB.badgeVariant === 'warning', 'Past best-before uses warning badge rather than emergency danger');

// Critical: Expires Today (2026-10-23)
const urgToday = calculateUrgency('2026-10-23', 'expiry', referenceDate);
assert(urgToday.band === 'critical', 'Date today is categorized as "critical"');
assert(urgToday.daysRemaining === 0, 'Days remaining for today is 0');

// Critical: Expires Tomorrow (2026-10-24)
const urgTomorrow = calculateUrgency('2026-10-24', 'expiry', referenceDate);
assert(urgTomorrow.band === 'critical', 'Date tomorrow is categorized as "critical"');
assert(urgTomorrow.daysRemaining === 1, 'Days remaining for tomorrow is 1');

// Urgent: Due in 2–3 Days (2026-10-25 -> 2 days)
const urg2d = calculateUrgency('2026-10-25', 'expiry', referenceDate);
assert(urg2d.band === 'urgent', 'Due in 2 days categorized as "urgent"');
assert(urg2d.daysRemaining === 2, 'Days remaining is 2');

// Soon: Due in 4–7 Days (2026-10-28 -> 5 days)
const urg5d = calculateUrgency('2026-10-28', 'expiry', referenceDate);
assert(urg5d.band === 'soon', 'Due in 5 days categorized as "soon"');
assert(urg5d.daysRemaining === 5, 'Days remaining is 5');

// Normal: More than 7 Days Away (2026-11-20 -> 28 days)
const urg28d = calculateUrgency('2026-11-20', 'expiry', referenceDate);
assert(urg28d.band === 'normal', 'Due in 28 days categorized as "normal"');
assert(urg28d.daysRemaining === 28, 'Days remaining is 28');
assert(urg28d.badgeVariant === 'success', 'Normal urgency uses success badge');

// Strict Rule: Manufacturing Date must NEVER drive expiry urgency
const urgMfg = calculateUrgency('2026-10-24', 'manufacturing', referenceDate);
assert(urgMfg.band === 'non_expiry', 'Manufacturing date cannot drive expiry urgency (band: non_expiry)');
assert(!urgMfg.canDriveUrgency, 'canDriveUrgency flag is false for manufacturing dates');

// Additional Format: Hyphen separated DD-MM-YYYY
const hyphenOcr = 'CEREAL BOX PKD: 14-05-2026';
const candsHyphen = extractDateCandidates(hyphenOcr, 91);
assert(candsHyphen.length === 1, 'Extracted DD-MM-YYYY hyphen date');
assert(candsHyphen[0]?.normalizedDate === '2026-05-14', 'Parsed 14-05-2026 to 2026-05-14');
assert(candsHyphen[0]?.dateType === 'packaging', 'Classified PKD date as packaging');

// Additional Classification: Packed On
const packedOnOcr = 'FRESH FRUIT PACKED ON: 02/09/2026';
const candsPacked = extractDateCandidates(packedOnOcr, 89);
assert(candsPacked.length === 1, 'Extracted PACKED ON candidate');
assert(candsPacked[0]?.dateType === 'packaging', 'Classified PACKED ON as packaging');

// Strict Rule: Packing Date must NEVER drive expiry urgency
const urgPkd = calculateUrgency('2026-09-02', 'packaging', referenceDate);
assert(urgPkd.band === 'non_expiry', 'Packing date cannot drive expiry urgency (band: non_expiry)');
assert(!urgPkd.canDriveUrgency, 'canDriveUrgency is false for packing dates');

// Empty date handling in urgency calculation
const urgEmpty = calculateUrgency('', 'expiry', referenceDate);
assert(urgEmpty.band === 'non_expiry', 'Empty date string safely handled as non_expiry');
assert(!urgEmpty.canDriveUrgency, 'canDriveUrgency is false for empty date string');

// Strict Calendar Validation: 30-day month boundaries
assert(!isValidCalendarDate(2026, 6, 31), 'June 31 is rejected as impossible');
assert(!isValidCalendarDate(2026, 9, 31), 'September 31 is rejected as impossible');
assert(!isValidCalendarDate(2026, 11, 31), 'November 31 is rejected as impossible');

// ----------------------------------------------------------------------------
// 5. Timezone Safety Tests
// ----------------------------------------------------------------------------
console.log('\n5. Timezone Safety Tests:');
// Simulate client at 23:59 local vs 00:01 local
const lateNight = new Date(2026, 9, 23, 23, 59, 59);
const earlyMorning = new Date(2026, 9, 23, 0, 1, 0);
const diffLate = getLocalCalendarDiff('2026-10-24', lateNight);
const diffEarly = getLocalCalendarDiff('2026-10-24', earlyMorning);
assert(diffLate === 1, 'Calendar diff at 23:59:59 correctly calculates exactly 1 calendar day');
assert(diffEarly === 1, 'Calendar diff at 00:01:00 correctly calculates exactly 1 calendar day');

// Multi-timezone simulation: UTC-8 vs UTC+8 at midday local
const midday = new Date(2026, 9, 23, 12, 0, 0);
const diffMidday = getLocalCalendarDiff('2026-10-25', midday);
assert(diffMidday === 2, 'Calendar diff at 12:00:00 calculates exactly 2 calendar days without UTC shift');

console.log('\n====================================================');
console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed.`);
console.log('====================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
