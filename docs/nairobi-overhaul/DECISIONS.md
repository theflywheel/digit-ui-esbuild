# Decisions log

Captures user resolutions to open questions raised in `OVERHAUL-PLAN.md` and `EMPLOYEE-SCOPE.md`. Decisions here override the open-question text in the plans.

---

## D-001 — Step 4 routing collision (pincode + address + landmark)

**Question (OVERHAUL-PLAN §3, §8):** Figma's Step 4 ("Provide Complainant Address") collapses three separate DIGIT routes (`pincode`, `address`, `landmark` in `defaultConfig.js`) into a single screen. Keep three routes with a shared shell, or merge into one?

**Decision:** **Merge into one screen** to match Figma. The routing collapse must land on a separate branch from this overhaul branch, since it touches `defaultConfig.js` and the FormComposer step machinery for citizen Create. Keeps blast radius isolated.

**Owner action:** track the route collapse as a sibling branch off `feat/nairobi-overhaul-citizen` (suggested name `feat/nairobi-pgr-step4-collapse`). The visual rewrite of the address screen lands here once the route is merged.

---

## D-002 — OTP countdown + verification

**Question (OVERHAUL-PLAN §6):** Figma shows an `00:25` countdown pill + Resend link on the OTP screen. Current `SelectOtp.js` has neither — net-new behavior?

**Decision:** **Cosmetic only. Do not wire real verification or a real timer.** The current OTP is hardcoded — it doesn't actually verify against any service, and there's no real countdown. The visual rewrite should match Figma (the `OtpCountdownPill` component spec is correct), but the pill displays a static value or a fake-decrementing client-side timer that has no functional consequence on resend or token validation. No backend coupling. We'll wire real OTP separately when the auth flow is real.

**Owner action:** ship `OtpCountdownPill` as a presentational component. State (`seconds` prop) ticks client-side via `setInterval`, hits zero, "Resend" link becomes active — clicking re-shows the pill at `seconds=60`. No API calls. Document as cosmetic in the component file.

---

## D-003 — Per-step submit button label

**Question (OVERHAUL-PLAN §3, §8):** `defaultConfig.js` hardcodes `CS_COMMON_NEXT` for every step including the final Submit. Plan called for a per-route `submitBarLabel` override. Where does it live?

**Decision:** **Add to MDMS.** Extend the existing `RAINMAKER-PGR.PgrUiConstants` schema (or a sister schema if cleaner) with a `createFlow.stepSubmitLabels` map keyed by step route name. The citizen Create container reads it and falls back to `CS_COMMON_NEXT` if absent. Keeps copy editable per tenant without a code change.

Schema sketch:

```json
{
  "createFlow": {
    "stepSubmitLabels": {
      "complaint-type":  "CS_NEXT",
      "subtype":         "CS_NEXT",
      "pin-location":    "CS_PIN_NEXT",
      "address":         "CS_ADDRESS_NEXT",
      "upload-photos":   "CS_PHOTOS_NEXT",
      "additional-info": "CS_SUBMIT"
    }
  }
}
```

**Owner action:** define MDMS schema (configurator stage), seed defaults for `ke` and `ke.nairobi`, refactor citizen Create container to read the map. Lives inside this overhaul branch — small change.

---

## D-004 — New design tokens (shell-tint, cta-tint)

**Question (OVERHAUL-PLAN §1, §8):** `#E8F3EE` (shell-tint) and `rgba(254, 201, 49, 0.20)` (cta-tint) have no DIGIT analogues. Add as new tokens or reshape an existing one?

**Decision:** **Add as new.** Names: `--color-shell-tint: #E8F3EE` and `--color-cta-tint: rgba(254, 201, 49, 0.20)`. Don't piggy-back on `primary.light` — that token already means something else in DIGIT (it's a peach `#F18F5E` in Tailwind). Net-new tokens; goes through `applyTheme.js` flatten path automatically once added to the MDMS `kenya-green` ThemeConfig record under `colors.shell-tint` and `colors.cta-tint`.

**Owner action:** update MDMS `common-masters.ThemeConfig/kenya-green` to include the two keys; verify `applyTheme.js` flatten emits `--color-shell-tint` and `--color-cta-tint`; update Tailwind config (where utility classes need them) to reference the vars.

---

## D-005 — `LandingPageCard` deletion strategy

**Question (OVERHAUL-PLAN §4, §5):** `LandingPageCard` is consumed by employee + DSS, not just citizen. Delete in one PR (breaks employee/DSS) or stage?

**Decision:** **Stage. Delete from citizen first, mark deprecated, hard-remove later.** Specifically:

1. **This branch**: remove `LandingPageCard` from any citizen-flow render. Add `@deprecated — citizen surfaces have moved to ServiceCard / ComplaintCard` JSDoc on the export.
2. **Employee scope branch** (`feat/nairobi-overhaul-employee`): replace remaining employee-side usages with the Nairobi `KpiTile` / employee module-card replacement.
3. **Final cleanup branch**: delete the file and the `@egovernments/digit-ui-components` re-export once both sides have migrated.

Don't ship a hard-delete in this branch.

---

## D-006 — Sidebar duality (`CitizenSideBar` vs `StaticCitizenSideBar`)

**Question (OVERHAUL-PLAN §6):** Both `CitizenSideBar.js` and `StaticCitizenSideBar.js` exist. Which renders on naipepea today?

**Decision:** **Consolidate to one.** Keep the dynamic `CitizenSideBar.js` (reads `useStore.getInitData`); delete `StaticCitizenSideBar.js`. Verify no import path lands on the static version before deleting; the runtime rendering on naipepea is a verification step, not a decision question.

**Owner action:** grep for `StaticCitizenSideBar` imports across `digit-ui-esbuild`. If any callsite still routes to it, migrate to the dynamic one then delete. Lands inside this overhaul branch as part of the sidebar rewrite phase.

---

## D-007 — Default-state-only Figma data

**Question (OVERHAUL-PLAN §8):** Figma copy-as-CSS only captured frames in resting visual state — no hover / pressed / disabled / focus / error. 8 components in OVERHAUL-PLAN §2 are blocked on this.

**Decision:** **Design the states ourselves from the existing palette for v1.** The Nairobi tokens already include `rgba(254, 201, 49, 0.20)` (CTA tint) and `#E8F3EE` (shell tint), strongly implying the designer intended:

- **Hover (yellow CTA):** overlay yellow at 80% (or use `cta-tint` as a layered fill).
- **Pressed:** the same overlay deepened — `rgba(254, 201, 49, 0.40)` synthetic.
- **Disabled:** drop saturation 50% (a yellow-grey for CTA, a forest-grey for shell text).
- **Focus:** 2px outline in `var(--color-cta)` with 2px offset on shell elements; on yellow CTA, swap to a forest-green outline for contrast.
- **Error:** carry the existing `--color-error` (kenya-green ThemeConfig has `#E02D3C`) at 1px on the input border; helper text below in error.

When the design source publishes explicit state variants, we replace the synthetic states with the canonical ones in a follow-up branch (`feat/nairobi-overhaul-states`).

---

## Scope summary

This overhaul will land in stages, each as a separate branch off `main`:

| Branch | Carries |
|---|---|
| `feat/nairobi-overhaul-citizen` (this) | Token rebind + new tokens, citizen surfaces, `OtpCountdownPill`, `ComplaintTag`, `ServiceCard`, `SuccessPanel`, sidebar consolidation, MDMS submit-label config, citizen `LandingPageCard` removal |
| `feat/nairobi-pgr-step4-collapse` | Address/pincode/landmark route merge in `defaultConfig.js` |
| `feat/nairobi-overhaul-employee` | Employee shell + Inbox + Search + Detail + CSR Create-on-Behalf, hide HRMS/Configurator/DSS/Workbench/Utilities |
| `feat/nairobi-overhaul-states` (later) | Replace synthetic interaction states with canonical Figma variants |
| `feat/nairobi-cleanup-landing-page-card` (last) | Hard-delete `LandingPageCard` after employee + DSS migrate |
