# Verified donation QR workflow

1. A donor submits the medicine and packaging photos.
2. The image analysis model follows a safety-first decision tree:
   - no visible packaging: manual pharmacist verification;
   - unreadable or missing expiry: manual pharmacist verification;
   - expired medicine: reject;
   - valid expiry: continue to pharmacist verification.
3. A pharmacist verifies the donation. Only an approved donation can receive a QR code.
4. The pharmacist uploads the packaging photo and presses **Create QR Code**. The QR contains a random server-side token, not trusted client data.
5. A recipient submits a medicine request. The pharmacist approves the request for QR pickup.
6. At handoff, the pharmacist scans the donation QR. The server verifies:
   - the token belongs to an approved donation;
   - the donation medicine exactly matches the request medicine;
   - the expiry date has not passed;
   - the donation has enough remaining quantity;
   - the request is approved and has not already been dispensed.
7. Only after all checks pass is the request completed, inventory moved from reserved to distributed, and the donation quantity reduced. A failed check never dispenses medicine.
