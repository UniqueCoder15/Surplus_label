/**
 * SurplusLabel - OCR Date Parser & Urgency Prioritization Engine (Client utilities)
 * Handles date detection, classification, strict calendar validation,
 * ambiguity detection, and timezone-safe urgency categorization.
 */

export type DateType =
  | 'expiry'
  | 'use_by'
  | 'best_before'
  | 'manufacturing'
  | 'packaging'
  | 'unknown';

export type UrgencyBand =
  | 'past'
  | 'past_best_before'
  | 'critical'
  | 'urgent'
  | 'soon'
  | 'normal'
  | 'non_expiry';

export interface DateCandidate {
  id: string;
  rawSnippet: string;
  normalizedDate: string; // ISO format "YYYY-MM-DD"
  displayDate: string; // e.g. "28 Nov 2026"
  dateType: DateType;
  confidence: number; // 0-100 score
  requiresManualConfirmation: boolean;
  ambiguityWarning: string | null;
  contextKeywords: string[];
}

export interface UrgencyResult {
  band: UrgencyBand;
  statusLabel: string;
  daysRemaining: number | null;
  badgeVariant: 'danger' | 'warning' | 'success' | 'info' | 'neutral';
  iconName: 'AlertTriangle' | 'Clock' | 'CheckCircle2' | 'ShieldAlert' | 'HelpCircle' | 'PackageCheck';
  message: string;
  disclaimer: string;
  canDriveUrgency: boolean;
}

// Month name map (English full & 3-letter abbreviations)
const MONTH_NAMES: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

const MONTH_SHORT_NAMES = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getDaysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) return 0;
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(month)) {
    return 30;
  }
  return 31;
}

export function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
  if (year < 2020 || year > 2040) return false;
  if (month < 1 || month > 12) return false;
  const maxDays = getDaysInMonth(year, month);
  return day >= 1 && day <= maxDays;
}

export function normalizeTwoDigitYear(yy: number): number {
  if (yy >= 0 && yy <= 99) {
    return 2000 + yy;
  }
  return yy;
}

export function classifyDateType(contextText: string): {
  type: DateType;
  keywords: string[];
} {
  const upper = contextText.toUpperCase();
  const keywordsFound: string[] = [];

  if (
    upper.includes('MFG') ||
    upper.includes('MFD') ||
    upper.includes('MANUFACTURED') ||
    upper.includes('PROD DATE') ||
    upper.includes('MFD.') ||
    upper.includes('MFG.') ||
    upper.includes('MFD:') ||
    upper.includes('MFG:')
  ) {
    keywordsFound.push('MFG');
  }

  if (
    upper.includes('PACKED') ||
    upper.includes('PKD') ||
    upper.includes('PACK DATE') ||
    upper.includes('PKD.') ||
    upper.includes('PKD:') ||
    upper.includes('PACKING')
  ) {
    keywordsFound.push('PKD');
  }

  if (
    upper.includes('USE BY') ||
    upper.includes('USE BEFORE') ||
    upper.includes('CONSUME BY') ||
    upper.includes('CONSUME BEFORE') ||
    upper.includes('USE-BY')
  ) {
    keywordsFound.push('USE BY');
  }

  if (
    upper.includes('BEST BEFORE') ||
    upper.includes('BEST BY') ||
    upper.includes('BBE') ||
    upper.includes('BEST BEFORE:') ||
    upper.includes('B.B.') ||
    upper.includes('BB:') ||
    /\bBB\b/.test(upper)
  ) {
    keywordsFound.push('BEST BEFORE');
  }

  if (
    upper.includes('EXPIRY') ||
    upper.includes('EXP DATE') ||
    upper.includes('EXPIRES') ||
    upper.includes('EXP.') ||
    upper.includes('EXP ') ||
    upper.endsWith('EXP') ||
    upper.includes('EXP:') ||
    upper.includes('EXP-')
  ) {
    keywordsFound.push('EXP');
  }

  if (keywordsFound.includes('MFG') && !keywordsFound.includes('EXP') && !keywordsFound.includes('BEST BEFORE') && !keywordsFound.includes('USE BY')) {
    return { type: 'manufacturing', keywords: keywordsFound };
  }
  if (keywordsFound.includes('PKD') && !keywordsFound.includes('EXP') && !keywordsFound.includes('BEST BEFORE') && !keywordsFound.includes('USE BY')) {
    return { type: 'packaging', keywords: keywordsFound };
  }
  if (keywordsFound.includes('USE BY')) {
    return { type: 'use_by', keywords: keywordsFound };
  }
  if (keywordsFound.includes('BEST BEFORE')) {
    return { type: 'best_before', keywords: keywordsFound };
  }
  if (keywordsFound.includes('EXP')) {
    return { type: 'expiry', keywords: keywordsFound };
  }
  if (keywordsFound.includes('MFG')) {
    return { type: 'manufacturing', keywords: keywordsFound };
  }
  if (keywordsFound.includes('PKD')) {
    return { type: 'packaging', keywords: keywordsFound };
  }

  return { type: 'unknown', keywords: [] };
}

export function formatIsoDate(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function formatDisplayDate(
  yearOrStr: number | string,
  month?: number,
  day?: number
): string {
  if (typeof yearOrStr === 'string') {
    const parts = yearOrStr.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      const monName = MONTH_SHORT_NAMES[parts[1]] || String(parts[1]);
      return `${parts[2]} ${monName} ${parts[0]}`;
    }
    return yearOrStr;
  }
  const monName = (month !== undefined && MONTH_SHORT_NAMES[month]) || String(month);
  return `${day} ${monName} ${yearOrStr}`;
}

export function getLocalCalendarDiff(targetYmd: string, baseDate = new Date()): number {
  const [tY, tM, tD] = targetYmd.split('-').map(Number);
  if (!tY || !tM || !tD) return 0;

  const targetUtc = Date.UTC(tY, tM - 1, tD);
  const currentUtc = Date.UTC(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate()
  );
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((targetUtc - currentUtc) / MS_PER_DAY);
}

export function extractDateCandidates(
  rawOcrText: string,
  ocrConfidence = 80
): DateCandidate[] {
  if (!rawOcrText || typeof rawOcrText !== 'string') {
    return [];
  }

  const candidates: DateCandidate[] = [];
  const seenDates = new Set<string>();
  const lines = rawOcrText.split(/\r?\n/);

  const getContextWindow = (lineIndex: number): string => {
    const currentLine = lines[lineIndex] || '';
    const currentClassification = classifyDateType(currentLine);
    if (currentClassification.keywords.length > 0) {
      return currentLine;
    }
    if (lineIndex > 0) {
      const prevClassification = classifyDateType(lines[lineIndex - 1]);
      if (prevClassification.keywords.length > 0) {
        return `${lines[lineIndex - 1]} ${currentLine}`;
      }
    }
    if (lineIndex < lines.length - 1) {
      const nextClassification = classifyDateType(lines[lineIndex + 1]);
      if (nextClassification.keywords.length > 0) {
        return `${currentLine} ${lines[lineIndex + 1]}`;
      }
    }
    return currentLine;
  };

  lines.forEach((line, lineIdx) => {
    // Pattern 1: Day + Month Name + Year
    const textMonthRegex1 =
      /\b([0-3]?[0-9])[\s\-./]+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*[\s\-./]+(20\d{2}|\d{2})\b/gi;
    let match: RegExpExecArray | null;

    while ((match = textMonthRegex1.exec(line)) !== null) {
      const day = parseInt(match[1], 10);
      const monStr = match[2].toLowerCase();
      const month = MONTH_NAMES[monStr] || 0;
      let rawYear = parseInt(match[3], 10);
      const year = rawYear < 100 ? normalizeTwoDigitYear(rawYear) : rawYear;

      if (isValidCalendarDate(year, month, day)) {
        const iso = formatIsoDate(year, month, day);
        if (!seenDates.has(iso)) {
          seenDates.add(iso);
          const context = getContextWindow(lineIdx);
          const { type, keywords } = classifyDateType(context);

          candidates.push({
            id: `cand-${candidates.length + 1}`,
            rawSnippet: match[0].trim(),
            normalizedDate: iso,
            displayDate: formatDisplayDate(year, month, day),
            dateType: type,
            confidence: Math.round(ocrConfidence),
            requiresManualConfirmation: true,
            ambiguityWarning:
              rawYear < 100
                ? `Two-digit year (${rawYear}) interpreted as ${year}.`
                : null,
            contextKeywords: keywords,
          });
        }
      }
    }

    // Month Name + Day + Year
    const textMonthRegex2 =
      /\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*[\s\-./]+([0-3]?[0-9])(?:ST|ND|RD|TH)?[\s\-./,]+(20\d{2}|\d{2})\b/gi;

    while ((match = textMonthRegex2.exec(line)) !== null) {
      const monStr = match[1].toLowerCase();
      const month = MONTH_NAMES[monStr] || 0;
      const day = parseInt(match[2], 10);
      let rawYear = parseInt(match[3], 10);
      const year = rawYear < 100 ? normalizeTwoDigitYear(rawYear) : rawYear;

      if (isValidCalendarDate(year, month, day)) {
        const iso = formatIsoDate(year, month, day);
        if (!seenDates.has(iso)) {
          seenDates.add(iso);
          const context = getContextWindow(lineIdx);
          const { type, keywords } = classifyDateType(context);

          candidates.push({
            id: `cand-${candidates.length + 1}`,
            rawSnippet: match[0].trim(),
            normalizedDate: iso,
            displayDate: formatDisplayDate(year, month, day),
            dateType: type,
            confidence: Math.round(ocrConfidence),
            requiresManualConfirmation: true,
            ambiguityWarning:
              rawYear < 100
                ? `Two-digit year (${rawYear}) interpreted as ${year}.`
                : null,
            contextKeywords: keywords,
          });
        }
      }
    }

    // Month Name + Year only
    const monthYearRegex =
      /\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*[\s\-./]+(20\d{2}|\d{2})\b/gi;

    while ((match = monthYearRegex.exec(line)) !== null) {
      const prefix = line.slice(0, match.index);
      if (/\b\d{1,2}[\s\-./]*$/.test(prefix)) {
        continue;
      }

      const monStr = match[1].toLowerCase();
      const month = MONTH_NAMES[monStr] || 0;
      let rawYear = parseInt(match[2], 10);
      const year = rawYear < 100 ? normalizeTwoDigitYear(rawYear) : rawYear;

      const alreadyHasFullDate = candidates.some((c) => {
        const [cY, cM] = c.normalizedDate.split('-').map(Number);
        return cY === year && cM === month;
      });
      if (alreadyHasFullDate) {
        continue;
      }

      if (year >= 2020 && year <= 2040 && month >= 1 && month <= 12) {
        const lastDay = getDaysInMonth(year, month);
        const iso = formatIsoDate(year, month, lastDay);
        if (!seenDates.has(iso)) {
          seenDates.add(iso);
          const context = getContextWindow(lineIdx);
          const { type, keywords } = classifyDateType(context);

          candidates.push({
            id: `cand-${candidates.length + 1}`,
            rawSnippet: match[0].trim(),
            normalizedDate: iso,
            displayDate: `${MONTH_SHORT_NAMES[month]} ${year} (Month-Only)`,
            dateType: type,
            confidence: Math.round(ocrConfidence * 0.9),
            requiresManualConfirmation: true,
            ambiguityWarning:
              'Month-only date detected; normalized to the end of the month. Please confirm.',
            contextKeywords: keywords,
          });
        }
      }
    }

    // Pattern 2: ISO YYYY-MM-DD
    const isoRegex = /\b(20\d{2})[-/.](0[1-9]|1[0-2])[-/.]([0-3]?[0-9])\b/g;
    while ((match = isoRegex.exec(line)) !== null) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const day = parseInt(match[3], 10);

      if (isValidCalendarDate(year, month, day)) {
        const iso = formatIsoDate(year, month, day);
        if (!seenDates.has(iso)) {
          seenDates.add(iso);
          const context = getContextWindow(lineIdx);
          const { type, keywords } = classifyDateType(context);

          candidates.push({
            id: `cand-${candidates.length + 1}`,
            rawSnippet: match[0].trim(),
            normalizedDate: iso,
            displayDate: formatDisplayDate(year, month, day),
            dateType: type,
            confidence: Math.round(ocrConfidence),
            requiresManualConfirmation: true,
            ambiguityWarning: null,
            contextKeywords: keywords,
          });
        }
      }
    }

    // Pattern 3: Standard Numeric DD/MM/YYYY or DD-MM-YYYY
    const numDateRegex = /\b([0-3]?[0-9])[-/.]([0-3]?[0-9])[-/.](20\d{2}|\d{2})\b/g;
    while ((match = numDateRegex.exec(line)) !== null) {
      const p1 = parseInt(match[1], 10);
      const p2 = parseInt(match[2], 10);
      let rawYear = parseInt(match[3], 10);
      const year = rawYear < 100 ? normalizeTwoDigitYear(rawYear) : rawYear;

      let day = p1;
      let month = p2;
      let ambiguity: string | null = null;

      if (p1 > 12 && p2 <= 12) {
        day = p1;
        month = p2;
      } else if (p1 <= 12 && p2 > 12) {
        month = p1;
        day = p2;
        ambiguity = 'Detected US format (MM/DD/YYYY). Please confirm day and month.';
      } else if (p1 <= 12 && p2 <= 12) {
        day = p1;
        month = p2;
        ambiguity =
          `Ambiguous numeric date (${p1}/${p2} vs ${p2}/${p1}). Defaulted to DD/MM/YYYY; please review carefully.`;
      }

      if (rawYear < 100) {
        const yrNote = `Two-digit year (${rawYear}) interpreted as ${year}.`;
        ambiguity = ambiguity ? `${ambiguity} ${yrNote}` : yrNote;
      }

      if (isValidCalendarDate(year, month, day)) {
        const iso = formatIsoDate(year, month, day);
        if (!seenDates.has(iso)) {
          seenDates.add(iso);
          const context = getContextWindow(lineIdx);
          const { type, keywords } = classifyDateType(context);

          candidates.push({
            id: `cand-${candidates.length + 1}`,
            rawSnippet: match[0].trim(),
            normalizedDate: iso,
            displayDate: formatDisplayDate(year, month, day),
            dateType: type,
            confidence: Math.round(ocrConfidence * (ambiguity ? 0.85 : 0.95)),
            requiresManualConfirmation: true,
            ambiguityWarning: ambiguity,
            contextKeywords: keywords,
          });
        }
      }
    }
  });

  return candidates;
}

export function calculateUrgency(
  verifiedDate: string,
  dateType: DateType,
  baseDate = new Date()
): UrgencyResult {
  const disclaimer =
    'SurplusLabel provides organizational tools and date extraction assistance. Food safety decisions remain with trained kitchen supervisors.';

  if (!verifiedDate) {
    return {
      band: 'non_expiry',
      statusLabel: 'No Date Verified',
      daysRemaining: null,
      badgeVariant: 'neutral',
      iconName: 'HelpCircle',
      message: 'Please review and confirm the applicable food packaging date.',
      disclaimer,
      canDriveUrgency: false,
    };
  }

  if (dateType === 'manufacturing' || dateType === 'packaging') {
    return {
      band: 'non_expiry',
      statusLabel: dateType === 'manufacturing' ? 'Manufacturing Date' : 'Packing Date',
      daysRemaining: null,
      badgeVariant: 'neutral',
      iconName: 'PackageCheck',
      message:
        'This is a production or packing reference date, not an expiration date. An expiration date must be identified or verified to schedule donation triage.',
      disclaimer,
      canDriveUrgency: false,
    };
  }

  if (dateType === 'unknown') {
    return {
      band: 'non_expiry',
      statusLabel: 'Date Type Unconfirmed',
      daysRemaining: null,
      badgeVariant: 'warning',
      iconName: 'HelpCircle',
      message:
        'Please clarify whether this date is an Expiry, Use-By, or Best-Before date before finalizing urgency.',
      disclaimer,
      canDriveUrgency: false,
    };
  }

  const daysRemaining = getLocalCalendarDiff(verifiedDate, baseDate);

  if (daysRemaining < 0) {
    const daysAgo = Math.abs(daysRemaining);
    const timeLabel = daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;

    if (dateType === 'best_before') {
      return {
        band: 'past_best_before',
        statusLabel: 'Past Best-Before',
        daysRemaining,
        badgeVariant: 'warning',
        iconName: 'ShieldAlert',
        message: `Passed Best-Before date (${timeLabel}). Sensory quality or texture may be diminished; inspect packaging integrity before food bank donation.`,
        disclaimer,
        canDriveUrgency: true,
      };
    }

    return {
      band: 'past',
      statusLabel: 'Past Printed Expiry',
      daysRemaining,
      badgeVariant: 'danger',
      iconName: 'AlertTriangle',
      message: `Item passed printed ${
        dateType === 'use_by' ? 'Use-By' : 'Expiry'
      } date (${timeLabel}). Mandatory review under applicable food safety policy required.`,
      disclaimer,
      canDriveUrgency: true,
    };
  }

  if (daysRemaining === 0 || daysRemaining === 1) {
    const label =
      daysRemaining === 0 ? 'Critical (Expires Today)' : 'Critical (Expires Tomorrow)';
    return {
      band: 'critical',
      statusLabel: label,
      daysRemaining,
      badgeVariant: 'danger',
      iconName: 'AlertTriangle',
      message:
        'Immediate collection priority. Food bank distribution should occur today to ensure prompt consumption.',
      disclaimer,
      canDriveUrgency: true,
    };
  }

  if (daysRemaining >= 2 && daysRemaining <= 3) {
    return {
      band: 'urgent',
      statusLabel: `Urgent (${daysRemaining} days left)`,
      daysRemaining,
      badgeVariant: 'warning',
      iconName: 'Clock',
      message:
        'High dispatch priority. Coordinate collection window with nearby community kitchens within 48 hours.',
      disclaimer,
      canDriveUrgency: true,
    };
  }

  if (daysRemaining >= 4 && daysRemaining <= 7) {
    return {
      band: 'soon',
      statusLabel: `Soon (${daysRemaining} days left)`,
      daysRemaining,
      badgeVariant: 'warning',
      iconName: 'Clock',
      message:
        'Scheduled priority. Batch should be paired with standard food bank pickup routes this week.',
      disclaimer,
      canDriveUrgency: true,
    };
  }

  return {
    band: 'normal',
    statusLabel: `Stable (${daysRemaining} days left)`,
    daysRemaining,
    badgeVariant: 'success',
    iconName: 'CheckCircle2',
    message:
      'Standard inventory buffer. Safe for regular pantry storage and flexible pickup coordination.',
    disclaimer,
    canDriveUrgency: true,
  };
}

export interface StructuredDateInsights {
  rawText: string;
  ocrConfidence: number;
  manufacturingDate: string | null;
  expiryDate: string | null;
  bestBeforeDate: string | null;
  batchNumber: string | null;
  detectedDateType: DateType;
  primaryDate: string | null;
  status: 'detected' | 'mfg_only' | 'not_detected';
  statusBadge: 'success' | 'warning' | 'danger';
  statusText: string;
  message: string;
  candidates: DateCandidate[];
}

/**
 * Extracts batch or lot identification numbers from packaging text.
 */
export function extractBatchNumber(rawText: string): string | null {
  if (!rawText || typeof rawText !== 'string') return null;

  const patterns = [
    /\b(?:BATCH|LOT|B\.?\s*NO|LOT\s*#|BN)\s*(?:NO\.?|NUM\.?|NUMBER)?\s*[:.\-#]?\s*([A-Za-z0-9\-_/]{2,20})\b/i,
    /\b(?:LOT|BATCH)\s*[:.\-#]?\s*([A-Za-z0-9\-_/]{2,20})\b/i,
  ];

  for (const pat of patterns) {
    const match = rawText.match(pat);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (
        !/^\d{4}$/.test(candidate) &&
        !/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(candidate) &&
        !/^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)$/i.test(candidate)
      ) {
        return candidate;
      }
    }
  }

  return null;
}

/**
 * Extracts structured date insights across manufacturing, expiry, best-before, and batch number.
 * Ensures zero fabrication: unreadable labels produce 'not_detected' instead of dummy dates.
 */
export function extractLabelInsights(
  rawText: string,
  candidates: DateCandidate[],
  ocrConfidence = 80
): StructuredDateInsights {
  const batchNumber = extractBatchNumber(rawText);

  // Group candidates by date type
  const expiryCands = candidates.filter(
    (c) => c.dateType === 'expiry' || c.dateType === 'use_by'
  );
  const bestBeforeCands = candidates.filter((c) => c.dateType === 'best_before');
  const mfgCands = candidates.filter(
    (c) => c.dateType === 'manufacturing' || c.dateType === 'packaging'
  );
  const unknownCands = candidates.filter((c) => c.dateType === 'unknown');

  let expiryDate: string | null = null;
  let bestBeforeDate: string | null = null;
  let manufacturingDate: string | null = null;
  let primaryDate: string | null = null;
  let detectedDateType: DateType = 'unknown';

  if (expiryCands.length > 0) {
    expiryDate = expiryCands[0].normalizedDate;
  }

  if (bestBeforeCands.length > 0) {
    bestBeforeDate = bestBeforeCands[0].normalizedDate;
  }

  if (mfgCands.length > 0) {
    manufacturingDate = mfgCands[0].normalizedDate;
  }

  // If no explicit expiry or best before was labeled, but unknown candidate exists:
  if (!expiryDate && !bestBeforeDate && unknownCands.length > 0) {
    if (unknownCands.length === 1 && !manufacturingDate) {
      primaryDate = unknownCands[0].normalizedDate;
      detectedDateType = 'expiry';
      expiryDate = primaryDate;
    } else if (unknownCands.length >= 2 && !manufacturingDate) {
      const sorted = [...unknownCands].sort((a, b) =>
        a.normalizedDate.localeCompare(b.normalizedDate)
      );
      manufacturingDate = sorted[0].normalizedDate;
      expiryDate = sorted[sorted.length - 1].normalizedDate;
      primaryDate = expiryDate;
      detectedDateType = 'expiry';
    } else if (unknownCands.length >= 1 && manufacturingDate) {
      expiryDate = unknownCands[0].normalizedDate;
      primaryDate = expiryDate;
      detectedDateType = 'expiry';
    }
  }

  // Determine primary date and type
  if (expiryDate) {
    primaryDate = expiryDate;
    detectedDateType = expiryCands[0]?.dateType || 'expiry';
  } else if (bestBeforeDate) {
    primaryDate = bestBeforeDate;
    detectedDateType = 'best_before';
  }

  // Determine detection status
  if (primaryDate) {
    return {
      rawText,
      ocrConfidence,
      manufacturingDate,
      expiryDate,
      bestBeforeDate,
      batchNumber,
      detectedDateType,
      primaryDate,
      status: 'detected',
      statusBadge: 'success',
      statusText: 'Dates detected',
      message: 'Verified dates successfully detected from printed label.',
      candidates,
    };
  }

  if (manufacturingDate) {
    return {
      rawText,
      ocrConfidence,
      manufacturingDate,
      expiryDate: null,
      bestBeforeDate: null,
      batchNumber,
      detectedDateType: 'manufacturing',
      primaryDate: null,
      status: 'mfg_only',
      statusBadge: 'warning',
      statusText: 'Only MFG date detected',
      message:
        'Manufacturing date detected, but no printed expiry or best-before date was recognized. Please check physical packaging.',
      candidates,
    };
  }

  return {
    rawText,
    ocrConfidence,
    manufacturingDate: null,
    expiryDate: null,
    bestBeforeDate: null,
    batchNumber,
    detectedDateType: 'unknown',
    primaryDate: null,
    status: 'not_detected',
    statusBadge: 'danger',
    statusText: 'Could not confidently detect dates',
    message:
      'Could not confidently detect dates from label image. Please upload a clearer photograph of the printed package label.',
    candidates,
  };
}
