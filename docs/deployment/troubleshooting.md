# SurplusLabel Deployment Troubleshooting Guide

This guide documents common issues encountered during local development, build steps, cloud deployment, and live demonstrations, along with their root causes and resolutions.

---

## 1. Build and Compilation Issues

### Issue: `npm run build` fails with TypeScript errors
- **Symptoms**: `tsc` exits with non-zero status during `npm run build`.
- **Cause**: Type mismatches or unresolved imports in `src/` components.
- **Resolution**:
  1. Run `npx tsc --noEmit` to locate the exact filename and line number.
  2. Ensure all types imported from `src/types/inventory.ts` or `src/types/auth.ts` match backend models.
  3. Re-run `npm run build` to confirm the production bundle generates into `dist/`.

### Issue: Express 5 Wildcard Routing Error (`TypeError: Missing parameter name at 1: *`)
- **Symptoms**: Server crashes on boot with `path-to-regexp` error.
- **Cause**: Express 5 uses an updated `path-to-regexp` engine that does not accept unescaped `*` strings in `app.get('*', ...)`.
- **Resolution**:
  SurplusLabel uses standard Express middleware for client-side SPA routing fallback:
  ```typescript
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
  ```

---

## 2. CORS and Network Connectivity

### Issue: Browser console displays `CORS error: Response to preflight request doesn't pass access control check`
- **Symptoms**: Frontend fetch requests to `/api/*` fail with CORS blocked in browser console.
- **Cause**: The frontend origin is not present in the backend's `CLIENT_ORIGIN` environment variable.
- **Resolution**:
  1. Inspect the browser's current URL origin (e.g., `https://surpluslabel.org` or `http://localhost:5173`).
  2. Set `CLIENT_ORIGIN` in `server/.env` or hosting configuration to include the exact origin:
     ```env
     CLIENT_ORIGIN=https://surpluslabel.org,https://www.surpluslabel.org
     ```
  3. Restart the backend server.
  4. In unified full-stack deployments (where Express serves `dist/`), all requests are same-origin and bypass CORS restrictions entirely.

---

## 3. Authentication & Rate Limiting

### Issue: Login returns `HTTP 429 Too Many Requests`
- **Symptoms**: User cannot log in; API responds with `"Too many consecutive failed login attempts. Please wait 900 seconds."`
- **Cause**: The in-memory security rate limiter triggers after 5 consecutive failed login attempts for a specific IP or email address to prevent brute-force credential stuffing.
- **Resolution**:
  1. Wait 15 minutes for the lockout window to expire.
  2. Alternatively, restart the server process to clear the in-memory rate limit table.
  3. In test scripts, call `authService.resetRateLimit(email)` if automating repeated logins.

### Issue: User session lost on page refresh in production
- **Symptoms**: User is signed out immediately after refreshing the browser.
- **Cause**: Session cookie `sl_auth_token` has `secure: true` in production, but the application is being accessed over insecure HTTP instead of HTTPS.
- **Resolution**:
  1. Ensure production traffic terminates TLS/HTTPS at the load balancer or reverse proxy.
  2. If using an SSL-terminating reverse proxy (e.g. Nginx, Cloudflare), ensure `X-Forwarded-Proto: https` is forwarded.
  3. Notice that `AuthContext.tsx` also persists the token in `localStorage` as a secondary fallback to ensure seamless session restoration.

---

## 4. Cloudinary Image Uploads

### Issue: Upload returns `HTTP 503 CLOUDINARY_NOT_CONFIGURED`
- **Symptoms**: Image upload in the Add Food screen fails with:
  `"Cloudinary credentials are not configured on the server. Please populate CLOUDINARY_CLOUD_NAME..."`
- **Cause**: Cloudinary environment variables are missing from `server/.env` or hosting environment.
- **Resolution**:
  1. Verify credentials in `server/.env`:
     ```env
     CLOUDINARY_CLOUD_NAME=your_cloud_name
     CLOUDINARY_API_KEY=your_api_key
     CLOUDINARY_API_SECRET=your_api_secret
     ```
  2. Test health status via `curl http://localhost:4000/api/health` and verify `cloudinary: { configured: true }`.

### Issue: Upload returns `HTTP 413 File size exceeds limit`
- **Symptoms**: Uploading a photo fails with HTTP 413.
- **Cause**: The uploaded file exceeds the 5 MB ceiling defined in `server/middleware/upload.ts`.
- **Resolution**: Ensure user images are compressed before upload or under 5 MB.

---

## 5. Tesseract.js OCR Pipeline

### Issue: OCR returns no date candidates or wrong date
- **Symptoms**: Scanning a label extracts text but `candidates: []`.
- **Cause**: Poor lighting, blurry photo, skewed label angle, or unconventional date phrasing.
- **Resolution**:
  1. The platform is designed around human supervisor verification: if OCR misses a date, the user can manually enter or correct the packaging date in the form.
  2. Use a high-contrast, well-lit photo of the label area (like `public/sample-food-label-crisp.jpg`).

---

## 6. Reservation Workflow & Double-Claims

### Issue: "Confirm Reservation" button returns `HTTP 409 Conflict`
- **Symptoms**: Modal displays: `"This listing was just reserved by another organization. Conflicting claims are prevented."`
- **Cause**: Another recipient claimed the item while the current user had the modal open.
- **Resolution**:
  This is the intended business logic preventing double allocations. The recipient should navigate back to the browse inventory screen and choose another available surplus food listing.

### Issue: Handover PIN displays as `••••`
- **Symptoms**: When viewing a listing detail page, the handover PIN appears as masked bullets.
- **Cause**: You are viewing the listing as an unauthenticated visitor or an unrelated third party.
- **Resolution**:
  Sign in as the claiming recipient organization (`rescue@foodpantry.org`), the donor organization owner (`donor@greenmarket.org`), or platform administrator (`admin@surpluslabel.org`) to reveal the unmasked 4-digit handover PIN.

---

## 7. Data Persistence

### Issue: Listings and claims disappear after server container redeployment
- **Symptoms**: Changes revert to initial demo seed data after deploying to cloud hosting.
- **Cause**: The hosting provider runs an ephemeral container filesystem (e.g. basic Heroku or ephemeral container) and `server/data/` was destroyed during container recycle.
- **Resolution**:
  Attach a **Persistent Disk/Volume** to the container mounted at `/app/server/data`. On Render, configure a Disk with mount path `/app/server/data`. On Railway or Fly.io, attach a persistent volume.
