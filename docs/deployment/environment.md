# SurplusLabel Environment Variable Configuration Guide

This guide details all environment variables used by SurplusLabel, their purpose, validation rules, default fallback behaviors, and security best practices.

## 1. Environment Variable Summary Matrix

| Variable Name | Required | Default / Fallback | Sensitivity | Description |
| :--- | :--- | :--- | :--- | :--- |
| `PORT` | Optional | `5050` (or `4000` in dev) | Low | Port number for the Express server to listen on. |
| `NODE_ENV` | Recommended | `development` | Low | Set to `production` in staging/production environments to enable HTTPS cookie flags, CORS strictness, and error redaction. |
| `CLIENT_ORIGIN` | Required in Prod | `http://localhost:5173,http://127.0.0.1:5173` | Low | Comma-separated list of approved web origins allowed to access the API with credentials. |
| `JWT_SECRET` | Required in Prod | Built-in demo exhibition key | **HIGH** | Secret key for signing and verifying JSON Web Tokens. Must be a cryptographically random string (32+ characters). |
| `CLOUDINARY_CLOUD_NAME` | Required for Upload | *(None)* | Medium | Cloudinary cloud identifier where food-label images are stored. |
| `CLOUDINARY_API_KEY` | Required for Upload | *(None)* | High | Cloudinary API access key. Server-side only. |
| `CLOUDINARY_API_SECRET` | Required for Upload | *(None)* | **CRITICAL** | Cloudinary API private secret. Must NEVER be exposed to clients or checked into Git. |
| `CLOUDINARY_FOLDER` | Optional | `surpluslabel/food-labels` | Low | Cloudinary directory path where uploaded images are filed. |

---

## 2. Detailed Variable Specifications

### `PORT`
- **Purpose**: Defines the network port where the HTTP server binds.
- **Example**: `PORT=8080` or `PORT=5050`
- **Hosting Integration**: Cloud providers like Render, Heroku, Railway, and Cloud Run inject `PORT` automatically into the process environment. The server listens on `process.env.PORT || 5050`.

### `NODE_ENV`
- **Purpose**: Controls production-grade behaviors.
- **Behaviors Enabled When Set to `production`**:
  - `Secure` flag set on session cookies (`sl_auth_token`), requiring HTTPS.
  - Strict CORS validation rejecting unauthorized origins.
  - Stack traces suppressed from API error responses.
  - Startup environment security checks activated.

### `CLIENT_ORIGIN`
- **Purpose**: Restricts browser Cross-Origin Resource Sharing (CORS) to designated domains when frontend and backend are hosted on distinct hostnames.
- **Format**: Comma-separated list of complete origins (including protocol, domain, and port if non-standard).
- **Example**:
  ```env
  CLIENT_ORIGIN=https://surpluslabel.org,https://www.surpluslabel.org,https://app.surpluslabel.org
  ```
- **Security Rule**: Never set to `*` in production when credentials/cookies are enabled, as modern browsers reject wildcard CORS headers with `credentials: include`.

### `JWT_SECRET`
- **Purpose**: Authenticates user sessions for Donors, Recipients, and Coordinators.
- **Security Standard**: Must be at least 256 bits (32+ characters) of high entropy.
- **Generation Command**:
  ```bash
  # Generate a cryptographically secure random secret:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Validation**: On server startup in `NODE_ENV=production`, the server inspects `JWT_SECRET` and logs a warning if missing or shorter than 32 characters.

### Cloudinary Credentials (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)
- **Purpose**: Powers the image ingestion pipeline for food-label photographs uploaded during food listing registration.
- **Obtaining Credentials**:
  1. Create or log into an account at [cloudinary.com](https://cloudinary.com).
  2. Navigate to your **Dashboard**.
  3. Copy your Cloud Name, API Key, and API Secret.
- **Graceful Degradation**:
  If Cloudinary credentials are not configured, the application continues to operate:
  - Inventory browsing, date calculation, reservation flows, and authentication work normally.
  - Image upload endpoints return HTTP 503 (`CLOUDINARY_NOT_CONFIGURED`) with a helpful diagnostic message directing the administrator to supply credentials.
  - The health check (`/api/health`) clearly reports `cloudinary: { configured: false }`.

---

## 3. Safe Configuration & Secrets Management

1. **Local Development**:
   Copy `.env.example` to `server/.env` or `.env` in the project root:
   ```bash
   cp .env.example server/.env
   ```
2. **Git Hygiene**:
   Verify that Git ignores all `.env` files:
   ```bash
   git check-ignore -v server/.env .env
   # Should output: .gitignore:5:.env
   ```
3. **Cloud Hosting Environment Variables**:
   In your hosting dashboard (Render, Railway, Fly.io, Vercel, AWS Secrets Manager), inject each variable individually as an encrypted Environment Variable. Do NOT commit `.env` into source control.
