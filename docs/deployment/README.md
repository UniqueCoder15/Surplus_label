# SurplusLabel Deployment Guide & Architecture Overview

## 1. System Architecture

SurplusLabel is an end-to-end surplus food donation coordination and packaging-verification platform. It operates as a full-stack web application designed for high reliability, data confidentiality, and verifiable human-in-the-loop auditability.

```
┌────────────────────────────────────────────────────────┐
│             Client Layer (Browser / SPA)               │
│   React 18 + TypeScript + Vite + Lucide + Motion CSS   │
│   Modern Light Theme with Emerald/Green Accents        │
│   Hash-based routing with 10 production screens        │
└───────────────────────────┬────────────────────────────┘
                            │
               HTTP / JSON (REST + Multipart)
               Same-Origin / Authenticated CORS
                            │
┌───────────────────────────▼────────────────────────────┐
│         Backend Server Layer (Node.js / Express 5)     │
│   • express.static('dist') unified static file serving │
│   • Cookie & Bearer JWT Authentication (Role-Based)    │
│   • CORS Origin Validation & Rate Limiting Middleware  │
│   • Input Validation & Calendar Date Logic             │
└────────────┬──────────────┬──────────────┬─────────────┘
             │              │              │
    Image Streams     OCR Pipeline    JSON Storage
             │              │              │
┌────────────▼──────┐ ┌─────▼────────┐ ┌───▼─────────────┐
│ Cloudinary CDN    │ │ Tesseract.js │ │ Persistent Disk │
│ • Food-label      │ │ • Server-side│ │ • Atomic rename │
│   photos          │ │   OCR engine │ │   safe writes   │
│ • Secure assets   │ │ • Date regex │ │ • listings.json │
│   management      │ │   heuristics │ │ • users.json    │
└───────────────────┘ └──────────────┘ └─────────────────┘
```

### Supported Deployment Models

1. **Unified Full-Stack Deployment (Recommended)**:
   - Build client bundle with `npm run build` (`tsc && vite build`).
   - Run server with `npm start` (`tsx server/index.ts`).
   - Express serves the compiled frontend assets directly from `/dist` and handles all API traffic (`/api/*`), health checks (`/api/health` and `/health`), and client-side SPA routing fallbacks.
   - Ideal for Docker containers, Render Web Services, Railway, Fly.io, or virtual machines.

2. **Decoupled Deployment (Static Frontend + API Backend)**:
   - **Frontend**: Hosted on Vercel, Netlify, Cloudflare Pages, or AWS S3 + CloudFront.
   - **Backend**: Hosted on Render, Railway, AWS ECS, or Google Cloud Run.
   - Configured via `CLIENT_ORIGIN` environment variable on the server to allow cross-origin requests with credentials.
   - Frontend configured with proxy or API reverse-proxy routing to avoid CORS friction.

---

## 2. Pre-Deployment Checklist

Before deploying SurplusLabel to staging or production, execute this sequential verification checklist:

- [ ] **Dependency Installation**: Run `npm install` to ensure all production and build dependencies are present.
- [ ] **Environment Isolation**: Ensure `.env` and `server/.env` are listed in `.gitignore` and never committed to version control.
- [ ] **Production Environment Variables**: Populate `PORT`, `NODE_ENV=production`, `CLIENT_ORIGIN`, `JWT_SECRET` (32+ chars), and Cloudinary credentials.
- [ ] **Typecheck Verification**:
  - Run `npm run typecheck:server` to verify backend TypeScript.
  - Run `npx tsc --noEmit` to verify frontend TypeScript.
- [ ] **Production Build**: Run `npm run build` to compile the Vite production bundle into `dist/`.
- [ ] **Automated Test Suite**: Run `npm test` to verify all 158 tests pass (date parsing, OCR, listings API, auth RBAC, reservation regression).
- [ ] **Health Endpoint Check**: Verify `GET /api/health` and `GET /health` return `status: "ok"`.
- [ ] **Persistent Volume Mount**: For containerized hosting, ensure `server/data/` is mapped to a persistent volume or disk.

---

## 3. Production Build & Startup Commands

| Purpose | Command | Notes |
| :--- | :--- | :--- |
| **Install Dependencies** | `npm ci` | Clean, reproducible dependency installation |
| **Typecheck Backend** | `npm run typecheck:server` | Uses `server/tsconfig.json` |
| **Compile Frontend** | `npm run build` | Runs `tsc && vite build`, emits to `dist/` |
| **Run All Tests** | `npm test` | Runs 5 test suites (158 assertions) |
| **Start Production Server** | `npm start` | Launches Express on configured `PORT` |
| **Preview Built Client** | `npm run preview` | Local preview of Vite production bundle |

---

## 4. Docker Deployment Specification

For containerized cloud deployment (AWS ECS, Google Cloud Run, Azure Container Apps, Render Docker), use the following standardized Dockerfile pattern:

```dockerfile
# Multi-stage production Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm run typecheck:server

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm install -g tsx

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/public ./public

# Create persistent storage directory
RUN mkdir -p /app/server/data

EXPOSE 5050
CMD ["npm", "start"]
```

---

## 5. Persistence Requirements

SurplusLabel persists users and food listings to local atomic JSON files located at:
- `server/data/users.json`
- `server/data/listings.json`

### File Integrity Guarantee:
Updates write to an ephemeral temporary file (`.tmp.<timestamp>`) and swap atomically via `fs.renameSync()`, preventing partial writes or database corruption.

### Cloud Storage Rule:
On ephemeral platforms where container filesystems reset on redeploy (e.g., standard Heroku, ephemeral AWS Lambda, basic Render without disk), a **Persistent Disk** must be attached and mounted at `/app/server/data`.
