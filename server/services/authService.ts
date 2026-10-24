import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { isMongoConnected } from '../db/connection';
import { UserModel } from '../models/User';
import { getInitialDemoUsers } from '../data/demoSeed';

export type UserRole = 'donor' | 'recipient' | 'admin';

export interface User {
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

export type SafeUser = Omit<User, 'passwordHash'>;

export interface RegisterInput {
  email: string;
  password: string;
  role: 'donor' | 'recipient';
  organizationName: string;
  contactName: string;
  phone?: string;
  address?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  organizationName: string;
  contactName: string;
}

const JWT_SECRET =
  process.env.JWT_SECRET || 'surpluslabel_secure_jwt_secret_key_2026_exhibition_f8a9e2d1';

interface RateLimitRecord {
  attempts: number;
  firstAttempt: number;
  blockedUntil?: number;
}

const loginRateLimits = new Map<string, RateLimitRecord>();

function assertDatabaseConnected(): void {
  if (!isMongoConnected()) {
    const err: any = new Error(
      'Database is not connected. Set MONGODB_URI to a valid MongoDB Atlas connection string.'
    );
    err.status = 503;
    throw err;
  }
}

function userFromDocument(doc: {
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
}): User {
  return {
    id: doc.id,
    email: doc.email,
    passwordHash: doc.passwordHash,
    role: doc.role,
    organizationName: doc.organizationName,
    contactName: doc.contactName,
    phone: doc.phone,
    address: doc.address,
    isDemo: doc.isDemo,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function isDuplicateKeyError(err: unknown): boolean {
  return Boolean(err && typeof err === 'object' && (err as { code?: number }).code === 11000);
}

class AuthService {
  public normalizeEmail(email: string): string {
    return email ? email.trim().toLowerCase() : '';
  }

  public isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public validatePassword(password: string): { valid: boolean; message?: string } {
    if (!password || typeof password !== 'string') {
      return { valid: false, message: 'Password is required.' };
    }
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long.' };
    }
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      return {
        valid: false,
        message: 'Password must contain at least one letter and one number.',
      };
    }
    return { valid: true };
  }

  public checkRateLimit(key: string): { allowed: boolean; waitSeconds?: number } {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const maxAttempts = 5;

    const record = loginRateLimits.get(key);
    if (!record) {
      return { allowed: true };
    }

    if (record.blockedUntil && record.blockedUntil > now) {
      const waitSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      return { allowed: false, waitSeconds };
    }

    if (now - record.firstAttempt > windowMs) {
      loginRateLimits.delete(key);
      return { allowed: true };
    }

    if (record.attempts >= maxAttempts) {
      record.blockedUntil = now + 15 * 60 * 1000;
      return { allowed: false, waitSeconds: 900 };
    }

    return { allowed: true };
  }

  public recordFailedAttempt(key: string): void {
    const now = Date.now();
    const record = loginRateLimits.get(key) || { attempts: 0, firstAttempt: now };
    record.attempts += 1;
    loginRateLimits.set(key, record);
  }

  public resetRateLimit(key: string): void {
    loginRateLimits.delete(key);
  }

  public toSafeUser(user: User): SafeUser {
    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  public generateToken(user: User | SafeUser): string {
    const payload: AuthTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationName: user.organizationName,
      contactName: user.contactName,
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  }

  public verifyToken(token: string): AuthTokenPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
      return decoded;
    } catch {
      return null;
    }
  }

  public async register(input: RegisterInput): Promise<{ user: SafeUser; token: string }> {
    assertDatabaseConnected();

    const email = this.normalizeEmail(input.email);

    if (!email || !this.isValidEmail(email)) {
      const err: any = new Error('Please provide a valid email address.');
      err.status = 400;
      throw err;
    }

    const passwordCheck = this.validatePassword(input.password);
    if (!passwordCheck.valid) {
      const err: any = new Error(passwordCheck.message);
      err.status = 400;
      throw err;
    }

    if (input.role === ('admin' as any)) {
      const err: any = new Error('Public registration cannot grant administrative privileges.');
      err.status = 403;
      throw err;
    }

    if (input.role !== 'donor' && input.role !== 'recipient') {
      const err: any = new Error('Invalid account role. Must be either "donor" or "recipient".');
      err.status = 400;
      throw err;
    }

    if (!input.organizationName || !input.organizationName.trim()) {
      const err: any = new Error('Organization name is required.');
      err.status = 400;
      throw err;
    }

    if (!input.contactName || !input.contactName.trim()) {
      const err: any = new Error('Contact person name is required.');
      err.status = 400;
      throw err;
    }

    const existing = await UserModel.findOne({ email }).lean();
    if (existing) {
      const err: any = new Error(`An account with email "${email}" already exists.`);
      err.status = 409;
      throw err;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const now = new Date().toISOString();
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newUser: User = {
      id,
      email,
      passwordHash,
      role: input.role,
      organizationName: input.organizationName.trim(),
      contactName: input.contactName.trim(),
      phone: input.phone?.trim(),
      address: input.address?.trim(),
      isDemo: false,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await UserModel.create(newUser);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        const dupErr: any = new Error(`An account with email "${email}" already exists.`);
        dupErr.status = 409;
        throw dupErr;
      }
      throw err;
    }

    const safeUser = this.toSafeUser(newUser);
    const token = this.generateToken(newUser);

    return { user: safeUser, token };
  }

  public async login(
    input: LoginInput,
    clientIp = 'unknown'
  ): Promise<{ user: SafeUser; token: string }> {
    assertDatabaseConnected();

    const email = this.normalizeEmail(input.email);
    const rateLimitKey = `${clientIp}:::${email}`;

    const limitCheck = this.checkRateLimit(rateLimitKey);
    if (!limitCheck.allowed) {
      const err: any = new Error(
        `Too many consecutive failed login attempts. Please wait ${limitCheck.waitSeconds} seconds before trying again.`
      );
      err.status = 429;
      throw err;
    }

    if (!email || !input.password) {
      this.recordFailedAttempt(rateLimitKey);
      const err: any = new Error('Both email and password are required.');
      err.status = 400;
      throw err;
    }

    const doc = await UserModel.findOne({ email }).lean();
    if (!doc) {
      this.recordFailedAttempt(rateLimitKey);
      const err: any = new Error('Invalid email or password.');
      err.status = 401;
      throw err;
    }

    const user = userFromDocument(doc as User);
    const passwordsMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordsMatch) {
      this.recordFailedAttempt(rateLimitKey);
      const err: any = new Error('Invalid email or password.');
      err.status = 401;
      throw err;
    }

    this.resetRateLimit(rateLimitKey);

    const safeUser = this.toSafeUser(user);
    const token = this.generateToken(user);

    return { user: safeUser, token };
  }

  public async findById(id: string): Promise<SafeUser | null> {
    if (!isMongoConnected()) {
      return null;
    }
    const doc = await UserModel.findOne({ id }).lean();
    if (!doc) return null;
    return this.toSafeUser(userFromDocument(doc as User));
  }

  public async findByEmail(email: string): Promise<SafeUser | null> {
    if (!isMongoConnected()) {
      return null;
    }
    const normalized = this.normalizeEmail(email);
    const doc = await UserModel.findOne({ email: normalized }).lean();
    if (!doc) return null;
    return this.toSafeUser(userFromDocument(doc as User));
  }

  /**
   * Replace all users with the canonical demo account set (for tests and explicit demo reset).
   */
  public async resetToDemo(): Promise<void> {
    assertDatabaseConnected();
    await UserModel.deleteMany({});
    const initial = getInitialDemoUsers();
    await UserModel.insertMany(initial);
    loginRateLimits.clear();
  }
}

export const authService = new AuthService();
