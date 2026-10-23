# AGENTX 2026 Exhibition Demo Runbook

This runbook provides a step-by-step presentation script for showcasing SurplusLabel at the AGENTX 2026 conference and exhibition. The walkthrough demonstrates the end-to-end lifecycle across the three core user personas: **Donor**, **Recipient**, and **Coordinator**.

---

## 1. Pre-Exhibition Setup & Verification

Before the live booth demonstration or stage presentation:

1. **Verify Services**:
   ```bash
   # Check backend health
   curl -s http://127.0.0.1:4000/api/health | jq .
   ```
2. **Reset Seed Dataset to Clean Initial State**:
   ```bash
   # Reset all listings to pristine demo state
   curl -s -X POST http://127.0.0.1:4000/api/listings/reset-demo | jq .metrics
   ```
3. **Open the Application**:
   Navigate in your browser to `http://localhost:5173` (or the deployed production domain).
4. **Locate the Reference Screen Switcher**:
   Notice the floating pill at the bottom of the viewport (`Reference Screens`), which allows instant navigation between any of the 10 production screens during the talk.

---

## 2. Seed Data & Persona Credentials

The platform includes seeded accounts for instantaneous demo sign-in:

| Persona | Organization | Email | Password | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Donor** | GreenMarket Community Co-op | `donor@greenmarket.org` | `DemoPass123!` | `donor` |
| **Recipient** | Hope Community Food Pantry | `rescue@foodpantry.org` | `DemoPass123!` | `recipient` |
| **Coordinator** | SurplusLabel Platform Oversight | `admin@surpluslabel.org` | `DemoPass123!` | `admin` |

*Quick Demo Login:* The sign-in modal features one-click demo persona buttons to sign in instantly without typing passwords.

---

## 3. Rehearsed 5-Minute Demonstration Script

### Scene 1: The Problem & The Solution (1 Minute)
- **Target Screen**: Landing Page (`#/landing`)
- **Key Talking Points**:
  - Millions of tons of packaged food are discarded annually because printed dates are difficult to track or misunderstood.
  - SurplusLabel solves this with:
    1. OCR-assisted packaging date extraction.
    2. Mandatory human-in-the-loop supervisor verification.
    3. Dynamic calendar-day urgency prioritization.
    4. Secure 4-digit PIN handover coordination.
- **Action**: Scroll smoothly through the Hero section, feature highlights, and the live metrics counter.

---

### Scene 2: Donor Workflow — Adding a Food Listing with OCR (1.5 Minutes)
- **Target Screen**: Add Food Listing (`#/add-food`)
- **Key Talking Points**:
  - Donors photograph surplus food packaging labels.
  - The Tesseract.js engine processes the label on the server, extracting batch text and candidate dates.
  - *Critical Safety Principle*: We never treat OCR as food-safety certification. The system requires an authorized supervisor to explicitly verify the date and classification.
- **Action Steps**:
  1. Click **"Add Food Listing"** or navigate to `#/add-food`.
  2. In the Image Uploader, select or drop `public/sample-food-label-crisp.jpg`.
  3. Click **"Analyze Food Label (OCR)"**.
  4. Show the extracted candidate dates (`MFD: 15/04/2026`, `EXP: 28/11/2026`, `BEST BEFORE: 24/11/2026`).
  5. Select the **Expiry Date (28 Nov 2026)** candidate.
  6. Fill in title: `Organic Whole Rolled Oats 1kg`, Quantity: `30 packs`, Category: `Pantry Grains`.
  7. Check the mandatory audit box: **"I have inspected this packaging and manually verified the printed date."**
  8. Enter supervisor name: `Elena Rostova (Kitchen Lead)`.
  9. Click **"Publish Food Listing"**. Show the listing saved with verified urgency badge.

---

### Scene 3: Recipient Workflow — Browsing & Reserving Food (1.5 Minutes)
- **Target Screen**: Browse Surplus Food (`#/browse`) & Listing Details (`#/details`)
- **Key Talking Points**:
  - Community kitchens and food shelters see inventory sorted by real-time urgency so items closest to expiration are rescued first.
  - Conflicting double-claims are strictly prevented at the database layer with HTTP 409 Conflict locks.
- **Action Steps**:
  1. Navigate to **"Browse Food"** (`#/browse`).
  2. Filter by category or search `Oats`.
  3. Click on the listing card to open the **Listing Details Screen** (`#/details`).
  4. Review packaging notes, storage condition (`cool_dry`), and verified date badge.
  5. Click **"Request Pickup"** to open the **Claim Donation Modal**.
  6. Note pre-filled recipient organization (`Hope Community Food Pantry`).
  7. Check the transport condition confirmation checkbox: *"Our organization agrees to collect this food within the stated window and maintain the necessary storage conditions."*
  8. Click **"Confirm Reservation"**.
  9. **The Reveal**: Show the instant transition to the **Donation Reservation Confirmed** screen displaying the generated **4-digit Collection Verification PIN** (e.g. `4590`).
  10. Demonstrate the **"Copy PIN"** action.
  11. Click **"Done — View in Recipient Dashboard"** to transition to the Recipient Dashboard (`#/recipient`).

---

### Scene 4: Coordinator & Handover Workflow (1 Minute)
- **Target Screen**: Coordinator Command Center (`#/coordinator`)
- **Key Talking Points**:
  - The 4-digit PIN is strictly confidential: masked (`••••`) for third-party viewers, but revealed only to the claiming recipient and the donor owner.
  - The donor supervisor verifies the PIN at the physical loading dock before handing over the food crates.
  - The status transitions to `collected`, permanently recording the audit trail.
- **Action Steps**:
  1. Open the **Coordinator Dashboard** (`#/coordinator`).
  2. Show the active claim pipeline, category distribution charts, and urgency breakdown.
  3. Sign in as Donor (`donor@greenmarket.org`) and mark the item as `Collected` after verifying the recipient's PIN.
  4. Show that the listing transitions to `Collected` and can no longer be claimed.

---

## 4. Resetting for the Next Demo

To reset the database between demo presentations:
```bash
curl -s -X POST http://127.0.0.1:4000/api/listings/reset-demo
```
Or click the reset button on the Coordinator Dashboard screen.
