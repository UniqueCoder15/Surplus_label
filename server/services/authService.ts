import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
  role: 'donor' | 'recipient'; // Admin cannot be registered via public API
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
  sub: string; // User ID
  email: string;
  role: UserRole;
  organizationName: string;
  contactName: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'server/data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const JWT_SECRET =
  process.env.JWT_SECRET || 'surpluslabel_secure_jwt_secret_key_2026_exhibition_f8a9e2d1';

// In-memory rate limiting for authentication attempts (IP/email)
interface RateLimitRecord {
  attempts: number;
  firstAttempt: number;
  blockedUntil?: number;
}

const loginRateLimits = new Map<string, RateLimitRecord>();

function getInitialDemoUsers(): User[] {
  const now = new Date().toISOString();
  // Password for all seeded demo users is: DemoPass123!
  const demoSalt = bcrypt.genSaltSync(10);
  const demoHash = bcrypt.hashSync('DemoPass123!', demoSalt);

  return [
    {
      id: 'usr_demo_donor_01',
      email: 'donor@greenmarket.org',
      passwordHash: demoHash,
      role: 'donor',
      organizationName: 'GreenMarket Community Co-op',
      contactName: 'Elena Rostova',
      phone: '+1 (555) 234-5678',
      address: 'Central Distribution Bay 3, Sector 4',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_demo_recipient_01',
      email: 'rescue@foodpantry.org',
      passwordHash: demoHash,
      role: 'recipient',
      organizationName: 'Hope Community Food Pantry',
      contactName: 'David Kalu',
      phone: '+1 (555) 876-5432',
      address: '742 Community Way, West District',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_demo_admin_01',
      email: 'admin@surpluslabel.org',
      passwordHash: demoHash,
      role: 'admin',
      organizationName: 'SurplusLabel Platform Oversight',
      contactName: 'System Administrator',
      phone: '+1 (555) 999-0000',
      address: 'SurplusLabel Operations Command Center',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

class AuthService {
  private inMemoryCache: User[] | null = null;

  constructor() {
    this.ensureDataFile();
  }

  private ensureDataFile(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (!fs.existsSync(USERS_FILE)) {
        const initial = getInitialDemoUsers();
        this.writeAtomic(initial);
        this.inMemoryCache = initial;
      }
    } catch (err) {
      console.error('[AuthService] Failed to initialize users file:', err);
    }
  }

  private readFromDisk(): User[] {
    try {
      if (!fs.existsSync(USERS_FILE)) {
        const initial = getInitialDemoUsers();
        this.writeAtomic(initial);
        return initial;
      }
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed: User[] = JSON.parse(raw);
      return parsed;
    } catch (err) {
      console.error('[AuthService] Error reading users from disk:', err);
      return this.inMemoryCache || getInitialDemoUsers();
    }
  }

  private writeAtomic(data: User[]): void {
    const tempFile = `${USERS_FILE}.tmp.${Date.now()}`;
    try {
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFile, USERS_FILE);
      this.inMemoryCache = data;
    } catch (err) {
      console.error('[AuthService] Atomic write failed:', err);
      if (fs.existsSync(tempFile)) {
        try {
          fs.unlinkSync(tempFile);
        } catch {}
      }
      throw new Error('Failed to persist user credentials.');
    }
  }

  /**
   * Normalize email to lowercase and trim whitespace
   */
  public normalizeEmail(email: string): string {
    return email ? email.trim().toLowerCase() : '';
  }

  /**
   * Validate email format
   */
  public isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength: min 8 chars, at least 1 letter and 1 number
   */
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

  /**
   * Check and record rate limits for login attempts
   */
  public checkRateLimit(key: string): { allowed: boolean; waitSeconds?: number } {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;

    const record = loginRateLimits.get(key);
    if (!record) {
      return { allowed: true };
    }

    if (record.blockedUntil && record.blockedUntil > now) {
      const waitSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      return { allowed: false, waitSeconds };
    }

    // Reset if window has elapsed
    if (now - record.firstAttempt > windowMs) {
      loginRateLimits.delete(key);
      return { allowed: true };
    }

    if (record.attempts >= maxAttempts) {
      record.blockedUntil = now + 15 * 60 * 1000; // Block for 15 minutes
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

  /**
   * Strips password hash for safe API responses
   */
  public toSafeUser(user: User): SafeUser {
    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  /**
   * Generate JWT Token for authenticated session
   */
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

  /**
   * Verify and decode a JWT Token
   */
  public verifyToken(token: string): AuthTokenPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Register a new user account with role validation and duplicate protection
   */
  public async register(input: RegisterInput): Promise<{ user: SafeUser; token: string }> {
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

    // ROLE ESCALATION PROTECTION: Admin role cannot be granted via public registration
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

    const users = this.readFromDisk();
    const existing = users.find((u) => u.email === email);
    if (existing) {
      const err: any = new Error(`An account with email "${email}" already exists.`);
      err.status = 409;
      throw err;
    }

    // Hash password with bcrypt
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

    users.push(newUser);
    this.writeAtomic(users);

    const safeUser = this.toSafeUser(newUser);
    const token = this.generateToken(newUser);

    return { user: safeUser, token };
  }

  /**
   * Authenticate user credentials and issue signed token
   */
  public async login(
    input: LoginInput,
    clientIp = 'unknown'
  ): Promise<{ user: SafeUser; token: string }> {
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

    const users = this.readFromDisk();
    const user = users.find((u) => u.email === email);

    if (!user) {
      this.recordFailedAttempt(rateLimitKey);
      const err: any = new Error('Invalid email or password.');
      err.status = 401;
      throw err;
    }

    const passwordsMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordsMatch) {
      this.recordFailedAttempt(rateLimitKey);
      const err: any = new Error('Invalid email or password.');
      err.status = 401;
      throw err;
    }

    // Reset rate limits on successful authentication
    this.resetRateLimit(rateLimitKey);

    const safeUser = this.toSafeUser(user);
    const token = this.generateToken(user);

    return { user: safeUser, token };
  }

  /**
   * Find user by ID
   */
  public findById(id: string): SafeUser | null {
    const users = this.readFromDisk();
    const user = users.find((u) => u.id === id);
    if (!user) return null;
    return this.toSafeUser(user);
  }

  /**
   * Find user by Email
   */
  public findByEmail(email: string): SafeUser | null {
    const normalized = this.normalizeEmail(email);
    const users = this.readFromDisk();
    const user = users.find((u) => u.email === normalized);
    if (!user) return null;
    return this.toSafeUser(user);
  }

  /**
   * Reset user store to clean demo seed
   */
  public resetToDemo(): void {
    const initial = getInitialDemoUsers();
    this.writeAtomic(initial);
    loginRateLimits.clear();
  }
}

export const authService = new AuthService();
