import { Router, Request, Response } from 'express';
import { listingStore, ListingFilters, FoodCategory, StorageCondition, ListingStatus } from '../services/listingStore';
import { DateType } from '../services/dateParser';
import { authenticate, requireAuth, requireRole } from '../middleware/auth';

const router = Router();

/**
 * GET /api/listings
 * Fetch food listings with search, category, status, urgency filters, and summary metrics.
 * Sanitizes sensitive handover details (PIN, recipient phone/notes) unless user is authorized.
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const filters: ListingFilters = {
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      category: typeof req.query.category === 'string' ? req.query.category : undefined,
      urgency: typeof req.query.urgency === 'string' ? req.query.urgency : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      sortBy: (typeof req.query.sortBy === 'string' ? req.query.sortBy : undefined) as any,
    };

    const result = await listingStore.getAll(filters, req.user);

    res.json({
      success: true,
      data: result.listings,
      metrics: result.metrics,
      count: result.listings.length,
    });
  } catch (err: any) {
    console.error('[Listings API] GET / error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to retrieve food inventory listings.',
    });
  }
});

/**
 * GET /api/listings/:id
 * Retrieve details for a single food listing with sensitive data scrubbing.
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const listing = await listingStore.getById(id, req.user);

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: `Food listing with ID "${id}" was not found.`,
      });
    }

    res.json({
      success: true,
      data: listing,
    });
  } catch (err: any) {
    console.error(`[Listings API] GET /:id error:`, err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to retrieve listing details.',
    });
  }
});

/**
 * POST /api/listings
 * Create a new verified food listing.
 * Protected: Requires authentication as 'donor' or 'admin'.
 * Strict requirement: human supervisor verification sign-off is mandatory.
 */
router.post('/', requireAuth, requireRole('donor', 'admin'), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const {
      title,
      category,
      quantity,
      unit,
      storageCondition,
      handlingNotes,
      donorOrg,
      pickupLocation,
      contactPhone,
      imageUrl,
      imagePublicId,
      relevantDate,
      dateType,
      manufacturingDate,
      expiryDate,
      batchNumber,
      isManuallyConfirmed,
      verifiedBy,
      rawOcrText,
      ocrConfidence,
    } = req.body;

    // Strict validation
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Title is required.',
      });
    }

    const validCategories: FoodCategory[] = [
      'dairy',
      'bakery',
      'produce',
      'pantry_grains',
      'canned_packaged',
      'prepared_meals',
      'beverages',
      'other',
    ];
    if (!category || !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid food category. Must be one of: ${validCategories.join(', ')}`,
      });
    }

    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be a positive number greater than 0.',
      });
    }

    if (!unit || typeof unit !== 'string' || !unit.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Quantity unit is required (e.g. kg, packs, loaves, cartons).',
      });
    }

    const validStorage: StorageCondition[] = ['ambient', 'chilled', 'frozen', 'cool_dry'];
    if (storageCondition && !validStorage.includes(storageCondition)) {
      return res.status(400).json({
        success: false,
        error: `Invalid storage condition. Must be one of: ${validStorage.join(', ')}`,
      });
    }

    const finalDonorOrg = (donorOrg && typeof donorOrg === 'string' && donorOrg.trim()) 
      ? donorOrg.trim() 
      : user.organizationName;

    if (!finalDonorOrg) {
      return res.status(400).json({
        success: false,
        error: 'Donor organization name is required.',
      });
    }

    if (!pickupLocation || typeof pickupLocation !== 'string' || !pickupLocation.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Pickup location address is required.',
      });
    }

    if (!relevantDate || typeof relevantDate !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Relevant packaging date (YYYY-MM-DD) is required.',
      });
    }

    const validDateTypes: DateType[] = [
      'expiry',
      'use_by',
      'best_before',
      'manufacturing',
      'packaging',
    ];
    if (!dateType || !validDateTypes.includes(dateType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid date type. Must be one of: ${validDateTypes.join(', ')}`,
      });
    }

    // MANDATORY HUMAN VERIFICATION GATE
    if (isManuallyConfirmed !== true) {
      return res.status(400).json({
        success: false,
        error:
          'Explicit human confirmation is mandatory. OCR results must not be treated as verified without supervisor sign-off.',
      });
    }

    if (!verifiedBy || typeof verifiedBy !== 'string' || !verifiedBy.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Supervisor verifier signature / name is required.',
      });
    }

    const created = await listingStore.create(
      {
        donorUserId: user.id,
        title: title.trim(),
        category,
        quantity: numQuantity,
        unit: unit.trim(),
        storageCondition: storageCondition || 'ambient',
        handlingNotes: handlingNotes ? String(handlingNotes).trim() : undefined,
        donorOrg: finalDonorOrg,
        pickupLocation: pickupLocation.trim(),
        contactPhone: contactPhone ? String(contactPhone).trim() : user.phone,
        imageUrl: imageUrl ? String(imageUrl).trim() : undefined,
        imagePublicId: imagePublicId ? String(imagePublicId).trim() : undefined,
        relevantDate: relevantDate.trim(),
        dateType,
        manufacturingDate: manufacturingDate ? String(manufacturingDate).trim() : undefined,
        expiryDate: expiryDate ? String(expiryDate).trim() : undefined,
        batchNumber: batchNumber ? String(batchNumber).trim() : undefined,
        isManuallyConfirmed: true,
        verifiedBy: verifiedBy.trim(),
        rawOcrText: rawOcrText ? String(rawOcrText) : undefined,
        ocrConfidence: typeof ocrConfidence === 'number' ? ocrConfidence : undefined,
      },
      user
    );

    res.status(201).json({
      success: true,
      message: 'Food listing registered successfully with verified date audit trail.',
      data: created,
    });
  } catch (err: any) {
    console.error('[Listings API] POST / error:', err);
    res.status(err.status || 400).json({
      success: false,
      error: err.message || 'Failed to create food listing.',
    });
  }
});

/**
 * PATCH /api/listings/:id/claim
 * Reserve an available listing for a recipient organization.
 * Protected: Requires authentication as 'recipient' or 'admin'.
 * Prevents conflicting claims (HTTP 409 Conflict if not currently available).
 */
router.patch('/:id/claim', requireAuth, requireRole('recipient', 'admin'), async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const user = req.user!;
    const {
      recipientOrg,
      contactName,
      contactPhone,
      contactEmail,
      pickupWindowStart,
      pickupWindowEnd,
      notes,
    } = req.body;

    const finalRecipientOrg = (recipientOrg && typeof recipientOrg === 'string' && recipientOrg.trim())
      ? recipientOrg.trim()
      : user.organizationName;

    if (!finalRecipientOrg) {
      return res.status(400).json({
        success: false,
        error: 'Recipient organization name is required.',
      });
    }

    const finalContactName = (contactName && typeof contactName === 'string' && contactName.trim())
      ? contactName.trim()
      : user.contactName;

    if (!finalContactName) {
      return res.status(400).json({
        success: false,
        error: 'Recipient contact person name is required.',
      });
    }

    const finalContactPhone = (contactPhone && typeof contactPhone === 'string' && contactPhone.trim())
      ? contactPhone.trim()
      : user.phone;

    if (!finalContactPhone) {
      return res.status(400).json({
        success: false,
        error: 'Recipient contact telephone number is required.',
      });
    }

    if (!pickupWindowStart || !pickupWindowEnd) {
      return res.status(400).json({
        success: false,
        error: 'Pickup window start and end times are required.',
      });
    }

    const claimed = await listingStore.claim(
      id,
      {
        recipientUserId: user.id,
        recipientOrg: finalRecipientOrg,
        contactName: finalContactName,
        contactPhone: finalContactPhone,
        contactEmail: contactEmail ? String(contactEmail).trim() : user.email,
        pickupWindowStart: String(pickupWindowStart),
        pickupWindowEnd: String(pickupWindowEnd),
        notes: notes ? String(notes).trim() : undefined,
      },
      user
    );

    res.json({
      success: true,
      message: 'Listing successfully reserved. Handover PIN generated.',
      data: claimed,
    });
  } catch (err: any) {
    console.error(`[Listings API] PATCH /:id/claim error:`, err);
    res.status(err.status || 400).json({
      success: false,
      error: err.message || 'Failed to reserve food listing.',
    });
  }
});

/**
 * PATCH /api/listings/:id/status
 * Transition listing status (available, claimed, collected, cancelled).
 * Protected: Requires authentication. Enforces donor ownership / recipient claim release / admin.
 */
router.patch('/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { status, notes } = req.body;

    const validStatuses: ListingStatus[] = ['available', 'claimed', 'collected', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const updated = await listingStore.updateStatus(id, status, req.user, notes);

    res.json({
      success: true,
      message: `Listing status updated to "${status}".`,
      data: updated,
    });
  } catch (err: any) {
    console.error(`[Listings API] PATCH /:id/status error:`, err);
    res.status(err.status || 400).json({
      success: false,
      error: err.message || 'Failed to update listing status.',
    });
  }
});

/**
 * POST /api/listings/reset-demo
 * Reset data file to default clearly labeled demo entries (for test suites and demos).
 */
router.post('/reset-demo', async (_req: Request, res: Response) => {
  try {
    await listingStore.resetToDemo();
    const result = await listingStore.getAll();
    res.json({
      success: true,
      message: 'Listings reset to initial demo dataset.',
      data: result.listings,
      metrics: result.metrics,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to reset demo listings.',
    });
  }
});

export default router;
