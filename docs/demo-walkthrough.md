# Demo walkthrough and safety notes

## Role-by-role walkthrough

| Role | Flow checked | Demo-safety notes |
|---|---|---|
| Donor | Register/login, profile location, upload donation, analyze image, submit, view history | Image analysis is optional; manual entry remains available if the provider is unavailable. |
| Recipient | Set location, search medicine pool, inspect nearby locations, submit request, track status | Nearby results now show a composite match score rather than distance alone. Location lookup has a bounded upstream timeout and a built-in city fallback. |
| Pharmacy/NGO | Login, review pending donations, approve/reject, manage inventory, approve/reject requests | Approval remains the required safety gate; AI never auto-approves a medicine. |
| Admin | Login, dashboard/reports, user management, medicine management, verification oversight | CORS and scheduled cleanup are configuration-driven rather than hardcoded. |

## Issues to check before a live demo

- Start PostgreSQL and confirm the configured database/mail values before launching the backend; the checked-in properties file intentionally does not provide a portable demo database.
- Set `LLM_API_KEY` (and optionally `MEDICINE_ANALYSIS_API_KEY`) only if live AI is needed. Without keys, the health assistant remains available through its offline fallback and image analysis tells the user to continue manually.
- Use a clear package photo with the medicine name and expiry visible. A blurry image or a package with no readable medicine label should be demonstrated as a graceful manual-entry fallback.
- Confirm browser geolocation permission and use a pincode fallback if it is denied.
- Run one cleanup job manually or lower `app.cleanup.token-cron` in a demo profile if token-table maintenance needs to be shown; the default runs nightly at 03:00.

The walkthrough is a static/manual readiness record. External provider latency, SMTP delivery, and production database availability must still be validated in the target demo environment.
