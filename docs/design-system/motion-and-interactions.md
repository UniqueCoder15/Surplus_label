# SurplusLabel Motion & Interaction Specifications

This document defines the motion, timing, and interaction rules for SurplusLabel, built upon the principles of our installed **Motion** skill.

In a surplus food redistribution platform, animation must **accelerate comprehension**, **reinforce confidence**, and **respect cognitive load**. Motion must never be decorative for its own sake, and it must never delay time-critical operational actions.

---

## 1. Motion Principles

1. **Subtle & Intentional Over Flashy**
   Every transition communicates a change in status, hierarchy, or availability. Infinite pulsing loops, distracting bounces, and gratuitous 3D tilts are prohibited.

2. **Non-Blocking Guarantee**
   Crucial workflows—verifying a label date, claiming a food donation, or marking a batch as collected—must register instantly. Motion is purely cosmetic feedback applied to composite properties (`transform`, `opacity`) and never delays form submission or API dispatch.

3. **Performance First (GPU Only)**
   Only animate GPU-accelerated properties: `transform` (`translate`, `scale`, `rotate`) and `opacity`. Never animate layout-triggering properties (`width`, `height`, `top`, `margin`, `padding`).

4. **CSS-First Architecture**
   Use standard CSS transitions for 90% of micro-interactions (hover, focus, active button press). Employ the JavaScript Motion library (`motion/react` or `motion/react-client`) only when FLIP layout animations, exit transitions (`AnimatePresence`), or complex multi-step OCR states require coordinated orchestration.

5. **Strict Accessibility Compliance**
   Honor `prefers-reduced-motion: reduce` across the entire application via global config (`<MotionConfig reducedMotion="user">`), replacing spatial translation with instant or near-instant opacity fades.

---

## 2. Timing & Easing Tokens

### 2.1 Duration Scale

| Token | Duration | Application |
|---|---|---|
| `--sl-duration-instant` | `100ms` | Checkbox toggles, radio buttons, instant icon swaps |
| `--sl-duration-fast` | `150ms` | Button hover/active presses, tab indicators, tooltip reveals |
| `--sl-duration-normal` | `200ms` | Dropdown menus, listing card hover lift, table row highlights |
| `--sl-duration-panel` | `250ms` | Modal dialogs, slide-in drawers, notification toasts |
| `--sl-duration-exit` | `150ms` | Element removals (exits are always 30% faster than entrances) |

### 2.2 Easing Curves

```css
:root {
  /* Clean deceleration: elements enter smoothly without overshoot */
  --sl-ease-out: cubic-bezier(0.16, 1, 0.3, 1);

  /* Standard interaction ease: used for two-way state toggles */
  --sl-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* Rapid exit curve: accelerates element off screen */
  --sl-ease-in: cubic-bezier(0.4, 0, 1, 1);
}
```

- **Spring Physics (Motion Library Only)**:
  - Tight, controlled tactile spring: `{ stiffness: 400, damping: 25 }` (used for button tap states and mobile sheet gestures).
  - Heavy, no-bounce spring: `{ stiffness: 300, damping: 30 }` (used for modal dialog entrances).

---

## 3. Micro-Interactions & State Feedback

### 3.1 Button Feedback
- **Hover**:
  ```css
  transition: background-color var(--sl-duration-fast) var(--sl-ease-in-out),
              border-color var(--sl-duration-fast) var(--sl-ease-in-out),
              box-shadow var(--sl-duration-fast) var(--sl-ease-in-out);
  ```
- **Active / Pressed**:
  ```css
  transform: scale(0.98);
  transition: transform 80ms ease-out;
  ```
- **Focus**:
  - Instant appearance of 2px focus ring (`outline: 2px solid var(--sl-color-primary-600); outline-offset: 2px;`). Never animate the focus ring size.

### 3.2 Card Lift on Hover (Feed & Listings)
- Food listing cards subtly elevate on hover to indicate clickability:
  ```css
  .sl-listing-card {
    transition: transform var(--sl-duration-normal) var(--sl-ease-out),
                box-shadow var(--sl-duration-normal) var(--sl-ease-out);
  }
  .sl-listing-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--sl-shadow-md);
  }
  ```
- Note: Hover elevation is disabled on touch devices (`@media (hover: none)`).

### 3.3 Active Navigation Indicator
- In the sidebar and top navigation tabs, active state indicators glide smoothly using Motion's FLIP shared element transition:
  ```tsx
  {isActive && (
    <motion.div
      layoutId="sl-nav-indicator"
      className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
    />
  )}
  ```

---

## 4. Multi-Step OCR & Verification Transitions

The food-label scanning workflow involves asynchronous AI processing. Motion guides the user through four distinct states without jarring layout shifts:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OCR VERIFICATION PIPELINE                       │
├───────────────┬───────────────────────────────┬────────────────────────┤
│ Step 1: Drop  │ Subtle border scale pulse     │ 150ms ease             │
│ Step 2: Upload│ Linear progress indicator     │ scaleX(progress)       │
│ Step 3: OCR   │ Clean skeleton shimmer pulse  │ opacity [0.6 -> 1]     │
│ Step 4: Verify│ Cross-fade to side-by-side    │ 200ms ease-out         │
└───────────────┴───────────────────────────────┴────────────────────────┘
```

1. **Step 1: File Drop**:
   When an image is dragged over the dropzone, the container gently scales (`scale: 1.01`) and shifts border color to emerald (`150ms ease`).
2. **Step 2: Upload Progress**:
   A hardware-accelerated 2px top bar expands horizontally:
   ```css
   transform: scaleX(var(--upload-progress));
   transform-origin: left;
   transition: transform 120ms linear;
   ```
3. **Step 3: OCR Processing**:
   While OCR models analyze the packaging image, an informative step status displays ("Reading printed date...", "Matching expiry format..."). A subtle ambient shimmer pulse (`opacity: 0.6 -> 1 -> 0.6` over 1.6s) indicates active computing. Bizarre laser beams and spinning targets are strictly avoided.
4. **Step 4: Data Verification Reveal**:
   The side-by-side verification pane fades in smoothly (`opacity: 0 -> 1; y: 8px -> 0px` over `200ms var(--sl-ease-out)`). Detected bounding boxes around the expiry date appear with an intentional 100ms delay to draw the user's eye to the exact source text.

---

## 5. Overlay, Drawer & Toast Motion

### 5.1 Centered Modal Dialogs
- **Backdrop**: Fades in over `200ms` (`opacity: 0 -> 1`).
- **Dialog Surface**:
  - Enters: `opacity: 0 -> 1; scale: 0.96 -> 1; y: 12px -> 0` via spring (`stiffness: 300, damping: 28`).
  - Exits: `opacity: 1 -> 0; scale: 1 -> 0.96` over `150ms var(--sl-ease-in)`.

### 5.2 Mobile Bottom Sheet
- Enters from bottom viewport edge: `translateY(100%) -> translateY(0)` over `250ms var(--sl-ease-out)`.
- Supports direct touch drag down with elastic boundary (`dragElastic: 0.2`). Dragging past 100px triggers dismissal.

### 5.3 Toast Notifications
- Slide and fade in from bottom-right (desktop): `opacity: 0 -> 1; x: 24px -> 0` over `200ms var(--sl-ease-out)`.
- Auto-dismiss after 4 seconds; user hover pauses timer.
- Exit: Fades out and slides right: `opacity: 1 -> 0; x: 0 -> 24px` over `150ms var(--sl-ease-in)`.

---

## 6. Accessibility & Reduced-Motion Specifications

Under `prefers-reduced-motion: reduce`, animations must not produce spatial movement that causes vestibular distress.

### 6.1 Reduced-Motion Implementation Rules
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 6.2 Motion Library Reduced-Motion Provider
When using the Motion library, wrap the application root in:
```tsx
import { MotionConfig } from "motion/react";

<MotionConfig reducedMotion="user">
  <App />
</MotionConfig>
```
- **Behavior with `reducedMotion="user"`**:
  - `x`, `y`, `scale`, and `rotate` transforms are automatically bypassed.
  - Necessary state changes (modal visibility, toast dismissal, step changes) execute via crisp, instant opacity cuts (`duration: 0.1s` or `0s`).
  - Screen reader announcements are unaffected.

---

## 7. Mobile Touch Optimization

1. **Eliminate Hover Traps**:
   Mobile devices do not trigger hover states. CSS rules ensure buttons and cards do not get "stuck" in a hover style on touch release.
2. **Tactile Tap Confirmation**:
   Touch elements employ active scaling (`transform: scale(0.97)`) on press, providing tactile confirmation that an action was registered.
3. **Gesture Conflicts**:
   Horizontal swiping components (e.g. image carousel of donations) must declare explicit touch action boundaries (`touch-action: pan-y`) so vertical page scrolling is never blocked by horizontal swipe handlers.
