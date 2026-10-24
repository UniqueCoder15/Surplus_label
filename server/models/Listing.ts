import mongoose, { Schema, Document, Model } from 'mongoose';
import { FoodCategory, StorageCondition, ListingStatus } from '../services/listingStore';
import { DateType, UrgencyBand } from '../services/dateParser';

export interface IClaimSubdocument {
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

export interface IListingDocument extends Document {
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
  claim?: IClaimSubdocument;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

const ClaimSchema = new Schema<IClaimSubdocument>(
  {
    recipientUserId: { type: String, index: true },
    recipientOrg: { type: String, required: true },
    contactName: { type: String, required: true },
    contactPhone: { type: String, required: true },
    contactEmail: { type: String },
    pickupWindowStart: { type: String, required: true },
    pickupWindowEnd: { type: String, required: true },
    notes: { type: String },
    claimedAt: { type: String, required: true },
    verificationPin: { type: String, required: true },
  },
  { _id: false }
);

const ListingSchema = new Schema<IListingDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    donorUserId: {
      type: String,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'dairy',
        'bakery',
        'produce',
        'pantry_grains',
        'canned_packaged',
        'prepared_meals',
        'beverages',
        'other',
      ],
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    storageCondition: {
      type: String,
      required: true,
      enum: ['ambient', 'chilled', 'frozen', 'cool_dry'],
    },
    handlingNotes: {
      type: String,
      trim: true,
    },
    donorOrg: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    pickupLocation: {
      type: String,
      required: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
    },
    imagePublicId: {
      type: String,
    },
    relevantDate: {
      type: String,
      required: true,
    },
    dateType: {
      type: String,
      required: true,
      enum: ['expiry', 'best_before', 'use_by', 'packaging', 'manufacturing'],
    },
    isManuallyConfirmed: {
      type: Boolean,
      required: true,
    },
    verifiedBy: {
      type: String,
      trim: true,
    },
    verifiedAt: {
      type: String,
    },
    rawOcrText: {
      type: String,
    },
    ocrConfidence: {
      type: Number,
    },
    urgencyBand: {
      type: String,
      required: true,
      enum: ['critical', 'urgent', 'soon', 'normal', 'non_expiry', 'past', 'past_best_before'],
      index: true,
    },
    urgencyLabel: {
      type: String,
      required: true,
    },
    daysRemaining: {
      type: Number,
      default: null,
    },
    urgencyBadgeVariant: {
      type: String,
      required: true,
      enum: ['danger', 'warning', 'success', 'info', 'neutral'],
    },
    canDriveUrgency: {
      type: Boolean,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['available', 'claimed', 'collected', 'cancelled'],
      default: 'available',
      index: true,
    },
    claim: {
      type: ClaimSchema,
      default: undefined,
    },
    isDemo: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
    updatedAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  {
    versionKey: false,
    timestamps: false,
  }
);

// Compound indexes for high-throughput query filters
ListingSchema.index({ status: 1, urgencyBand: 1 });
ListingSchema.index({ category: 1, status: 1 });
ListingSchema.index({ donorOrg: 1, createdAt: -1 });

export const ListingModel: Model<IListingDocument> =
  mongoose.models.Listing || mongoose.model<IListingDocument>('Listing', ListingSchema);
