# SurplusLabel Accessibility & Responsive Design Standards

This document establishes the accessibility (a11y) and responsive design standards for SurplusLabel. Conformance to **WCAG 2.2 Level AA** is a mandatory engineering requirement across all user interfaces.

Food rescue involves real-world kitchen environments, diverse community workers, mobile usage in storage basements, and high-stakes date verification. Accessibility and responsiveness ensure that no user is excluded and no critical food safety information is lost.

---

## 1. WCAG 2.2 AA Conformance Target

### 1.1 Contrast Thresholds (Mathematically Verified)

| Content Type | Minimum Ratio Required | SurplusLabel Token & Combination | Calculated Exact Ratio | Status |
|---|---|---|---|---|
| **Normal Body Text (<18pt regular)** | `4.5:1` | `--sl-color-text-primary` (`#0F172A`) on White (`#FFFFFF`) | **17.85:1** | **PASS (AAA)** |
| **Normal Secondary Text (<18pt regular)**| `4.5:1` | `--sl-color-text-secondary` (`#334155`) on White (`#FFFFFF`) | **10.35:1** | **PASS (AAA)** |
| **Normal Muted Text (<18pt regular)** | `4.5:1` | `--sl-color-text-muted` (`#64748B`) on White (`#FFFFFF`) | **4.76:1** | **PASS (AA)** |
| **Primary Button Text (Normal Text)** | `4.5:1` | White text (`#FFFFFF`) on `--sl-color-primary-700` (`#047857`) | **5.48:1** | **PASS (AA)** |
| **Primary Accent on White (Normal Text)**| `4.5:1` | `--sl-color-primary-700` (`#047857`) on White (`#FFFFFF`) | **5.48:1** | **PASS (AA)** |
| **Brand Primary on White (Large Text)** | `3.0:1` | `--sl-color-primary-600` (`#059669`) on White (`#FFFFFF`) (≥14pt bold) | **3.77:1** | **PASS (AA Large)** |
| **Display & Section Headings** | `3.0:1` | Display, H1, H2, and stat values (`#0F172A`) on White | **17.85:1** | **PASS (AAA)** |
| **UI Components & Graphical Objects** | `3.0:1` | Focus Ring (`#047857`) on White / Canvas | **5.48:1** / **5.24:1** | **PASS (AA)** |
| **Critical Urgency Badge Text** | `4.5:1` | Critical Text (`#991B1B`) on Subtle Bg (`#FEF2F2`) | **7.60:1** | **PASS (AAA)** |
| **Impending Urgency Badge Text** | `4.5:1` | Impending Text (`#92400E`) on Subtle Bg (`#FFFBEB`) | **6.84:1** | **PASS (AA)** |
| **Stable / Safe Badge Text** | `4.5:1` | Safe Text (`#065F46`) on Subtle Bg (`#ECFDF5`) | **7.29:1** | **PASS (AAA)** |
| **Info / Telemetry Badge Text** | `4.5:1` | Info Text (`#1E40AF`) on Subtle Bg (`#EFF6FF`) | **8.01:1** | **PASS (AAA)** |

*Important Note on SC 1.4.3 / 1.4.11:* `--sl-color-primary-600` (`#059669`) yields a contrast of `3.77:1` against white. It safely complies with WCAG AA for Large/Emphasized Text (≥18pt or ≥14pt bold) and non-text interactive components (≥3.0:1). For normal-weight body text or standard 14px regular labels requiring ≥4.5:1 contrast, `--sl-color-primary-700` (`#047857`, 5.48:1) is the required text token.

### 1.2 Multi-Cue Status Communication
*WCAG 1.4.1 (Use of Color): Color is never used as the sole method of conveying meaning, action, urgency, or verification.*

SurplusLabel enforces the **Triple-Cue Rule** for all status-driven information:
1. **Hue & Contrast**: Distinct background and text token (e.g. Red, Amber, Green).
2. **Distinct Vector Icon**: Specific SVG icon (e.g. `AlertTriangle` for critical urgency, `Clock` for impending expiry, `ShieldCheck` for verified safety).
3. **Explicit Text Label**: Clear, non-numerical text status (e.g. "Critical: Action required within 4 hours", "Verified by Donor").

---

## 2. Keyboard Navigation & Focus Management

### 2.1 Visible Keyboard Focus Indicator
- Standard focus style:
  ```css
  :focus-visible {
    outline: 2px solid var(--sl-color-primary-600);
    outline-offset: 2px;
    box-shadow: 0 0 0 4px var(--sl-color-focus-ring);
  }
  ```
- **Rules**:
  - Focus indicators are **never** suppressed using `outline: none` without providing an equal or higher contrast replacement.
  - Focus ring maintains at least a 3:1 contrast ratio against both the focused element and the adjacent background.

### 2.2 Tab Order & Logical Flow
- Tab sequence follows the natural reading order: Header → Navigation → Main Content Filters → List Items → Action Buttons.
- Modals, drawers, and inspection gateways implement strict **Focus Trapping**:
  - When a modal opens, focus moves immediately to the first interactive field (or the dialog container).
  - Pressing `Tab` cycles only within modal elements.
  - Pressing `Escape` closes the modal and returns focus to the trigger button that launched it.

### 2.3 Operational Shortcuts
- Date Verification Gateway:
  - `Enter`: Confirms verified label fields and advances to next item.
  - `Escape`: Cancels review and returns to inventory.
  - `Tab`: Steps through detected date, package count, and category fields.

---

## 3. Accessible Forms & Screen-Reader Feedback

### 3.1 Form Controls & Labeling
- Every input element possesses an explicitly linked `<label>`:
  ```html
  <label for="expiry-date-input" class="sl-label">
    Printed Expiry Date
    <span class="sl-required" aria-hidden="true">*</span>
  </label>
  <input
    id="expiry-date-input"
    type="date"
    required
    aria-required="true"
    aria-describedby="expiry-helper-text"
  />
  <span id="expiry-helper-text" class="sl-helper-text">
    As printed on the food packaging label.
  </span>
  ```
- Icon-only buttons (such as table action buttons, camera triggers, or modal dismissals) must declare an accessible label:
  ```html
  <button aria-label="Close verification dialog" class="sl-icon-btn">
    <svg aria-hidden="true">...</svg>
  </button>
  ```

### 3.2 Dynamic Announcements & Live Regions
- **OCR Progress**:
  ```html
  <div role="status" aria-live="polite" class="sl-sr-only">
    Analyzing label image. 85% complete.
  </div>
  ```
- **Error Summaries**:
  When a form fails validation or an upload is rejected, an alert banner at the top of the form receives `role="alert"` and keyboard focus:
  ```html
  <div role="alert" tabindex="-1" class="sl-error-banner">
    <h3>Please correct 2 fields before submitting:</h3>
    <ul>
      <li><a href="#expiry-date-input">Expiry date cannot be in the past</a></li>
    </ul>
  </div>
  ```

---

## 4. Mobile Usability & Touch Target Rules

### 4.1 Minimum Touch Target Dimensions
- **WCAG 2.2 Criterion 2.5.8 (Target Size - Minimum)**:
  All interactive targets (buttons, links, checkboxes, icon triggers) must have an interactive bounding box of at least **`44px × 44px`** on mobile screens (`<768px`).
- Where visual design calls for a smaller 32px button, CSS expands the clickable touch area:
  ```css
  .sl-touch-target {
    position: relative;
  }
  .sl-touch-target::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    min-width: 44px;
    min-height: 44px;
  }
  ```

### 4.2 Pinch-to-Zoom & Viewport Meta
- The mobile viewport meta tag must never disable user zooming:
  ```html
  <!-- Compliant: Allows users with low vision to magnify labels -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ```
  *(Prohibited: `user-scalable=no`, `maximum-scale=1.0`)*

---

## 5. Responsive Layout Architecture

SurplusLabel adapts gracefully across three primary device form factors:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      RESPONSIVE BREAKDOWN STRATEGY                     │
├─────────────────┬──────────────────────┬───────────────────────────────┤
│ Viewport        │ Navigation Model     │ Verification & Tables         │
├─────────────────┼──────────────────────┼───────────────────────────────┤
│ Desktop (≥1024) │ Expanded 260px Rail  │ Side-by-side OCR verification │
│                 │ Multi-column grid    │ Sortable data table           │
├─────────────────┼──────────────────────┼───────────────────────────────┤
│ Tablet (768-1023│ Collapsed 72px Rail  │ Stacked verification pane     │
│                 │ 2-column cards       │ Responsive scroll table       │
├─────────────────┼──────────────────────┼───────────────────────────────┤
│ Mobile (<768px) │ Top bar + Bottom nav │ Single-column cards           │
│                 │ Full-width cards     │ Bottom-sheet drawers          │
└─────────────────┴──────────────────────┴───────────────────────────────┘
```

### 5.1 Mobile (< 768px)
- **Navigation**: Persistent top bar with branding and active notification bell; fixed bottom navigation bar for quick access to *Feed*, *Scan Label*, and *My Listings*.
- **Listing View**: Full-width cards with large touch targets. Table views are converted into structured listing cards to prevent horizontal scrolling.
- **Verification Flow**: Vertical stack—top photo preview with zoom trigger, followed by extracted date form fields and large 48px "Verify" CTA at bottom.
- **Modals**: Converted into smooth slide-up bottom sheets with touch drag handles.

### 5.2 Tablet (768px – 1023px)
- **Navigation**: Collapsed sidebar rail (72px) displaying icon-only links with accessible tooltips on hover/focus.
- **Dashboard Grid**: Two-column responsive card layout (`repeat(auto-fit, minmax(320px, 1fr))`).
- **Data Tables**: Table format retained, with non-essential columns (such as batch Lot ID) hidden behind an expandable details row.

### 5.3 Desktop (≥ 1024px)
- **Navigation**: Full 260px sidebar with section groupings, donor profile summary, and quick status badges.
- **Verification Flow**: Balanced two-column split screen (Source label photo with detected bounding boxes on left, live validation form on right).
- **Dashboard Grid**: Three-to-four column grid layout with max-width constrained to `1440px` and centered page margins.
