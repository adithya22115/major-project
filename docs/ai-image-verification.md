# Medicine image verification pipeline

MediCycle treats image analysis as an assistive pre-fill step, never as approval of a medicine.

1. **Input:** an authenticated donor selects a JPG, PNG, or other image under the configured upload limit and may provide typed medicine name and dosage.
2. **Model:** the backend sends the image to the configured OpenAI-compatible vision chat-completions endpoint. The API key, model, endpoint, timeout, and byte limit are environment-configurable.
3. **Structured output:** the service requests JSON containing `medicineName`, `dosage`, `expiryDate`, `quantity`, and `confidence`. The response is parsed and validated; invalid dates, quantities, or out-of-range confidence values are discarded.
4. **Validation:** typed name and dosage are compared case-insensitively after whitespace normalization. Mismatches are returned as warning flags, while low confidence and no-detection results remain recoverable.
5. **User control:** the UI shows an `Analyzing...` state, fills only fields that were extracted, displays warnings, and keeps every field editable. Network errors, blurry images, missing labels, and missing API credentials fall back to manual entry.
6. **Submission:** the existing donation workflow remains the source of truth. Pharmacy verification is still required before a donation enters the medicine pool.

This design limits the blast radius of an unreliable provider: the image endpoint has explicit timeouts and graceful failure, and a donor can always continue without AI.

## Additional smart features

- The admin query assistant accepts controlled natural-language phrases and safely filters the existing overview data without executing arbitrary SQL.
- Demand forecasting aggregates medicine-request quantities over a bounded historical window and projects next-month demand using a transparent moving-average baseline.
