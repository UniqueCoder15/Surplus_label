# SurplusLabel

A full-stack surplus packaged-food donation coordination platform featuring OCR-assisted date extraction, human-in-the-loop verification, urgency-based inventory triage, and secure handover PIN verification.

Built with **React 18**, **TypeScript**, **Vite**, **Node.js**, **Express 5**, **Cloudinary**, and **Tesseract.js**.

---

## The Problem

Large volumes of safe packaged food are discarded by hostels, caterers, grocery stores, and food businesses because packaging dates are difficult to track, manual inventory logging is time-consuming, and communication with local food rescue charities lacks coordination. 

**SurplusLabel** bridges the gap between surplus food donors and recipient organizations:
1. **Accelerates Food Logging**: Donors photograph food packaging; server-side OCR detects printed date candidates (expiry, best-before, manufacturing, packaging).
2. **Safety & Auditability**: OCR is strictly treated as an assistant, never as automatic food-safety certification. An authorized supervisor must explicitly verify the date and classification.
3. **Urgency-Driven Rescue**: Items are triaged dynamically using calendar-day rules (`critical`, `urgent`, `soon`, `normal`, `non_expiry`, `past`) so food closest to expiry is claimed first.
4. **Reliable Handovers**: Prevents conflicting claims (HTTP 409) and generates a confidential 4-digit pickup PIN to verify physical transfers at loading docks.

---

## Core Features

- **Multi-Role Authentication & Access Control**:
  - **Donor**: Add food listings, upload packaging photos, inspect OCR text, manage inventory, confirm handovers.
  - **Recipient**: Browse and filter available surplus food, schedule collection windows, view confidential handover PINs.
  - **Coordinator / Admin**: Overview dashboard, category distributions, claim monitoring, and audit log inspection.
- **Image Upload & Management**: Ingests label images via Multer, validates magic bytes (JPEG/PNG/WebP), and streams buffers directly to Cloudinary.
- **Server-Side OCR Pipeline**: Tesseract.js worker analyzes image buffers in-memory and extracts normalized dates (`YYYY-MM-DD`) with contextual keywords (`EXP`, `BEST BEFORE`, `MFD`, `PKD`).
- **Reservation Workflow**: Atomic locking prevents duplicate claims. Successful claims generate a unique 4-digit handover PIN that is masked (`••••`) for third parties and revealed only to the claimant and donor.
- **Unified or Decoupled Deployment**: Express serves the compiled React SPA from `/dist` out of the box or operates as a standalone REST API with CORS credentials support.

---

## Technology Stack

- **Frontend**:
  - React 18, TypeScript, Vite
  - Lucide React (vector icons)
  - Custom design system with light theme and emerald/green palette (`#059669`)
  - Motion micro-animations with reduced-motion support
- **Backend**:
  - Node.js (v18+), Express 5
  - Multer (in-memory multipart upload handling)
  - Cloudinary Node SDK (server-side authenticated uploads)
  - Tesseract.js (server-side OCR engine)
  - bcryptjs (password hashing, 10 rounds) & jsonwebtoken (JWT sessions)
  - cookie-parser & cors
- **Persistence**:
  - File-backed atomic JSON storage (`server/data/listings.json` and `users.json`) with atomic file swapping (`fs.renameSync`) to ensure zero partial-write corruption.
- **Testing**:
  - Custom automated integration and unit test runners with zero external test runner bloat (`tsx`).

---

## Project Structure

```
surplus-label/
├── docs/                      # Technical & operational documentation
│   ├── deployment/            # Deployment guides, runbooks & troubleshooting
│   │   ├── README.md          # Architecture & hosting setup
│   │   ├── environment.md     # Environment variable specifications
│   │   ├── demo-runbook.md    # 5-minute exhibition demo script
│   │   └── troubleshooting.md # Common issues & resolutions
│   └── design-system/         # Design tokens, components & accessibility
├── public/                    # Static assets & sample food labels
├── server/                    # Node.js + Express backend
│   ├── data/                  # Persistent JSON storage (listings & users)
│   ├── middleware/            # Auth gates, RBAC, and Multer upload validation
│   ├── ocr/                   # Tesseract.js worker engine & heuristics
│   ├── routes/                # API route handlers (auth, listings, ocr, upload)
│   ├── services/              # Core business logic (authService, listingStore, dateParser)
│   ├── tests/                 # Automated test suites (158 assertions)
│   ├── cloudinary.ts          # Cloudinary SDK configuration
│   └── index.ts               # Express 5 server entrypoint & static SPA serving
├── src/                       # React 18 + Vite frontend
│   ├── components/            # Reusable UI components & modals
│   ├── context/               # AuthContext (sessions & authFetch)
│   ├── screens/               # 10 reference production screens
│   ├── types/                 # TypeScript interfaces for inventory & auth
│   ├── utils/                 # Client date parser & urgency utilities
│   ├── App.css                # Component styling & design tokens
│   └── App.tsx                # App shell, modal management & routing
├── .env.example               # Sanitized environment variable template
├── package.json               # Scripts & dependencies
├── tsconfig.json              # Client TypeScript configuration
└── vite.config.ts             # Vite configuration with /api proxy
```

---

## Prerequisites

- **Node.js**: v18.0.0 or later (tested on Node v20 and v24)
- **npm**: v9.0.0 or later

---

## Quickstart & Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd surplus-label
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Copy `.env.example` to `server/.env` (or `.env` in the root):
   ```bash
   cp .env.example server/.env
   ```
   *Note:* The application functions out of the box with built-in demo credentials. To test live Cloudinary image uploads, add your Cloudinary credentials to `server/.env`.

4. **Start the development environment**:
   ```bash
   # Run both frontend (port 5173) and backend (port 4000) concurrently:
   npm run dev:all
   ```
   Open your browser at `http://localhost:5173`.

---

## Running Individual Services

| Command | Action | URL |
| :--- | :--- | :--- |
| `npm run dev:all` | Concurrently runs frontend and backend | `http://localhost:5173` |
| `npm run dev` | Runs Vite frontend dev server with API proxy | `http://localhost:5173` |
| `npm run server:dev` | Runs Express backend with live file watch | `http://localhost:4000` |
| `npm run build` | Compiles frontend TypeScript & Vite bundle | Emits to `dist/` |
| `npm start` | Runs production Express server | `http://localhost:5050` |
| `npm run typecheck:server` | Typechecks backend TypeScript | Uses `server/tsconfig.json` |
| `npm test` | Executes all 5 automated test suites | 158 assertions |

---

## Demo Accounts

For demonstration and grading evaluation, the following pre-seeded demo accounts are available:

| Persona | Organization | Email | Password | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Donor** | GreenMarket Community Co-op | `donor@greenmarket.org` | `DemoPass123!` | `donor` |
| **Recipient** | Hope Community Food Pantry | `rescue@foodpantry.org` | `DemoPass123!` | `recipient` |
| **Coordinator** | SurplusLabel Platform Oversight | `admin@surpluslabel.org` | `DemoPass123!` | `admin` |

*Tip:* The sign-in dialog includes **Quick Demo Login** buttons to authenticate with a single click.

---

## Automated Test Suites

The repository contains 158 automated assertions across 5 suites:

```bash
npm test
```

- **`server/tests/dateParser.test.ts`** (66 tests): Strict calendar date validation (leap years, impossible days), date pattern extraction (`DD/MM/YYYY`, `MM/YYYY`, text months), ambiguity flags, and local calendar-day urgency calculations.
- **`server/tests/ocrApi.test.ts`** (6 tests): Upload validation, MIME type checking, spoofed magic-byte inspection, 5 MB file size limits, and live Tesseract.js candidate extraction.
- **`server/tests/listingsApi.test.ts`** (15 tests): Inventory filtering, retrieval, duplicate submission prevention, mandatory human verification gate, and status transitions.
- **`server/tests/authAndOwnership.test.ts`** (35 tests): User registration, password complexity validation, role escalation prevention (blocking unauthorized admin registration), JWT issuance, rate limiting (HTTP 429), and cross-organization modification barriers.
- **`server/tests/reservationRegression.test.ts`** (20 tests): End-to-end reservation flow, conflicting double-claim prevention (HTTP 409), 4-digit PIN generation, and role-based confidentiality masking.

---

## Production Deployment

SurplusLabel can be deployed as a unified full-stack service (Express serving the Vite build from `dist/`) or as separate frontend and API services:

1. **Build the production bundle**:
   ```bash
   npm run build
   ```
2. **Start the production server**:
   ```bash
   npm start
   ```
3. **Verify the health check**:
   ```bash
   curl http://localhost:5050/api/health
   ```

For detailed cloud deployment instructions (Render, Railway, Docker, Vercel), see:
- [Deployment Overview](docs/deployment/README.md)
- [Environment Variables](docs/deployment/environment.md)
- [Exhibition Demo Runbook](docs/deployment/demo-runbook.md)
- [Troubleshooting Guide](docs/deployment/troubleshooting.md)

---

## Security & Privacy Notice

- API keys, Cloudinary secrets, and JWT secrets are strictly maintained server-side and excluded from source control.
- Handover PINs and recipient telephone numbers are masked (`••••`) when queried by unauthenticated or third-party users.
- In-memory rate limiting locks IP addresses/emails after 5 consecutive failed login attempts.
- OCR outputs are explicitly treated as assistive suggestions; human verification is mandatory for every food listing.

---

## License

This project is developed for educational and community surplus-food rescue initiatives under the MIT License.
