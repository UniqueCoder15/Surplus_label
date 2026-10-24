import mongoose, { Schema, Document, Model } from 'mongoose';
import { UserRole } from '../services/authService';

export interface IUserDocument extends Document {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  organizationName: string;
  contactName: string;
  phone?: string;
  address?: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

const UserSchema = new Schema<IUserDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['donor', 'recipient', 'admin'],
      index: true,
    },
    organizationName: {
      type: String,
      required: true,
      trim: true,
    },
    contactName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
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
    timestamps: false, // We maintain explicit ISO strings matching existing API contracts
  }
);

// Compound index for role-based queries
UserSchema.index({ role: 1, email: 1 });

export const UserModel: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
