# Phase 2 Walkthrough — End-to-End Role Flows (2026-09-07)

Full manual walkthrough of every role's flow against the running app
(backend `localhost:8080`, frontend `localhost:5173`, PostgreSQL). All flows
below were exercised via the same REST endpoints the frontend calls, timed with
`curl`. Backend test suite: **137/137 passing**.

## Flows verified per role

| Role / area | Flow | Result |
|---|---|---|
| Public | Health assistant `POST /api/health-assistant/check` (no LLM key) | ✅ 200, instant canned answer (HIGH severity detected for chest pain) |
| Public | Pincode lookup `GET /api/users/pincode/400001/lookup` | ✅ 200, 40 ms |
| Guest | `POST /api/auth/guest-register` → browse available donations | ✅ 201 + token, 200 on browse |
| Donor | Register → donate (multipart + image upload) → donation history → notifications | ✅ 201, PENDING, 2 notifications |
| Donor | Donation rejected by pharmacy → "Donation Rejected" notification | ✅ |
| Pharmacy (unverified) | Register → submit verification docs → `PUT /api/verification/*`, `GET /api/inventory`, `PUT /api/requests/*` | ✅ 201 / 403 blocked |
| Admin | Login → dashboard → overview → pending verifications → approve pharmacy → create medicine | ✅ all 200 |
| Pharmacy (verified) | Re-login → approve donation → inventory grows | ✅ donation qty appears in inventory |
| Pharmacy (verified) | Complete request (reserved→distributed) and reject request (reserved released) | ✅ inventory bookkeeping correct |
| Recipient | Register → browse available → create request → status COMPLETED + notification | ✅ |
| Recipient | Prescription-required medicine: request without Rx → 400; with PDF upload → 201 | ✅ |
| Auth | Refresh token → 200; logout → refresh with revoked token → 400 | ✅ |
| Auth | 5 failed logins → account locked → correct password still 423 | ✅ |
| Auth | 2FA setup returns secret + `data:image/png` QR URI | ✅ |
| Frontend | All SPA routes (`/login`, `/register`, `/dashboard`, `/admin`, `/donate`, `/requests`, `/pharmacy/verification`) + API proxy | ✅ 200, <30 ms each |

## Timings (curl `time_total`)

| Endpoint | Before fix | After fix |
|---|---|---|
| Register (verification email) | **6.4 s** | **0.54 s** |
| Forgot-password (reset email) | **5.8 s** | **0.06 s** |
| Admin dashboard / overview | — | 77 ms / 82 ms |
| Donation create, request create, verify, inventory | — | 40–300 ms |
| First request after cold start (Hibernate warmup) | — | ~300 ms, then <150 ms |

## Issues found

1. **FIXED — Email sends block the request (biggest "feels slow" item).**
   `register` and `forgot-password` waited synchronously on the SMTP round
   trip (6+ seconds). Emails are now sent `@Async` (`@EnableAsync` +
   `@Async` on `EmailService`) — requests return in <0.6 s and mail still
   goes out in the background (verified in the log on `task-1`/`task-2`
   threads, with the existing console fallback if SMTP fails).

2. **FIXED (Phase 2 LLM swap) — Health assistant could stall up to 15 s.**
   The old Hugging Face call hit the network even with a fake/empty key and
   blocked on the timeout. Now a blank `LLM_API_KEY` skips the network
   entirely and answers instantly from the offline fallback; with a key it
   calls OpenAI-compatible Chat Completions with hard 15 s connect/read
   timeouts and still falls back on any failure.

3. **KNOWN — Unknown pincodes hit the external postalpincode.in API**
   (up to ~10 s read timeout, flaky offline). The ~80 builtin pincodes are
   instant; anything outside that list is slow. Recommend pre-loading the
   fallback table or caching lookups if demos use unusual pincodes.

4. **KNOWN (design) — Pharmacy stock only grows via donation approvals.**
   There is no "add stock" endpoint for pharmacies; inventory is driven by
   the donate → approve loop. Fine for the demo flow, but a verified
   pharmacy cannot top up a medicine without a donor.

5. **KNOWN (minor) — Per-row image lookups.** Donation list endpoints run
   one extra query per donation for image URLs. Small at current scale;
   batch with a single query if lists grow.

## Demo checklist

- Set `LLM_API_KEY` (or rely on the offline fallback — demo-safe either way).
- Pre-warm the backend before the demo (first requests are ~300 ms).
- Use builtin pincodes (Mumbai `400001`, Pune `411001`, Delhi `110001`, …).
- Register accounts ahead of time; verify/approve the demo pharmacy before
  showing the pharmacy screens.