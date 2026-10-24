import { DateType, UrgencyBand, calculateUrgency, isValidCalendarDate } from './dateParser';
import { SafeUser } from './authService';
import { isMongoConnected } from '../db/connection';
import { ListingModel, IListingDocument } from '../models/Listing';
import { getInitialDemoListings } from '../data/demoSeed';

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
  recipientUserId?: string;
  recipientOrg: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  notes?: string;
  claimedAt: string;
  verificationPin: string;
}

export interface FoodListing {
  id: string;
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
  manufacturingDate?: string;
  expiryDate?: string;
  batchNumber?: string;
  isManuallyConfirmed: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  rawOcrText?: string;
  ocrConfidence?: number;
  urgencyBand: UrgencyBand;
  urgencyLabel: string;
  daysRemaining: number | null;
  urgencyBadgeVariant: 'danger' | 'warning' | 'success' | 'info' | 'neutral';
  canDriveUrgency: boolean;
  status: ListingStatus;
  claim?: ClaimDetails;
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
  manufacturingDate?: string;
  expiryDate?: string;
  batchNumber?: string;
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

export function validateDateString(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  return isValidCalendarDate(year, month, day);
}

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

export function sanitizeListingForUser(
  listing: FoodListing,
  currentUser?: SafeUser | null
): FoodListing {
  if (!listing.claim) {
    return listing;
  }

  const isRecipientClaimant =
    currentUser &&
    listing.claim.recipientUserId &&
    listing.claim.recipientUserId === currentUser.id;

  const isDonorOwner =
    currentUser &&
    (listing.donorUserId === currentUser.id ||
      listing.donorOrg.toLowerCase() === currentUser.organizationName.toLowerCase());

  const isAdmin = currentUser?.role === 'admin';

  if (isRecipientClaimant || isDonorOwner || isAdmin) {
    return listing;
  }

  return {
    ...listing,
    claim: {
      ...listing.claim,
      verificationPin: '••••',
      contactPhone: '••••••••••',
      contactEmail: undefined,
      notes: undefined,
    },
  };
}

function assertDatabaseConnected(): void {
  if (!isMongoConnected()) {
    const err: any = new Error(
      'Database is not connected. Set MONGODB_URI to a valid MongoDB Atlas connection string.'
    );
    err.status = 503;
    throw err;
  }
}

function listingFromDocument(doc: IListingDocument | Record<string, unknown>): FoodListing {
  const plain =
    typeof (doc as IListingDocument).toObject === 'function'
      ? (doc as IListingDocument).toObject()
      : { ...doc };
  const { _id, __v, ...rest } = plain as Record<string, unknown>;
  return enrichListingWithUrgency(rest as unknown as FoodListing);
}

function applyFilters(items: FoodListing[], filters: ListingFilters): FoodListing[] {
  let result = items;

  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    result = result.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.donorOrg.toLowerCase().includes(q) ||
        item.pickupLocation.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }

  if (filters.category && filters.category !== 'all') {
    result = result.filter((item) => item.category === filters.category);
  }

  if (filters.status && filters.status !== 'all') {
    result = result.filter((item) => item.status === filters.status);
  }

  if (filters.urgency && filters.urgency !== 'all') {
    result = result.filter((item) => item.urgencyBand === filters.urgency);
  }

  const sortBy = filters.sortBy || 'urgency';
  result.sort((a, b) => {
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

  return result;
}

function computeMetrics(allItems: FoodListing[]): ListingMetrics {
  return {
    totalListings: allItems.length,
    availableQuantity: allItems
      .filter((l) => l.status === 'available')
      .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    urgentListings: allItems.filter(
      (l) => l.status === 'available' && (l.urgencyBand === 'critical' || l.urgencyBand === 'urgent')
    ).length,
    claimedListings: allItems.filter((l) => l.status === 'claimed').length,
  };
}

class ListingStore {
  private recentSubmissions = new Map<string, number>();

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

  public async getAll(
    filters: ListingFilters = {},
    currentUser?: SafeUser | null
  ): Promise<{ listings: FoodListing[]; metrics: ListingMetrics }> {
    assertDatabaseConnected();

    const docs = await ListingModel.find({}).lean();
    const allEnriched = docs.map((doc) => listingFromDocument(doc));
    const metrics = computeMetrics(allEnriched);
    const filtered = applyFilters([...allEnriched], filters);
    const sanitizedItems = filtered.map((item) => sanitizeListingForUser(item, currentUser));

    return { listings: sanitizedItems, metrics };
  }

  public async getById(id: string, currentUser?: SafeUser | null): Promise<FoodListing | null> {
    assertDatabaseConnected();
    const doc = await ListingModel.findOne({ id }).lean();
    if (!doc) return null;
    const enriched = listingFromDocument(doc);
    return sanitizeListingForUser(enriched, currentUser);
  }

  public async create(input: CreateListingInput, currentUser?: SafeUser | null): Promise<FoodListing> {
    assertDatabaseConnected();

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
    if (input.manufacturingDate && !validateDateString(input.manufacturingDate)) {
      throw new Error(`Invalid manufacturing date: "${input.manufacturingDate}". Must be YYYY-MM-DD.`);
    }
    if (input.expiryDate && !validateDateString(input.expiryDate)) {
      throw new Error(`Invalid expiry date: "${input.expiryDate}". Must be YYYY-MM-DD.`);
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
      throw new Error(
        'Duplicate submission detected. Please wait a few seconds before resubmitting the same food batch.'
      );
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
      manufacturingDate: input.manufacturingDate ? input.manufacturingDate.trim() : undefined,
      expiryDate: input.expiryDate ? input.expiryDate.trim() : undefined,
      batchNumber: input.batchNumber ? input.batchNumber.trim() : undefined,
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
    await ListingModel.create(enriched);
    return enriched;
  }

  public async claim(
    id: string,
    claimInput: ClaimListingInput,
    currentUser?: SafeUser | null
  ): Promise<FoodListing> {
    assertDatabaseConnected();

    const existingDoc = await ListingModel.findOne({ id }).lean();
    if (!existingDoc) {
      const notFoundErr: any = new Error(`Food listing with ID "${id}" was not found.`);
      notFoundErr.status = 404;
      throw notFoundErr;
    }

    const existing = listingFromDocument(existingDoc);

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

    const verificationPin = Math.floor(1000 + Math.random() * 9000).toString();
    const now = new Date().toISOString();

    const claim: ClaimDetails = {
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
    };

    const updatedDoc = await ListingModel.findOneAndUpdate(
      { id, status: 'available' },
      {
        $set: {
          status: 'claimed',
          claim,
          updatedAt: now,
        },
      },
      { returnDocument: 'after' }
    ).lean();

    if (!updatedDoc) {
      const conflictErr: any = new Error(
        `Listing "${existing.title}" is no longer available and cannot be reserved. Conflicting claims are prevented.`
      );
      conflictErr.status = 409;
      throw conflictErr;
    }

    return listingFromDocument(updatedDoc);
  }

  public async updateStatus(
    id: string,
    newStatus: ListingStatus,
    currentUser?: SafeUser | null,
    notes?: string
  ): Promise<FoodListing> {
    assertDatabaseConnected();

    const existingDoc = await ListingModel.findOne({ id }).lean();
    if (!existingDoc) {
      const notFoundErr: any = new Error(`Listing with ID "${id}" not found.`);
      notFoundErr.status = 404;
      throw notFoundErr;
    }

    const existing = listingFromDocument(existingDoc);
    const oldStatus = existing.status;

    if (currentUser && currentUser.role !== 'admin') {
      if (currentUser.role === 'donor') {
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

    const validTransitions: Record<ListingStatus, ListingStatus[]> = {
      available: ['claimed', 'cancelled'],
      claimed: ['collected', 'available', 'cancelled'],
      collected: [],
      cancelled: ['available'],
    };

    if (oldStatus === newStatus) {
      return existing;
    }

    if (!validTransitions[oldStatus].includes(newStatus)) {
      const err: any = new Error(
        `Invalid status transition: Cannot change status from "${oldStatus}" to "${newStatus}".`
      );
      err.status = 400;
      throw err;
    }

    const now = new Date().toISOString();
    const mongoUpdate: { $set: Record<string, unknown>; $unset?: { claim: 1 } } = {
      $set: {
        status: newStatus,
        updatedAt: now,
      },
    };

    if (newStatus === 'available') {
      mongoUpdate.$unset = { claim: 1 };
    } else if (notes && existing.claim) {
      mongoUpdate.$set.claim = {
        ...existing.claim,
        notes: existing.claim.notes ? `${existing.claim.notes} | ${notes}` : notes,
      };
    }

    const updatedDoc = await ListingModel.findOneAndUpdate({ id }, mongoUpdate, { returnDocument: 'after' }).lean();

    if (!updatedDoc) {
      const notFoundErr: any = new Error(`Listing with ID "${id}" not found.`);
      notFoundErr.status = 404;
      throw notFoundErr;
    }

    return listingFromDocument(updatedDoc);
  }

  public async resetToDemo(): Promise<void> {
    assertDatabaseConnected();
    await ListingModel.deleteMany({});
    const initial = getInitialDemoListings().map((item) =>
      enrichListingWithUrgency({
        ...item,
        urgencyBand: 'normal',
        urgencyLabel: 'Normal',
        daysRemaining: null,
        urgencyBadgeVariant: 'neutral',
        canDriveUrgency: true,
      } as FoodListing)
    );
    await ListingModel.insertMany(initial);
  }
}

export const listingStore = new ListingStore();
