import bcrypt from 'bcryptjs';
import { DateType } from '../services/dateParser';

export type UserRole = 'donor' | 'recipient' | 'admin';

export interface DemoUserSeed {
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

type FoodCategory =
  | 'dairy'
  | 'bakery'
  | 'produce'
  | 'pantry_grains'
  | 'canned_packaged'
  | 'prepared_meals'
  | 'beverages'
  | 'other';

type StorageCondition = 'ambient' | 'chilled' | 'frozen' | 'cool_dry';
type ListingStatus = 'available' | 'claimed' | 'collected' | 'cancelled';

interface ClaimDetails {
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

export type DemoListingSeed = {
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
  status: ListingStatus;
  claim?: ClaimDetails;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
};

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
export function getInitialDemoListings(): DemoListingSeed[] {
  const now = new Date().toISOString();

  const demoItems: DemoListingSeed[] = [
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

  return demoItems.map((item) => item as DemoListingSeed);
}



export function getInitialDemoUsers(): DemoUserSeed[] {
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


