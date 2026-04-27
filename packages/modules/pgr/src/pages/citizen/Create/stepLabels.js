/**
 * Per-step submit-bar label keys for the citizen Create wizard (D-003).
 *
 * Bundled in code; mirrors the MDMS schema sketched in
 * docs/nairobi-overhaul/DECISIONS.md so a future MDMS sync is a 1-line
 * lift (drop these constants and read from MDMS via `Digit.Hooks.useMDMS`).
 *
 * Why bundled instead of MDMS: matches the Phase 1 stance — until we have
 * confidence the MDMS read paths and tenant overrides are stable on
 * naipepea, the labels live here so they ship with the bundle and never
 * miss-load on a cold cache. See TASKS.md R1-A "MDMS sync deferred".
 *
 * Keys map to the route segments in `defaultConfig.js`. The `address`
 * key intentionally also covers the merged single-screen route from
 * D-001 (sibling branch `feat/nairobi-pgr-step4-collapse`); the legacy
 * `pincode` and `landmark` routes fall through to the default.
 */

export const stepSubmitLabels = {
  "complaint-type": "CS_NEXT",
  "sub-type": "CS_NEXT",
  "map": "CS_PIN_NEXT",
  "address": "CS_ADDRESS_NEXT",
  "upload-photos": "CS_PHOTOS_NEXT",
  "additional-details": "CS_SUBMIT",
};

export const getSubmitLabel = (stepKey, fallback = "CS_COMMON_NEXT") =>
  stepSubmitLabels[stepKey] || fallback;
