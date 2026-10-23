# SurplusLabel Design System

Welcome to the **SurplusLabel Design System**, the single source of truth for the visual, interactive, and architectural design language of the SurplusLabel platform.

SurplusLabel connects shops, hostel messes, event organizers, and food vendors with local food banks, community kitchens, and shelters to eliminate packaged-food waste through systematic verification, urgency triage, and coordinated donation pickups.

---

## 1. Design Philosophy

SurplusLabel operates at the intersection of **food safety**, **human empathy**, and **operational rigor**. The design language is engineered to instill immediate trust, eliminate friction during label scanning and verification, and enable fast, reliable handovers.

### Core Principles

1. **Clarity Over Decoration (Operate Mode)**
   In busy commercial kitchens, hostel mess stores, and donation centers, staff have zero tolerance for visual clutter. Interfaces are built with high information density, generous touch targets, clear typographic hierarchy, and unambiguous affordances. Every element earns its place on screen.

2. **Dignity & Community Impact (Persuade Mode)**
   Surplus food donation is an act of shared community responsibility. The public landing page and donor summaries celebrate tangible environmental and social metrics (meals rescued, CO₂ emissions averted) with pride, warmth, and visual polish, without sanctimony or guilt-driven imagery.

3. **Responsible Urgency Without Anxiety**
   Packaged food nearing its expiry date requires prompt action. We communicate urgency through structured time countdowns, distinct status badges, and prioritized sorting. We strictly reject flashing red alarms, jarring infinite animations, and alarming visual noise that induces panic or operational errors. Never communicate urgency through color alone.

4. **Human-in-the-Loop Trust**
   OCR date extraction from packaging labels is an AI assistant, not an autonomous authority. The design system explicitly treats AI extractions as unverified suggestions until a human confirms them. The verification gateway presents side-by-side source imagery, detected bounding boxes, and editable input fields with explicit confidence ratings.

5. **Restrained, Purposeful Motion**
   Animation exists strictly to confirm state changes, communicate hierarchy, and guide focus. We prioritize performant, hardware-accelerated CSS transitions for micro-interactions (150–200ms) and use JavaScript layout animations only when spatial continuity (such as tab switching or list reordering) enhances understanding. Motion must never block user input or delay a donation handover.

---

## 2. Product Identity

| Dimension | Specification |
|---|---|
| **Product Name** | SurplusLabel |
| **Brand Essence** | Safe, Verified, Community Food Rescue |
| **Primary Hue** | Deep Botanical Emerald (`#059669`) |
| **Secondary Hue** | Deep Structural Teal (`#0F766E`) |
| **Urgency Accents** | Action Amber (`#D97706`), Critical Crimson (`#DC2626`) |
| **Background Canvas** | Crisp Neutral Slate (`#F8FAFC`) |
| **Primary Typography** | Plus Jakarta Sans (Clean, geometric, humanist aperture) |
| **Surface Styling** | Clean 1px borders, subtle ambient elevation, 8px–14px radii |
| **Iconography** | Lucide Icons (consistent 1.75px vector strokes, strictly no emojis) |

### Anti-Patterns Explicitly Banned
- ❌ **No Generic AI SaaS Templates**: No saturated purple-to-blue gradients, floating blobs, or artificial glassmorphism.
- ❌ **No Cards-in-Cards**: Avoid nesting containers within containers; use semantic grouping, subtle borders, and whitespace to divide content.
- ❌ **No Gray-on-Color Text**: Secondary text on colored tags or buttons is derived directly from the underlying hue, maintaining a minimum 4.5:1 contrast ratio.
- ❌ **No Emoji as Interface Icons**: Emojis lack stroke consistency, vary unpredictably across platforms, and degrade accessibility. All interface icons are authored SVGs.
- ❌ **No Unearned Kicker/Eyebrows**: Section headings speak for themselves without redundant category labels above them.

---

## 3. Surface Modes Architecture

In alignment with our design system rules, SurplusLabel surfaces are architected under two distinct operating modes:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SURPLUSLABEL MODES                              │
├───────────────────────────────────┬────────────────────────────────────┤
│ PERSUADE MODE (Public Surfaces)   │ OPERATE MODE (Application Surfaces)│
├───────────────────────────────────┼────────────────────────────────────┤
│ • Public Landing Page             │ • Donor Inventory Dashboard        │
│ • Impact & Mission Stories        │ • Label Upload & OCR Verification  │
│ • Exhibition Demonstration Mode   │ • Urgency Triage & Priority Feed   │
│ • Recipient Discovery Directory   │ • Pickup Coordinator & Handover    │
│                                   │ • Admin Audit & Compliance Logs    │
├───────────────────────────────────┼────────────────────────────────────┤
│ Goal: Inspire, inform, activate   │ Goal: Scan, verify, dispatch, hand │
│ Focus: Rhythm, narrative, proof   │ Focus: Speed, density, zero error  │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 4. Documentation Directory Map

This design system is organized into modular, detailed specifications:

- **[`design-tokens.md`](./design-tokens.md)**: Exact color scales, CSS custom property definitions, WCAG contrast calculations, typography scales, spacing units, elevation tokens, and responsive breakpoints.
- **[`components.md`](./components.md)**: Visual, behavioral, and accessibility specifications for buttons, inputs, listing cards, urgency badges, data tables, OCR verification split-screens, modals, dropzones, and feedback states.
- **[`motion-and-interactions.md`](./motion-and-interactions.md)**: Timing scales, easing curves, gesture feedback, OCR processing animations, exit transition rules, and full `prefers-reduced-motion` fallbacks.
- **[`accessibility-and-responsive.md`](./accessibility-and-responsive.md)**: WCAG 2.2 AA conformance standards, visible focus rings, multi-cue status indicators, keyboard workflows, touch targets, and mobile-tablet-desktop layout rules.
