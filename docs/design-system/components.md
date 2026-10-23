# SurplusLabel Component Specifications

This document defines the visual, behavioral, and accessibility specifications for reusable UI components across SurplusLabel. All components must adhere strictly to these rules to ensure operational clarity, rapid interaction, and accessibility compliance.

---

## 1. Action Components (Buttons)

Buttons are the primary interactive triggers. They clearly reflect their hierarchy, provide continuous visual feedback, and enforce consistent padding and heights.

### 1.1 Button Variants

| Variant | Role & Usage | Visual Styling | Hover / Active / Focus States |
|---|---|---|---|
| **Primary** | Main workflow action: "Verify Label", "Confirm Donation", "Publish Listing" | Background: `var(--sl-color-primary-700)` (for universal 5.48:1 AA normal text contrast) or `var(--sl-color-primary-600)` (for large/bold text ≥14pt 600 weight)<br>Text: `var(--sl-color-on-primary)` (White)<br>Font Weight: `600` (Semi-bold)<br>Border: `none`<br>Radius: `var(--sl-radius-md)` | **Hover**: `var(--sl-color-primary-800)`<br>**Active**: `var(--sl-color-primary-900)` + `transform: scale(0.98)`<br>**Focus**: `outline: 2px solid var(--sl-color-primary-700); outline-offset: 2px` |
| **Secondary** | Supporting actions: "Save Draft", "Edit Details", "Filter Listings" | Background: `var(--sl-color-surface-card)`<br>Text: `var(--sl-color-text-secondary)`<br>Border: `1px solid var(--sl-color-border-default)`<br>Radius: `var(--sl-radius-md)` | **Hover**: `background: var(--sl-color-surface-subtle); border-color: var(--sl-color-border-hover)`<br>**Active**: `background: var(--sl-color-surface-hover)`<br>**Focus**: Standard 2px focus ring |
| **Tertiary (Ghost)** | Low-priority actions: "Cancel", "View Audit Log", "Skip" | Background: `transparent`<br>Text: `var(--sl-color-text-secondary)`<br>Border: `none`<br>Radius: `var(--sl-radius-md)` | **Hover**: `background: var(--sl-color-surface-subtle); color: var(--sl-color-text-primary)`<br>**Active**: `background: var(--sl-color-surface-hover)`<br>**Focus**: Standard 2px focus ring |
| **Destructive** | High-risk actions: "Delete Listing", "Cancel Pickup", "Reject Batch" | Background: `var(--sl-color-danger-50)`<br>Text: `var(--sl-color-danger-800)`<br>Border: `1px solid var(--sl-color-danger-200)`<br>Radius: `var(--sl-radius-md)` | **Hover**: `background: var(--sl-color-danger-600); color: var(--sl-color-on-danger)`<br>**Active**: `background: var(--sl-color-danger-700)`<br>**Focus**: `outline: 2px solid var(--sl-color-danger-600); outline-offset: 2px` |

### 1.2 Button Sizing & Touch Targets

| Size | Height | Padding X | Font Size / Weight | Icon Size | Minimum Touch Target |
|---|---|---|---|---|---|
| **Small (`sm`)** | `32px` | `12px` | `0.8125rem` (13px) / 500 | `14px` | Wrapped in 44px touch bounding box on mobile |
| **Medium (`md`)** | `40px` | `16px` | `0.875rem` (14px) / 600 | `16px` | 44px minimum via padding |
| **Large (`lg`)** | `48px` | `24px` | `1.0rem` (16px) / 600 | `18px` | Native 48px target (Exhibition & mobile primary) |

### 1.3 Button States
- **Disabled**: `opacity: var(--sl-disabled-opacity); cursor: not-allowed; pointer-events: none;`
- **Loading**: Replaces leading icon with a smooth CSS spinner (`w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin`); text changes to progressive state ("Verifying...", "Publishing..."). Button remains disabled during submission to prevent duplicate actions.

---

## 2. Form & Data Entry Controls

Form controls prioritize speed and legibility. Every form control must feature a persistent, accessible label and structured helper text.

### 2.1 Text Inputs & Search Fields
- **Container**: `height: 40px; padding: 0 12px; background: var(--sl-color-surface-card); border: 1px solid var(--sl-color-border-default); border-radius: var(--sl-radius-md); font-size: var(--sl-text-body-base); color: var(--sl-color-text-primary);`
- **Hover**: `border-color: var(--sl-color-border-hover);`
- **Focus**: `border-color: var(--sl-color-primary-600); outline: none; box-shadow: 0 0 0 3px var(--sl-color-focus-ring);`
- **Error State**: `border-color: var(--sl-color-danger-600); box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2);`
  - Error message placed below input in `var(--sl-color-danger-800)` with `aria-live="polite"` and linked via `aria-describedby`.
- **Search Variant**: Includes a leading `Search` icon (16px, `var(--sl-color-text-muted)`) and an optional trailing "Clear" button (`X` icon) that appears when text is entered.

### 2.2 Select & Dropdown Fields
- Native `<select>` on mobile devices for zero-friction system pickers.
- Custom accessible combobox on desktop featuring a right-aligned `ChevronDown` icon (16px). Dropdown menu panel uses `background: var(--sl-color-surface-elevated); border: 1px solid var(--sl-color-border-default); border-radius: var(--sl-radius-md); box-shadow: var(--sl-shadow-lg); z-index: 50;`.

### 2.3 Checkboxes & Toggles
- **Checkbox**: `width: 18px; height: 18px; border: 1.5px solid var(--sl-color-border-hover); border-radius: var(--sl-radius-xs);`
  - Checked: `background: var(--sl-color-primary-600); border-color: var(--sl-color-primary-600);` containing a white checkmark SVG.
  - Label: Placed to the right, separated by `8px`, vertically centered, clickable.
- **Segmented Toggle** (e.g. Dietary Filter: "All" | "Vegetarian" | "Non-Perishable"):
  - Container: `padding: 4px; background: var(--sl-color-surface-subtle); border-radius: var(--sl-radius-md); display: inline-flex;`
  - Active Segment: `background: var(--sl-color-surface-card); color: var(--sl-color-text-primary); box-shadow: var(--sl-shadow-sm); border-radius: var(--sl-radius-sm); font-weight: 600;`

---

## 3. Cards & Information Modules

Cards group related operational entities. SurplusLabel explicitly bans nested cards within cards.

### 3.1 KPI Stat Cards (Dashboard Overview)
- **Container**: `padding: var(--sl-space-5); background: var(--sl-color-surface-card); border: 1px solid var(--sl-color-border-default); border-radius: var(--sl-radius-lg); box-shadow: var(--sl-shadow-sm);`
- **Internal Hierarchy**:
  1. Top Row: Metric Label (`var(--sl-text-body-sm)`, `var(--sl-color-text-muted)`) + Domain Icon (20px, e.g. `PackageCheck`, `AlertCircle`, `Truck`).
  2. Central Value: Big Number (`2.0rem` / 32px, bold 700, `font-variant-numeric: tabular-nums`, `var(--sl-color-text-primary)`).
  3. Bottom Metadata: Contextual trend ("+14 listings today") or urgency breakdown.

### 3.2 Food Listing Item Card (Feed & Grid View)
- **Container**: `background: var(--sl-color-surface-card); border: 1px solid var(--sl-color-border-default); border-radius: var(--sl-radius-lg); overflow: hidden; display: flex; flex-direction: column;`
- **Header**: Food category icon + Title (`var(--sl-text-h4)`) + Urgency Badge (pinned top right).
- **Body Details**:
  - Expiry Date: Clock icon + Formatted Date with relative countdown (e.g., `Expires in 4 hrs`).
  - Quantity & Unit: e.g., `45 packs (12.5 kg)`.
  - Donor Location: Building name, room/bay, and hostel mess tag.
- **Footer**: Verification indicator ("✓ Verified by Mess Supervisor") + Primary Action Button ("Claim Donation" / "Coordinate Pickup").

---

## 4. Status Badges & Urgency Indicators

Urgency badges convey time sensitivity. Urgency is never communicated through color alone: every badge combines an **icon**, a **textual label**, and an **accessible color token**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        URGENCY BADGE MATRIX                            │
├───────────────┬───────────────────┬──────────────┬─────────────────────┤
│ Level         │ Icon (14px)       │ Label Text   │ Color Tokens        │
├───────────────┼───────────────────┼──────────────┼─────────────────────┤
│ Critical <6h  │ AlertTriangle     │ Urgent (<4h) │ Bg: #FEF2F2,        │
│               │                   │              │ Text: #991B1B,      │
│               │                   │              │ Border: #FECACA     │
├───────────────┼───────────────────┼──────────────┼─────────────────────┤
│ Impending <24h│ Clock             │ Today (<18h) │ Bg: #FFFBEB,        │
│               │                   │              │ Text: #92400E,      │
│               │                   │              │ Border: #FDE68A     │
├───────────────┼───────────────────┼──────────────┼─────────────────────┤
│ Stable >24h   │ ShieldCheck       │ Fresh (>24h) │ Bg: #ECFDF5,        │
│               │                   │              │ Text: #065F46,      │
│               │                   │              │ Border: #A7F3D0     │
└───────────────┴───────────────────┴──────────────┴─────────────────────┘
```

### 4.1 Pickup Logistics Pipeline Badges
Status flow for donation handovers:
1. `Available`: Neutral Slate Badge (`Bg: #F1F5F9; Text: #334155`)
2. `Claimed`: Info Blue Badge (`Bg: #EFF6FF; Text: #1E40AF; Icon: UserCheck`)
3. `Out for Pickup`: Warning Amber Badge (`Bg: #FFFBEB; Text: #92400E; Icon: Truck`)
4. `Completed / Received`: Success Emerald Badge (`Bg: #ECFDF5; Text: #065F46; Icon: CheckCheck`)

---

## 5. Food-Label Upload & OCR Verification Gateway

This is the core engineering feature of SurplusLabel. It bridges physical packaging with digital database entries.

### 5.1 File-Upload Dropzone
- **Container**: `border: 2px dashed var(--sl-color-border-hover); border-radius: var(--sl-radius-lg); background: var(--sl-color-bg-page); padding: var(--sl-space-8); text-align: center; cursor: pointer; transition: all 150ms ease;`
- **Active Drag State**: `border-color: var(--sl-color-primary-600); background: var(--sl-color-primary-50); transform: scale(1.005);`
- **Content**:
  - Center: Camera / Upload icon (32px, `var(--sl-color-primary-600)`).
  - Main prompt: "Drag label photo here or **browse files**".
  - Secondary info: "Supports PNG, JPG, WEBP up to 10MB. Clear shots of printed expiry dates yield best OCR accuracy."
  - Mobile action: Quick button "📸 Take Photo with Camera".

### 5.2 Verification Gateway (Side-by-Side Review)
On desktop screens (`≥1024px`), the verification gateway displays a balanced two-column comparison modal:
- **Left Column: Source Label Image**:
  - High-resolution preview with zoom/pan affordance.
  - OCR bounding box overlay: A semi-transparent box (`border: 2px solid var(--sl-color-info-600); background: rgba(37, 99, 235, 0.1)`) drawn around the detected date text ("EXP: 24/10/2026").
- **Right Column: Extracted Data Fields**:
  - Field 1: **Detected Expiry Date** (Pre-filled input, bold tabular font).
  - Field 2: **Confidence Rating**:
    - High Confidence (≥85%): Green pill `✓ High Match (92%)`
    - Medium Confidence (60–84%): Amber pill `⚠ Review Required (71%)`
    - Low / Manual (<60%): Red pill `✕ Unclear Scan - Enter Manually`
  - Field 3: Food Item Title & Category selector.
  - Field 4: Quantity & Package count.
- **Actions Footer**:
  - Primary button: "✓ Confirm & Verify Information"
  - Secondary button: "Retake Photo"
  - Tertiary button: "Edit All Fields Manually"

---

## 6. Data Tables & Listing Rows

Tables organize high-volume listings for hostel mess managers and food bank coordinators.

- **Table Header (`<thead>`)**:
  - Height: `44px`; Background: `var(--sl-color-surface-subtle)`; Text: `var(--sl-text-caption)`; Uppercase: `text-transform: uppercase; letter-spacing: 0.05em; color: var(--sl-color-text-muted);`
  - Interactive Sortable Headers: Include a subtle sort arrow (`ArrowUpDown` 14px) that rotates on active sort.
- **Table Rows (`<tbody> <tr>`)**:
  - Height: `56px`; Border bottom: `1px solid var(--sl-color-border-subtle);`
  - Hover State: `background: var(--sl-color-surface-subtle); transition: background 120ms ease;`
  - Critical Urgency Row Accent: Subtle 3px solid indicator on the left border: `border-left: 3px solid var(--sl-color-danger-600);`
- **Mobile Responsive Behavior**:
  - At viewport `<768px`, data tables collapse into stacked listing cards, preserving every field without horizontal overflow or clipped text.

---

## 7. Dialogs, Drawers & Toast Notifications

### 7.1 Modals & Dialogs
- **Backdrop Overlay**: `position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(2px); z-index: 100;`
- **Dialog Container**: `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90%; max-width: var(--sl-width-modal-max); background: var(--sl-color-surface-elevated); border: 1px solid var(--sl-color-border-default); border-radius: var(--sl-radius-xl); box-shadow: var(--sl-shadow-xl); padding: var(--sl-space-6); z-index: 101;`
- **Dismiss Control**: Top-right `X` icon button (`aria-label="Close dialog"`), plus keyboard `Escape` handler.

### 7.2 Toast Notifications
- **Position**: Fixed bottom-right on desktop (`bottom: 24px; right: 24px;`), top-center on mobile (`top: 16px; inset-x: 16px;`).
- **Container**: `min-width: 320px; max-width: 440px; padding: 12px 16px; background: var(--sl-color-surface-card); border: 1px solid var(--sl-color-border-default); border-radius: var(--sl-radius-lg); box-shadow: var(--sl-shadow-lg); display: flex; align-items: center; gap: 12px; z-index: 200;`
- **Variants**:
  - Success: Left green icon + "Listing published successfully."
  - Warning: Left amber icon + "OCR detected low lighting. Please confirm date."
  - Danger: Left red icon + "Pickup window has expired."

---

## 8. Skeletons, Empty States & Error Banners

### 8.1 Skeletons
- Used during async loading (fetching inventory, processing OCR).
- Appearance: `background: var(--sl-color-surface-subtle); border-radius: var(--sl-radius-sm);` with a gentle opacity pulse:
  ```css
  @keyframes sl-pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
  ```
- No infinite gradient sweeping under `prefers-reduced-motion`.

### 8.2 Empty States
- When a filter returns 0 items or no donations are active:
  - Center-aligned container: `padding: var(--sl-space-12) var(--sl-space-4); text-align: center;`
  - Empty illustration/icon: 48px vector icon in `var(--sl-color-text-disabled)` (e.g., `PackageOpen`).
  - Clear heading: "No active surplus listings in this category."
  - Actionable resolution: Primary button "Log New Surplus Food" or link "Reset Filters".

### 8.3 Error Banners
- Top-of-form error summary: `background: var(--sl-color-danger-50); border: 1px solid var(--sl-color-danger-200); border-radius: var(--sl-radius-md); padding: 12px 16px; color: var(--sl-color-danger-800); display: flex; gap: 12px; align-items: flex-start;`
- Role: `role="alert"` for instant screen-reader announcement.

---

## 9. Authentication & Role-Based Components

### 9.1 Auth Modal & Dialogs
- **Tabs (`role="tablist"`)**:
  - Two-state switcher ("Sign In" vs "Create Account") with high-contrast active indicator (`border-bottom: 2px solid var(--sl-color-primary-600); font-weight: 600;`).
- **Role Radio Cards (`role="radiogroup"`)**:
  - Distinct cards for `donor` ("Food Donor & Kitchen") and `recipient` ("Nonprofit & Community Shelter").
  - Hover & selected states: `border-color: var(--sl-color-primary-500); background: var(--sl-color-primary-50);`.
  - Accessible keyboard navigation (`ArrowLeft` / `ArrowRight` or Tab).
- **Password Visibility Toggle**:
  - Accessible icon button (`aria-label="Show password"` / `"Hide password"`, `tabindex="0"`) using `Eye` and `EyeOff` icons.
- **Demo Quick-Login Presets**:
  - 1-click test pills (`donor@greenmarket.org`, `rescue@foodpantry.org`, `admin@surpluslabel.org`) styled as subtle chips with role badges for effortless verification.

### 9.2 Organization Status Bar & Badges
- **Role Badges**:
  - Donor: `background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;`
  - Recipient: `background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe;`
  - Admin: `background: #fef3c7; color: #b45309; border: 1px solid #fde68a;`
- **Sensitive Field Masking**:
  - Redacted 4-digit PIN indicator (`••••`) for third-party visitors and unverified users with a security shield icon and hover tooltip explaining role ownership.

