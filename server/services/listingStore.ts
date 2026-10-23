import fs from 'fs';
import path from 'path';
import { DateType, UrgencyBand, calculateUrgency, isValidCalendarDate } from './dateParser';
import { SafeUser } from './authService';

export type ListingStatus = 'available' | 'claimed' | 'collected' | 'cancelled';

export type FoodCategory =
  | 'dairy'
  | 'bakery'
  | 'produce'
  | 'pantry_grains'
  | 'canned_packaged'
  | 'prepared_meals'
  | 'beverages'
  | 'other';

export type StorageCondition =
  | 'ambient'
  | 'chilled'
  | 'frozen'
  | 'cool_dry';

export interface ClaimDetails {
  recipientUserId?: string; // ID of the claimant user
  recipientOrg: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  pickupWindowStart: string; // ISO date-time string
  pickupWindowEnd: string;   // ISO date-time string
  notes?: string;
  claimedAt: string;        // ISO timestamp
  verificationPin: string;  // 4-digit numeric handover PIN
}

export interface FoodListing {
  id: string;
  donorUserId?: string; // ID of the donor user who created the listing
  title: string;
  category: FoodCategory;
  quantity: number;
  unit: string;
  storageCondition: StorageCondition;
  handlingNotes?: string;
  donorOrg: string;
  pickupLocation: string;
  contactPhone?: string;

  // Packaging and verification
  imageUrl?: string;
  imagePublicId?: string;
  relevantDate: string; // YYYY-MM-DD
  dateType: DateType;
  isManuallyConfirmed: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  rawOcrText?: string;
  ocrConfidence?: number;

  // Urgency metrics (recalculated on retrieval)
  urgencyBand: UrgencyBand;
  urgencyLabel: string;
  daysRemaining: number | null;
  urgencyBadgeVariant: 'danger' | 'warning' | 'success' | 'info' | 'neutral';
  canDriveUrgency: boolean;

  // Status and handover
  status: ListingStatus;
  claim?: ClaimDetails;

  // Flags & timestamps
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListingInput {
  donorUserId?: string;
  title: string;
  category: FoodCategory;
  quantity: number;
  unit: string;
  storageCondition: StorageCondition;
  handlingNotes?: string;
  donorOrg: string;
  pickupLocation: string;
  contactPhone?: string;
  imageUrl?: string;
  imagePublicId?: string;
  relevantDate: string;
  dateType: DateType;
  isManuallyConfirmed: boolean;
  verifiedBy: string;
  rawOcrText?: string;
  ocrConfidence?: number;
}

export interface ClaimListingInput {
  recipientUserId?: string;
  recipientOrg: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  notes?: string;
}

export interface ListingFilters {
  search?: string;
  category?: string;
  urgency?: string;
  status?: string;
  sortBy?: 'urgency' | 'date' | 'quantity' | 'createdAt';
}

export interface ListingMetrics {
  totalListings: number;
  availableQuantity: number;
  urgentListings: number;
  claimedListings: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'server/data');
const DATA_FILE = path.join(DATA_DIR, 'listings.json');

/**
 * Validates a YYYY-MM-DD date string against strict calendar rules
 */
export function validateDateString(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  return isValidCalendarDate(year, month, day);
}

/**
 * Format a date YYYY-MM-DD with days offset from now
 */
function offsetDateString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Default clearly-labeled initial demo items with assigned donor/recipient IDs
 */
function getInitialDemoListings(): FoodListing[] {
  const now = new Date().toISOString();

  const demoItems: Array<Omit<FoodListing, 'urgencyBand' | 'urgencyLabel' | 'daysRemaining' | 'urgencyBadgeVariant' | 'canDriveUrgency'>> = [
    {
      id: 'lst_demo_001',
      donorUserId: 'usr_demo_donor_01',
      title: '[Demo] Organic Rolled Oats 1kg',
      category: 'pantry_grains',
      quantity: 35,
      unit: 'packs',
      storageCondition: 'ambient',
      handlingNotes: 'Keep dry in ventilated storeroom. Sealed original manufacturer pouches.',
      donorOrg: 'GreenMarket Community Co-op',
      pickupLocation: 'Distribution Bay 3, Central Hub, Sector 4',
      contactPhone: '+1 (555) 234-5678',
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
      relevantDate: offsetDateString(28),
      dateType: 'best_before',
      isManuallyConfirmed: true,
      verifiedBy: 'Elena Rostova (Kitchen Lead)',
      verifiedAt: now,
      rawOcrText: 'BEST BEFORE: ' + offsetDateString(28) + ' BATCH #OM4491 CERTIFIED ORGANIC',
      ocrConfidence: 94,
      status: 'available',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'lst_demo_002',
      donorUserId: 'usr_demo_donor_01',
      title: '[Demo] Artisanal Sourdough & Sandwich Bread',
      category: 'bakery',
      quantity: 24,
      unit: 'loaves',
      storageCondition: 'ambient',
      handlingNotes: 'Freshly baked surplus loaves. Ready for immediate redistribution to soup kitchens.',
      donorOrg: 'Campus Mess Hall #3',
      pickupLocation: 'West Kitchen Loading Bay, University Campus',
      contactPhone: '+1 (555) 345-6789',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
      relevantDate: offsetDateString(1),
      dateType: 'use_by',
      isManuallyConfirmed: true,
      verifiedBy: 'Marcus Chen (Store Supervisor)',
      verifiedAt: now,
      rawOcrText: 'USE BY ' + offsetDateString(1) + ' PACKED FRESH KEEP IN DRY PLACE',
      ocrConfidence: 91,
      status: 'available',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'lst_demo_003',
      donorUserId: 'usr_demo_donor_01',
      title: '[Demo] Pasteurized Whole Milk (1L Cartons)',
      category: 'dairy',
      quantity: 40,
      unit: 'cartons',
      storageCondition: 'chilled',
      handlingNotes: 'Continuous cold chain required (2°C - 4°C). Insulated carrier transport mandatory.',
      donorOrg: 'City Supermart Depot',
      pickupLocation: 'Cold Room B, 1400 Industrial Parkway',
      contactPhone: '+1 (555) 456-7890',
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
      relevantDate: offsetDateString(2),
      dateType: 'expiry',
      isManuallyConfirmed: true,
      verifiedBy: 'Elena Rostova (Kitchen Lead)',
      verifiedAt: now,
      rawOcrText: 'EXP ' + offsetDateString(2) + ' LOT 982 KEEP REFRIGERATED 4C',
      ocrConfidence: 96,
      status: 'available',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'lst_demo_004',
      donorUserId: 'usr_demo_donor_01',
      title: '[Demo] Greek Style Natural Yogurt 500g',
      category: 'dairy',
      quantity: 18,
      unit: 'tubs',
      storageCondition: 'chilled',
      handlingNotes: 'Refrigerated product. Sealed foil lids inspected and intact.',
      donorOrg: 'Organic Deli & Catering Hub',
      pickupLocation: 'Refrigerated Loading Dock 2, Market Square',
      contactPhone: '+1 (555) 567-8901',
      imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',
      relevantDate: offsetDateString(5),
      dateType: 'expiry',
      isManuallyConfirmed: true,
      verifiedBy: 'Sarah Jenkins (Quality Officer)',
      verifiedAt: now,
      rawOcrText: 'EXP: ' + offsetDateString(5) + ' MFD: ' + offsetDateString(-25),
      ocrConfidence: 89,
      status: 'claimed',
      claim: {
        recipientUserId: 'usr_demo_recipient_01',
        recipientOrg: 'Hope Community Food Pantry',
        contactName: 'David Kalu',
        contactPhone: '+1 (555) 876-5432',
        contactEmail: 'david@hopefoodpantry.org',
        pickupWindowStart: offsetDateString(0) + 'T14:00:00Z',
        pickupWindowEnd: offsetDateString(0) + 'T17:30:00Z',
        notes: 'Bringing insulated thermal boxes with cold gel packs.',
        claimedAt: now,
        verificationPin: '8492',
      },
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'lst_demo_005',
      donorUserId: 'usr_demo_donor_01',
      title: '[Demo] Fortified Vegetable Cooking Oil (5L)',
      category: 'pantry_grains',
      quantity: 12,
      unit: 'cans',
      storageCondition: 'ambient',
      handlingNotes: 'Sealed tin canisters. High shelf life; packaging date recorded as reference.',
      donorOrg: 'Metro Food Distributors',
      pickupLocation: 'Warehouse Bay 4, Cargo Terminal South',
      contactPhone: '+1 (555) 678-9012',
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
      relevantDate: offsetDateString(-30),
      dateType: 'manufacturing',
      isManuallyConfirmed: true,
      verifiedBy: 'Elena Rostova (Kitchen Lead)',
      verifiedAt: now,
      rawOcrText: 'MFD ' + offsetDateString(-30) + ' NET 5L BATCH OIL-2024-B',
      ocrConfidence: 95,
      status: 'available',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'lst_demo_006',
      donorUserId: 'usr_demo_donor_01',
      title: 'Yippee Noodles',
      category: 'canned_packaged',
      quantity: 20,
      unit: 'packets',
      storageCondition: 'cool_dry',
      handlingNotes: 'Stored in cool and dry place. Sealed packets.',
      donorOrg: 'ABC Hostel Mess',
      pickupLocation: 'Sector 62, Noida',
      contactPhone: '+1 (555) 789-0123',
      imageUrl: '/noodles.jpg',
      relevantDate: offsetDateString(2),
      dateType: 'expiry',
      isManuallyConfirmed: true,
      verifiedBy: 'Elena Rostova (Kitchen Lead)',
      verifiedAt: now,
      rawOcrText: 'EXP: ' + offsetDateString(2) + ' BATCH #YP-901 MAGIC MASALA',
      ocrConfidence: 98,
      status: 'available',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'lst_demo_007',
      donorUserId: 'usr_demo_donor_01',
      title: 'Parle-G Biscuits',
      category: 'bakery',
      quantity: 15,
      unit: 'packets',
      storageCondition: 'ambient',
      handlingNotes: 'Original outer carton packing. Sealed individual units.',
      donorOrg: 'XYZ Store',
      pickupLocation: 'Block B Market, Sector 15',
      contactPhone: '+1 (555) 890-1234',
      imageUrl: '/biscuits.jpg',
      relevantDate: offsetDateString(5),
      dateType: 'best_before',
      isManuallyConfirmed: true,
      verifiedBy: 'Elena Rostova (Kitchen Lead)',
      verifiedAt: now,
      rawOcrText: 'BEST BEFORE ' + offsetDateString(5) + ' LOT PG-402',
      ocrConfidence: 94,
      status: 'available',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'lst_demo_008',
      donorUserId: 'usr_demo_donor_01',
      title: 'Amul Milk (Tetra Pack)',
      category: 'dairy',
      quantity: 10,
      unit: 'packs',
      storageCondition: 'chilled',
      handlingNotes: 'Refrigerated unopened 1L whole milk tetra cartons.',
      donorOrg: 'PQR Event Catering',
      pickupLocation: 'Community Hall Bay 1',
      contactPhone: '+1 (555) 901-2345',
      imageUrl: '/milk.jpg',
      relevantDate: offsetDateString(-1),
      dateType: 'expiry',
      isManuallyConfirmed: true,
      verifiedBy: 'Elena Rostova (Kitchen Lead)',
      verifiedAt: now,
      rawOcrText: 'EXP ' + offsetDateString(-1) + ' 1L PURE MILK UHT PROCESSED',
      ocrConfidence: 96,
      status: 'collected',
      claim: {
        recipientUserId: 'usr_demo_recipient_01',
        recipientOrg: 'Hope Community Food Pantry',
        contactName: 'David Kalu',
        contactPhone: '+1 (555) 876-5432',
        contactEmail: 'david@hopefoodpantry.org',
        pickupWindowStart: offsetDateString(-2) + 'T10:00:00Z',
        pickupWindowEnd: offsetDateString(-2) + 'T12:00:00Z',
        notes: 'Collected and verified with physical handover PIN.',
        claimedAt: offsetDateString(-2) + 'T09:30:00Z',
        verificationPin: '4129',
      },
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'lst_demo_009',
      donorUserId: 'usr_demo_donor_01',
      title: "Lay's Chips",
      category: 'canned_packaged',
      quantity: 12,
      unit: 'packets',
      storageCondition: 'ambient',
      handlingNotes: 'Original salted potato chips. Crisp, intact nitrogen-flushed bags.',
      donorOrg: 'Food Plaza Multiplex',
      pickupLocation: 'Food Court Bay 4, Mall Area',
      contactPhone: '+1 (555) 012-3456',
      imageUrl: '/chips.jpg',
      relevantDate: offsetDateString(7),
      dateType: 'best_before',
      isManuallyConfirmed: true,
      verifiedBy: 'Elena Rostova (Kitchen Lead)',
      verifiedAt: now,
      rawOcrText: 'BEST BEFORE ' + offsetDateString(7) + ' BATCH CH-12',
      ocrConfidence: 95,
      status: 'available',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'lst_demo_010',
      donorUserId: 'usr_demo_donor_01',
      title: "Kellogg's Corn Flakes",
      category: 'pantry_grains',
      quantity: 5,
      unit: 'boxes',
      storageCondition: 'ambient',
      handlingNotes: 'Sealed breakfast cereal cartons.',
      donorOrg: 'Metro Mart',
      pickupLocation: 'Sector 62 Loading Bay',
      contactPhone: '+1 (555) 123-4567',
      imageUrl: 'https://images.unsplash.com/photo-1521483451569-e33803c0330c?auto=format&fit=crop&w=600&q=80',
      relevantDate: offsetDateString(23),
      dateType: 'best_before',
      isManuallyConfirmed: true,
      verifiedBy: 'Elena Rostova (Kitchen Lead)',
      verifiedAt: now,
      rawOcrText: 'BEST BEFORE ' + offsetDateString(23),
      ocrConfidence: 92,
      status: 'available',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'lst_demo_011',
      donorUserId: 'usr_demo_donor_01',
      title: 'Bournvita Nutrition Drink',
      category: 'beverages',
      quantity: 8,
      unit: 'packs',
      storageCondition: 'ambient',
      handlingNotes: 'Sealed malt chocolate refill packs.',
      donorOrg: 'Daily Needs Co-op',
      pickupLocation: 'Sector 18 Hub',
      contactPhone: '+1 (555) 234-5678',
      imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
      relevantDate: offsetDateString(18),
      dateType: 'best_before',
      isManuallyConfirmed: true,
      verifiedBy: 'Elena Rostova (Kitchen Lead)',
      verifiedAt: now,
      rawOcrText: 'BEST BEFORE ' + offsetDateString(18),
      ocrConfidence: 93,
      status: 'available',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  return demoItems.map((item) => enrichListingWithUrgency(item as FoodListing));
}

/**
 * Dynamically compute urgency metrics using current calendar time
 */
export function enrichListingWithUrgency(listing: FoodListing): FoodListing {
  const urgencyResult = calculateUrgency(listing.relevantDate, listing.dateType, new Date());
  return {
    ...listing,
    urgencyBand: urgencyResult.band,
    urgencyLabel: urgencyResult.statusLabel,
    daysRemaining: urgencyResult.daysRemaining,
    urgencyBadgeVariant: urgencyResult.badgeVariant,
    canDriveUrgency: urgencyResult.canDriveUrgency,
  };
}

/**
 * Redacts sensitive claim information (handover PIN, contact email/phone, notes)
 * unless the current user is the claimant recipient, the donor owner, or an administrator.
 */
export function sanitizeListingForUser(
  listing: FoodListing,
  currentUser?: SafeUser | null
): FoodListing {
  if (!listing.claim) {
    return listing;
  }

  // Check authorization
  const isRecipientClaimant =
    currentUser &&
    listing.claim.recipientUserId &&
    listing.claim.recipientUserId === currentUser.id;

  const isDonorOwner =
    currentUser &&
    (listing.donorUserId === currentUser.id ||
      listing.donorOrg.toLowerCase() === currentUser.organizationName.toLowerCase());

  const isAdmin = currentUser?.role === 'admin';

  // If authorized, return complete data
  if (isRecipientClaimant || isDonorOwner || isAdmin) {
    return listing;
  }

  // Redact confidential information for third parties / public
  return {
    ...listing,
    claim: {
      ...listing.claim,
      verificationPin: '••••', // Masked PIN
      contactPhone: '••••••••••', // Masked phone
      contactEmail: undefined,
      notes: undefined, // Hide private transport notes
    },
  };
}

/**
 * File-backed Listing Store with Atomic Safe Writes
 */
class ListingStore {
  private inMemoryCache: FoodListing[] | null = null;
  private recentSubmissions = new Map<string, number>();

  constructor() {
    this.ensureDataFile();
  }

  private ensureDataFile(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (!fs.existsSync(DATA_FILE)) {
        const initial = getInitialDemoListings();
        this.writeAtomic(initial);
        this.inMemoryCache = initial;
      }
    } catch (err) {
      console.error('[ListingStore] Failed to ensure data file:', err);
    }
  }

  private readFromDisk(): FoodListing[] {
    try {
      if (!fs.existsSync(DATA_FILE)) {
        const initial = getInitialDemoListings();
        this.writeAtomic(initial);
        return initial;
      }
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed: FoodListing[] = JSON.parse(raw);
      return parsed.map((item) => enrichListingWithUrgency(item));
    } catch (err) {
      console.error('[ListingStore] Error reading listings from disk:', err);
      return (this.inMemoryCache || getInitialDemoListings()).map((item) => enrichListingWithUrgency(item));
    }
  }

  private writeAtomic(data: FoodListing[]): void {
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    try {
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DATA_FILE);
      this.inMemoryCache = data;
    } catch (err) {
      console.error('[ListingStore] Atomic write failed:', err);
      if (fs.existsSync(tempFile)) {
        try {
          fs.unlinkSync(tempFile);
        } catch {}
      }
      throw new Error('Failed to persist listing record to storage.');
    }
  }

  /**
   * Check for duplicate submissions within a short cooldown (10 seconds)
   */
  public isDuplicateSubmission(donorOrg: string, title: string): boolean {
    const key = `${donorOrg.trim().toLowerCase()}:::${title.trim().toLowerCase()}`;
    const lastTimestamp = this.recentSubmissions.get(key);
    const now = Date.now();

    if (lastTimestamp && now - lastTimestamp < 10000) {
      return true;
    }

    this.recentSubmissions.set(key, now);
    if (this.recentSubmissions.size > 200) {
      for (const [k, time] of this.recentSubmissions.entries()) {
        if (now - time > 60000) {
          this.recentSubmissions.delete(k);
        }
      }
    }
    return false;
  }

  /**
   * Get all listings with live urgency calculation, filtering, search, sorting, and sensitive data scrubbing
   */
  public getAll(
    filters: ListingFilters = {},
    currentUser?: SafeUser | null
  ): { listings: FoodListing[]; metrics: ListingMetrics } {
    let items = this.readFromDisk();

    // 1. Text Search across title, donorOrg, pickupLocation, category
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.donorOrg.toLowerCase().includes(q) ||
          item.pickupLocation.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }

    // 2. Category filter
    if (filters.category && filters.category !== 'all') {
      items = items.filter((item) => item.category === filters.category);
    }

    // 3. Status filter
    if (filters.status && filters.status !== 'all') {
      items = items.filter((item) => item.status === filters.status);
    }

    // 4. Urgency filter
    if (filters.urgency && filters.urgency !== 'all') {
      items = items.filter((item) => item.urgencyBand === filters.urgency);
    }

    // Compute metrics across all current items
    const allCurrent = this.readFromDisk();
    const metrics: ListingMetrics = {
      totalListings: allCurrent.length,
      availableQuantity: allCurrent
        .filter((l) => l.status === 'available')
        .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
      urgentListings: allCurrent.filter(
        (l) => l.status === 'available' && (l.urgencyBand === 'critical' || l.urgencyBand === 'urgent')
      ).length,
      claimedListings: allCurrent.filter((l) => l.status === 'claimed').length,
    };

    // 5. Sorting
    const sortBy = filters.sortBy || 'urgency';
    items.sort((a, b) => {
      if (sortBy === 'urgency') {
        const priorityOrder: Record<UrgencyBand, number> = {
          critical: 1,
          urgent: 2,
          soon: 3,
          past: 4,
          past_best_before: 5,
          normal: 6,
          non_expiry: 7,
        };
        const diff = (priorityOrder[a.urgencyBand] || 99) - (priorityOrder[b.urgencyBand] || 99);
        if (diff !== 0) return diff;
        return a.relevantDate.localeCompare(b.relevantDate);
      }
      if (sortBy === 'date') {
        return a.relevantDate.localeCompare(b.relevantDate);
      }
      if (sortBy === 'quantity') {
        return b.quantity - a.quantity;
      }
      if (sortBy === 'createdAt') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

    // 6. Scrub sensitive details for unauthorized viewers
    const sanitizedItems = items.map((item) => sanitizeListingForUser(item, currentUser));

    return { listings: sanitizedItems, metrics };
  }

  /**
   * Get single listing by ID with sensitive data scrubbing
   */
  public getById(id: string, currentUser?: SafeUser | null): FoodListing | null {
    const items = this.readFromDisk();
    const found = items.find((item) => item.id === id);
    if (!found) return null;
    const enriched = enrichListingWithUrgency(found);
    return sanitizeListingForUser(enriched, currentUser);
  }

  /**
   * Create a new food listing with strict validation and donor ownership
   */
  public create(input: CreateListingInput, currentUser?: SafeUser | null): FoodListing {
    if (!input.title || !input.title.trim()) {
      throw new Error('Listing title is required.');
    }
    if (!input.category) {
      throw new Error('Food category is required.');
    }
    if (typeof input.quantity !== 'number' || input.quantity <= 0) {
      throw new Error('Quantity must be a positive number greater than 0.');
    }
    if (!input.unit || !input.unit.trim()) {
      throw new Error('Quantity unit (e.g. kg, loaves, packs) is required.');
    }
    if (!input.donorOrg || !input.donorOrg.trim()) {
      throw new Error('Donor organization name is required.');
    }
    if (!input.pickupLocation || !input.pickupLocation.trim()) {
      throw new Error('Pickup location address is required.');
    }
    if (!validateDateString(input.relevantDate)) {
      throw new Error(`Invalid calendar date: "${input.relevantDate}". Must be YYYY-MM-DD.`);
    }
    if (!input.isManuallyConfirmed) {
      throw new Error(
        'Human supervisor verification sign-off is mandatory. Food listings cannot be published from unconfirmed OCR output.'
      );
    }
    if (!input.verifiedBy || !input.verifiedBy.trim()) {
      throw new Error('Verifier name or supervisor role is required for the audit record.');
    }

    if (this.isDuplicateSubmission(input.donorOrg, input.title)) {
      throw new Error('Duplicate submission detected. Please wait a few seconds before resubmitting the same food batch.');
    }

    const now = new Date().toISOString();
    const id = `lst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newRawItem: FoodListing = {
      id,
      donorUserId: currentUser?.id || input.donorUserId,
      title: input.title.trim(),
      category: input.category,
      quantity: input.quantity,
      unit: input.unit.trim(),
      storageCondition: input.storageCondition || 'ambient',
      handlingNotes: input.handlingNotes?.trim(),
      donorOrg: (currentUser?.organizationName || input.donorOrg).trim(),
      pickupLocation: input.pickupLocation.trim(),
      contactPhone: input.contactPhone?.trim() || currentUser?.phone,
      imageUrl: input.imageUrl,
      imagePublicId: input.imagePublicId,
      relevantDate: input.relevantDate,
      dateType: input.dateType,
      isManuallyConfirmed: true,
      verifiedBy: input.verifiedBy.trim(),
      verifiedAt: now,
      rawOcrText: input.rawOcrText,
      ocrConfidence: input.ocrConfidence,
      status: 'available',
      isDemo: false,
      createdAt: now,
      updatedAt: now,
      urgencyBand: 'normal',
      urgencyLabel: 'Normal',
      daysRemaining: null,
      urgencyBadgeVariant: 'neutral',
      canDriveUrgency: true,
    };

    const enriched = enrichListingWithUrgency(newRawItem);
    const all = this.readFromDisk();
    all.unshift(enriched);
    this.writeAtomic(all);

    return enriched;
  }

  /**
   * Claim/reserve an available listing with double-claim conflict prevention and recipient ownership
   */
  public claim(
    id: string,
    claimInput: ClaimListingInput,
    currentUser?: SafeUser | null
  ): FoodListing {
    const all = this.readFromDisk();
    const index = all.findIndex((item) => item.id === id);

    if (index === -1) {
      const notFoundErr: any = new Error(`Food listing with ID "${id}" was not found.`);
      notFoundErr.status = 404;
      throw notFoundErr;
    }

    const existing = all[index];

    // Conflict prevention: Reject claims on non-available listings
    if (existing.status !== 'available') {
      const conflictErr: any = new Error(
        `Listing "${existing.title}" is currently "${existing.status}" and cannot be reserved. Conflicting claims are prevented.`
      );
      conflictErr.status = 409;
      throw conflictErr;
    }

    const recipientOrg = currentUser?.organizationName || claimInput.recipientOrg;
    const contactName = currentUser?.contactName || claimInput.contactName;
    const contactPhone = claimInput.contactPhone || currentUser?.phone;

    if (!recipientOrg || !recipientOrg.trim()) {
      throw new Error('Recipient organization name is required.');
    }
    if (!contactName || !contactName.trim()) {
      throw new Error('Recipient contact person is required.');
    }
    if (!contactPhone || !contactPhone.trim()) {
      throw new Error('Recipient contact telephone is required.');
    }
    if (!claimInput.pickupWindowStart || !claimInput.pickupWindowEnd) {
      throw new Error('Pickup window start and end times are required.');
    }

    // Generate random 4-digit pickup PIN
    const verificationPin = Math.floor(1000 + Math.random() * 9000).toString();
    const now = new Date().toISOString();

    const updatedItem: FoodListing = {
      ...existing,
      status: 'claimed',
      claim: {
        recipientUserId: currentUser?.id || claimInput.recipientUserId,
        recipientOrg: recipientOrg.trim(),
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: claimInput.contactEmail?.trim() || currentUser?.email,
        pickupWindowStart: claimInput.pickupWindowStart,
        pickupWindowEnd: claimInput.pickupWindowEnd,
        notes: claimInput.notes?.trim(),
        claimedAt: now,
        verificationPin,
      },
      updatedAt: now,
    };

    all[index] = updatedItem;
    this.writeAtomic(all);

    return enrichListingWithUrgency(updatedItem);
  }

  /**
   * Update status with allowed transition validation and organization ownership checks
   */
  public updateStatus(
    id: string,
    newStatus: ListingStatus,
    currentUser?: SafeUser | null,
    notes?: string
  ): FoodListing {
    const all = this.readFromDisk();
    const index = all.findIndex((item) => item.id === id);

    if (index === -1) {
      const notFoundErr: any = new Error(`Listing with ID "${id}" not found.`);
      notFoundErr.status = 404;
      throw notFoundErr;
    }

    const existing = all[index];
    const oldStatus = existing.status;

    // DATA OWNERSHIP & AUTHORIZATION RULES:
    if (currentUser && currentUser.role !== 'admin') {
      if (currentUser.role === 'donor') {
        // Donors can only update their own listings
        const isOwner =
          existing.donorUserId === currentUser.id ||
          existing.donorOrg.toLowerCase() === currentUser.organizationName.toLowerCase();
        if (!isOwner) {
          const authErr: any = new Error(
            'Unauthorized: You can only update food listings belonging to your organization.'
          );
          authErr.status = 403;
          throw authErr;
        }
      } else if (currentUser.role === 'recipient') {
        // Recipients can only release/cancel their own claim
        const isClaimant = existing.claim?.recipientUserId === currentUser.id;
        if (!isClaimant || newStatus !== 'available') {
          const authErr: any = new Error(
            'Unauthorized: Recipients can only release their own active reservation.'
          );
          authErr.status = 403;
          throw authErr;
        }
      }
    }

    // Validate status transitions
    const validTransitions: Record<ListingStatus, ListingStatus[]> = {
      available: ['claimed', 'cancelled'],
      claimed: ['collected', 'available', 'cancelled'],
      collected: [], // terminal state
      cancelled: ['available'], // allow relisting if cancelled by mistake
    };

    if (oldStatus === newStatus) {
      return enrichListingWithUrgency(existing);
    }

    if (!validTransitions[oldStatus].includes(newStatus)) {
      const err: any = new Error(
        `Invalid status transition: Cannot change status from "${oldStatus}" to "${newStatus}".`
      );
      err.status = 400;
      throw err;
    }

    const now = new Date().toISOString();
    const updated: FoodListing = {
      ...existing,
      status: newStatus,
      updatedAt: now,
    };

    // If released back to available, clear the claim
    if (newStatus === 'available') {
      delete updated.claim;
    }

    if (notes && updated.claim) {
      updated.claim.notes = updated.claim.notes ? `${updated.claim.notes} | ${notes}` : notes;
    }

    all[index] = updated;
    this.writeAtomic(all);

    return enrichListingWithUrgency(updated);
  }

  /**
   * Reset to initial demo data (useful for automated testing)
   */
  public resetToDemo(): void {
    const initial = getInitialDemoListings();
    this.writeAtomic(initial);
  }
}

export const listingStore = new ListingStore();
