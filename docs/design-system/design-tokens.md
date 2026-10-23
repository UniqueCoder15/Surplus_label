# SurplusLabel Design Tokens

This document specifies the foundational design tokens for SurplusLabel. All application styles, components, and layout utilities must reference these tokens directly to maintain absolute visual and functional consistency.

Tokens follow the naming prefix `--sl-` (*SurplusLabel*).

---

## 1. Color Palette & Semantics

### 1.1 Brand Primary (Emerald Scale)
The primary emerald hue represents fresh, safe food recovery, trust, and environmental stewardship.

| Token | Hex | Role & Usage | Contrast vs White (#FFFFFF) |
|---|---|---|---|
| `--sl-color-primary-50` | `#ECFDF5` | Subtle badge backgrounds, verified item row tint | N/A (Surface) |
| `--sl-color-primary-100` | `#D1FAE5` | Active filter chip backgrounds, dropzone active hover | N/A (Surface) |
| `--sl-color-primary-200` | `#A7F3D0` | Subtle verified borders, active selection outlines | N/A (Border) |
| `--sl-color-primary-500` | `#10B981` | Secondary brand accents, toggle active fill | 2.53:1 (Non-text decorative) |
| `--sl-color-primary-600` | `#059669` | **Core Brand Primary**: Primary buttons, key indicators | **3.77:1** (AA Large Text ≥14pt bold & UI Components) |
| `--sl-color-primary-700` | `#047857` | Primary button fill for normal text, pressed states | **5.48:1** (AA Normal Text ≥4.5:1) |
| `--sl-color-primary-800` | `#065F46` | High-contrast verified text on light backgrounds | **7.68:1** (AAA Normal Text ≥7:1) |
| `--sl-color-primary-900` | `#064E3B` | Deep brand headers, high-emphasis text | **9.72:1** (AAA Normal Text) |
| `--sl-color-on-primary` | `#FFFFFF` | Text on `--sl-color-primary-700` (`#047857`) | **5.48:1** (AA Normal Text) |
| `--sl-color-on-primary-bold` | `#FFFFFF` | Bold text (≥14pt / 600) on `--sl-color-primary-600` | **3.77:1** (AA Large Text) |

### 1.2 Secondary Brand (Deep Structural Teal)
Used for operational anchors, sidebar backgrounds, active navigation indicators, and institutional metadata.

| Token | Hex | Role & Usage | Contrast vs White (#FFFFFF) |
|---|---|---|---|
| `--sl-color-secondary-50` | `#F0FDFA` | Secondary alert background, subtle table head tint | Surface |
| `--sl-color-secondary-100` | `#CCFBF1` | Secondary tag background, donor category tint | Surface |
| `--sl-color-secondary-200` | `#99F6E4` | Secondary borders, divider accents | Border |
| `--sl-color-secondary-600` | `#0D9488` | Active secondary tabs, UI icons | **3.74:1** (AA Large Text & UI Components) |
| `--sl-color-secondary-700` | `#0F766E` | **Core Secondary**: Navigation rail icons, headings, text | **5.47:1** (AA Normal Text ≥4.5:1) |
| `--sl-color-secondary-800` | `#115E59` | Secondary hover, dark mode structural ground | **7.58:1** (AAA Normal Text) |
| `--sl-color-on-secondary` | `#FFFFFF` | Text and icons placed on `--sl-color-secondary-700` | **5.47:1** (AA Normal Text) |

### 1.3 Urgency & Operational Status Scales
Urgency triage is the core operational function of SurplusLabel. Urgency levels must be instantly identifiable, visually distinct from brand emerald, and always paired with textual labels and icons.

#### Critical Urgency: Expiry in < 6 Hours / Danger
Used for food items that must be dispatched immediately to prevent wastage, safety recalls, and error states.

| Token | Hex | Role & Usage | Contrast Ratio |
|---|---|---|---|
| `--sl-color-danger-50` | `#FEF2F2` | Critical urgency card background, error banner tint | Surface |
| `--sl-color-danger-100` | `#FEE2E2` | Critical badge background | Surface |
| `--sl-color-danger-200` | `#FECACA` | Critical card border, error input border | Border |
| `--sl-color-danger-600` | `#DC2626` | **Core Critical Indicator**: Danger icons, countdown ring | **4.83:1** vs White (AA Normal Text) |
| `--sl-color-danger-700` | `#B91C1C` | Critical button hover, error heading | **6.47:1** vs White (AA / AAA Large) |
| `--sl-color-danger-800` | `#991B1B` | Critical badge text on `#FEF2F2` background | **7.60:1** vs `#FEF2F2` (AAA Normal Text) |
| `--sl-color-on-danger` | `#FFFFFF` | Text and icons placed on `--sl-color-danger-600` | **4.83:1** (AA Normal Text) |

#### Impending Urgency: Expiry in < 24 Hours / Warning
Used for food items requiring scheduled collection within the day, unverified OCR fields, and warnings.

| Token | Hex | Role & Usage | Contrast Ratio |
|---|---|---|---|
| `--sl-color-warning-50` | `#FFFBEB` | Warning card background, impending badge bg | Surface |
| `--sl-color-warning-100` | `#FEF3C7` | Active warning tag tint | Surface |
| `--sl-color-warning-200` | `#FDE68A` | Warning card border, review required border | Border |
| `--sl-color-warning-600` | `#D97706` | **Core Warning Indicator**: Urgency clocks, alert icons | **3.19:1** vs White (UI Components ≥3:1) |
| `--sl-color-warning-700` | `#B45309` | Warning text on white ground, high-visibility CTA | **5.02:1** vs White (AA Normal Text) |
| `--sl-color-warning-800` | `#92400E` | Impending badge text on `#FFFBEB` background | **6.84:1** vs `#FFFBEB` (AA Normal Text) |
| `--sl-color-on-warning` | `#FFFFFF` | Text and icons placed on `--sl-color-warning-700` | **5.02:1** (AA Normal Text) |

#### Stable / Verified: Expiry in > 24 Hours / Success
Shares the trusted emerald scale to indicate healthy buffer time and verified food listings.

| Token | Hex | Role & Usage | Contrast Ratio |
|---|---|---|---|
| `--sl-color-success-50` | `#ECFDF5` | Success notification background, safe card bg | Surface |
| `--sl-color-success-200` | `#A7F3D0` | Safe border, verified stamp outline | Border |
| `--sl-color-success-600` | `#059669` | Success icons, verified checkmarks | **3.77:1** vs White (UI Components ≥3:1) |
| `--sl-color-success-700` | `#047857` | Success text on white ground | **5.48:1** vs White (AA Normal Text) |
| `--sl-color-success-800` | `#065F46` | Safe badge text on `#ECFDF5` background | **7.29:1** vs `#ECFDF5` (AAA Normal Text) |

#### Information & Telemetry (OCR & Logistics)
Used for OCR scanning progress, delivery route information, and neutral guidance.

| Token | Hex | Role & Usage | Contrast Ratio |
|---|---|---|---|
| `--sl-color-info-50` | `#EFF6FF` | OCR banner background, route notice bg | Surface |
| `--sl-color-info-200` | `#BFDBFE` | Telemetry border, photo bounding box border | Border |
| `--sl-color-info-600` | `#2563EB` | Scanning progress bar, tracking icons | **5.17:1** vs White (AA Normal Text) |
| `--sl-color-info-800` | `#1E40AF` | Info badge text on `#EFF6FF` background | **8.01:1** vs `#EFF6FF` (AAA Normal Text) |

### 1.4 Neutral Surfaces & Ground (Slate Palette)
Calculated to avoid pure cold black and stark paper white, providing a warm, eye-friendly, professional backdrop.

| Token | Hex | Role & Usage | Contrast vs Slate 900 (#0F172A) |
|---|---|---|---|
| `--sl-color-bg-page` | `#F8FAFC` | Page canvas background (Slate 50) | **17.06:1** (AAA) |
| `--sl-color-surface-card` | `#FFFFFF` | Primary card, modal, and drawer surface | **17.85:1** (AAA) |
| `--sl-color-surface-subtle` | `#F1F5F9` | Table headers, neutral badges, secondary buttons | **15.65:1** (AAA) |
| `--sl-color-surface-hover` | `#E2E8F0` | Row hover highlight, interactive surface state | **13.52:1** (AAA) |
| `--sl-color-border-subtle` | `#F1F5F9` | Inner card dividers, light table row borders | Border |
| `--sl-color-border-default` | `#E2E8F0` | Standard card borders, form input borders | Border |
| `--sl-color-border-hover` | `#CBD5E1` | Input hover, interactive boundary state | Border |
| `--sl-color-border-focus` | `#047857` | Focused input border (5.48:1 contrast vs white) | Primary Outline |

### 1.5 Typography Colors

| Token | Hex | Role & Usage | Contrast vs White (#FFFFFF) |
|---|---|---|---|
| `--sl-color-text-primary` | `#0F172A` | Slate 900: Page titles, numbers, card headings | **17.85:1** (AAA Normal Text) |
| `--sl-color-text-secondary`| `#334155` | Slate 700: Body copy, table data, field labels | **10.35:1** (AAA Normal Text) |
| `--sl-color-text-muted` | `#64748B` | Slate 500: Helper text, timestamps, captions | **4.76:1** (AA Normal Text ≥4.5:1) |
| `--sl-color-text-disabled` | `#94A3B8` | Slate 400: Disabled controls (exempt per WCAG 1.4.3) | 2.56:1 (Requires persistent companion label) |
| `--sl-color-text-inverse` | `#FFFFFF` | White: High-contrast text on dark rails or buttons | **17.85:1** vs Slate 900 |

### 1.6 Interactive States & Accessibility Rings

| Token | Value | Role & Usage |
|---|---|---|
| `--sl-color-focus-ring` | `rgba(5, 150, 105, 0.4)` | Semi-transparent focus halo |
| `--sl-focus-outline` | `2px solid #059669` | Crisp high-contrast inner focus ring |
| `--sl-focus-offset` | `2px` | Mandatory 2px gap between element and focus ring |
| `--sl-disabled-opacity` | `0.55` | Standard disabled state opacity with `pointer-events: none` |

---

## 2. Typography System

### 2.1 Font Family & Fallbacks
- **Primary Typeface**: `Plus Jakarta Sans`
  - Highly legible geometric sans with humanist warmth, open counters, and robust weight distribution.
  - Sourced via Google Fonts: weights 400 (Regular), 500 (Medium), 600 (Semi-bold), 700 (Bold).
- **Fallback Stack**:
  ```css
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  ```
- **Monospace Stack** (Restricted to lot numbers, barcode strings, raw OCR telemetry):
  ```css
  font-family: ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace;
  ```

### 2.2 Typographic Hierarchy Scale

| Token | Size | Line Height | Weight | Letter Spacing | Purpose & Usage |
|---|---|---|---|---|---|
| `--sl-text-display` | `2.25rem` (36px) | `2.75rem` (44px) | `700` | `-0.025em` | Public landing page hero statement |
| `--sl-text-h1` | `1.875rem` (30px) | `2.25rem` (36px) | `700` | `-0.02em` | Primary dashboard view titles |
| `--sl-text-h2` | `1.5rem` (24px) | `1.875rem` (30px) | `600` | `-0.015em` | Major module headings, modal titles |
| `--sl-text-h3` | `1.25rem` (20px) | `1.625rem` (26px) | `600` | `-0.01em` | Card titles, section headers |
| `--sl-text-h4` | `1.125rem` (18px) | `1.5rem` (24px) | `600` | `-0.005em` | Sub-panel titles, listing names |
| `--sl-text-body-lg` | `1.0625rem` (17px)| `1.625rem` (26px) | `400` | `0` | Lead paragraphs, callout text |
| `--sl-text-body-base`| `0.9375rem` (15px)| `1.5rem` (24px) | `400` / `500`| `0` | Default UI body, form inputs, table data |
| `--sl-text-body-sm` | `0.875rem` (14px) | `1.375rem` (22px) | `400` / `500`| `0` | Table secondary text, field descriptions |
| `--sl-text-caption` | `0.75rem` (12px) | `1.125rem` (18px) | `500` / `600`| `+0.015em` | Badges, metadata chips, status tags |
| `--sl-text-tabular` | Inherited | Inherited | `500` / `600`| `0` | `font-variant-numeric: tabular-nums` (dates, timers) |

### 2.3 Typographic Rules & Reading Flow
- **Body Measure**: Text paragraphs maintain an optimal reading length between `55ch` and `75ch` (`max-width: 65ch`).
- **Heading Rhythm**: Headings must always have more spacing above than below (standard 2:1 ratio, e.g. `margin-top: 2rem; margin-bottom: 0.75rem`).
- **Numerical Alignment**: All dates (`2026-10-24`), weights (`12.5 kg`), meal counts (`150 meals`), and countdown timers (`04:15:22`) enforce `font-variant-numeric: tabular-nums` to prevent layout jitter as values update.

---

## 3. Spacing, Grid & Layout Density

### 3.1 Spacing Scale (4px Base Grid)

| Token | Size | Rem Equivalent | Primary UI Application |
|---|---|---|---|
| `--sl-space-1` | `4px` | `0.25rem` | Micro padding, badge gap, border offsets |
| `--sl-space-2` | `8px` | `0.5rem` | Button gap, input icon inset, tag padding |
| `--sl-space-3` | `12px` | `0.75rem` | Input padding Y, card header sub-gap |
| `--sl-space-4` | `16px` | `1.0rem` | Standard card internal padding, form row gap |
| `--sl-space-5` | `20px` | `1.25rem` | Modal internal padding, relaxed card padding |
| `--sl-space-6` | `24px` | `1.5rem` | Dashboard widget separation, section sub-gap |
| `--sl-space-8` | `32px` | `2.0rem` | Major dashboard grid gap, section vertical rhythm |
| `--sl-space-10`| `40px` | `2.5rem` | Page header margin, verification split gutter |
| `--sl-space-12`| `48px` | `3.0rem` | Section break padding |
| `--sl-space-16`| `64px` | `4.0rem` | Public landing page section padding |
| `--sl-space-20`| `80px` | `5.0rem` | Hero block vertical spacing |

### 3.2 Layout Widths & Shell Conventions

| Token | Value | Application |
|---|---|---|
| `--sl-width-landing-max` | `1200px` | Maximum container width for public narrative pages |
| `--sl-width-dashboard-max`| `1440px` | Maximum grid container width for operational console |
| `--sl-width-sidebar-full` | `260px` | Expanded desktop navigation rail width |
| `--sl-width-sidebar-mini` | `72px` | Collapsed tablet navigation rail width |
| `--sl-width-modal-max` | `560px` | Standard modal dialog container width |
| `--sl-width-gateway-max` | `1080px` | Verification gateway side-by-side modal width |
| `--sl-width-form-max` | `640px` | Listing creation and donor edit single-column form |

### 3.3 Responsive Breakpoints

| Breakpoint | Minimum Width | Target Devices & Adaptations |
|---|---|---|
| `sm` | `640px` | Mobile landscape; single-column cards to 2-column small grid |
| `md` | `768px` | Tablets; desktop top bar transforms to collapsed 72px rail |
| `lg` | `1024px` | Laptops; full 260px sidebar expands; multi-column dashboard grid |
| `xl` | `1280px` | Desktops; side-by-side OCR review pane activated |
| `2xl`| `1536px` | Wide screens; maximum container locks with centered margins |

---

## 4. Shape, Elevation & Surface Separation

### 4.1 Border Radii

| Token | Value | Primary UI Component |
|---|---|---|
| `--sl-radius-xs` | `4px` | Checkboxes, tooltips, inline lot tags |
| `--sl-radius-sm` | `6px` | Status badges, urgency chips, small action tags |
| `--sl-radius-md` | `8px` | Standard buttons, text inputs, selects, segmented toggles |
| `--sl-radius-lg` | `12px` | Cards, listing row items, dropzone upload borders |
| `--sl-radius-xl` | `16px` | Modal dialogs, floating action sheets, bottom drawers |
| `--sl-radius-full` | `9999px` | Circular counter indicators, avatar rings, pill toggles |

### 4.2 Elevation & Shadows
Shadows must remain subtle, directional, and natural. Harsh block shadows and colored glowing halos are prohibited.

| Token | CSS Box Shadow Value | Usage |
|---|---|---|
| `--sl-shadow-none` | `none` | Flat resting elements, border-only cards |
| `--sl-shadow-sm` | `0 1px 2px 0 rgba(15, 23, 42, 0.05)` | Resting card surface (paired with 1px border) |
| `--sl-shadow-md` | `0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)` | Card hover state, active dropdown popover |
| `--sl-shadow-lg` | `0 10px 15px -3px rgba(15, 23, 42, 0.09), 0 4px 6px -4px rgba(15, 23, 42, 0.04)` | Sticky headers, toast notifications, drawers |
| `--sl-shadow-xl` | `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.05)` | Central verification modal, image inspection lightbox |

### 4.3 Borders & Dividers
- **Standard Border Rule**: `1px solid var(--sl-color-border-default)`
- **Divider Rule**: `1px solid var(--sl-color-border-subtle)`
- **Elevation Philosophy**: Declare depth once—either via a clean 1px border on a tinted ground or a delicate soft shadow on a white ground. Avoid "ghost cards" that combine thick borders with wide diffuse shadows.
