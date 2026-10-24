import { DateType, UrgencyBand } from '../utils/ocrDateParser';

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

  // Packaging & verification
  imageUrl?: string;
  imagePublicId?: string;
  relevantDate: string; // YYYY-MM-DD
  dateType: DateType;
  manufacturingDate?: string;
  expiryDate?: string;
  batchNumber?: string;
  isManuallyConfirmed: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  rawOcrText?: string;
  ocrConfidence?: number;

  // Urgency
  urgencyBand: UrgencyBand;
  urgencyLabel: string;
  daysRemaining: number | null;
  urgencyBadgeVariant: 'danger' | 'warning' | 'success' | 'info' | 'neutral';
  canDriveUrgency: boolean;

  // Status & Handover
  status: ListingStatus;
  claim?: ClaimDetails;

  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListingMetrics {
  totalListings: number;
  availableQuantity: number;
  urgentListings: number;
  claimedListings: number;
}

export interface CreateListingFormData {
  title: string;
  category: FoodCategory;
  quantity: number | '';
  unit: string;
  storageCondition: StorageCondition;
  handlingNotes: string;
  donorOrg: string;
  pickupLocation: string;
  contactPhone: string;
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
