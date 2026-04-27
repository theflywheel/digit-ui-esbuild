# Execution plan — Nairobi citizen overhaul

Phased, ticket-sized, each phase is one PR that leaves the app shippable. Branches all originate from `main`; no inter-phase dependency unless noted. Targets `theflywheel/digit-ui-esbuild`.

Phase ordering optimizes for **broadest visual impact per line of diff first, riskier component rewrites later, deletions last**. The token rebind in Phase 1 alone fixes the citizen page chrome we identified earlier (blue/orange leakage), without touching any component code.

---

## Phase 0 — already done

- `feat/nairobi-overhaul-citizen` planning trunk PR #59 (this branch).
- PR #58 (`fix/theme-js-colors-mirror`) already pending — extends `applyTheme` to mirror MDMS into the JS `Colors` constant. Phase 1 builds on it; ideally merge #58 first.

---

## Phase 1 — token foundation

**Branch:** `feat/nairobi-overhaul-citizen` (this branch — first code commit on top of the planning trunk)

**Goal:** every Nairobi token is reachable from `var(--color-*)` and from `Colors.lightTheme.*` at runtime, without changing DIGIT's bundled defaults. This phase is theme-data only — no component rewrite.

**Steps:**

1. **MDMS — extend `kenya-green` ThemeConfig.** Add the missing tokens identified in DECISIONS.md D-004 and the new colors discovered in `research/component-variants.json`:
   - `colors.shell-tint: "#E8F3EE"`
   - `colors.cta-tint: "rgba(254, 201, 49, 0.20)"`
   - `colors.disabled-content: "#BDCAC3"`
   - `colors.tertiary-border: "#EDEDED"`
   - `colors.muted-bg: "#F3F4F6"`
   - `colors.tag-status.warning: { bg: "#FEF3C7", border: "#FAE29F", label: "#92400E" }`
   - `colors.tag-status.info: { bg: "#F3E8FF", border: "#E4CCFF", label: "#6B21A8" }`
   - `colors.tag-status.success: { bg: "#DCFCE7", border: "#A9FFC7", label: "#166534" }`

   Lands via `mdms_create` MCP call against naipepea (no schema change — `common-masters.ThemeConfig`'s schema permits free-form `colors` object). One commit, no code change in this repo.

2. **`applyTheme.js` — keep the flatten unchanged.** It already turns nested `colors.*` into `--color-<path>` automatically. Verify the new tokens emit `--color-shell-tint`, `--color-cta-tint`, `--color-tag-status-warning-bg`, etc. by running the existing tests. No code edit unless the schema validator blocks unknown keys — if it does, relax the schema to additionalProperties=true at the leaf.

3. **`packages/digit-ui-components/src/constants/colors/colorconstants.js` — add slots.** The existing `Colors.lightTheme.primary[1/2/.bg]` and `Colors.lightTheme.alert.*` stay as DIGIT defaults. Append:
   ```js
   shell:        { main: "#0B4B66", tint: "#FFFFFF" },     // DIGIT default; mirror layer overwrites
   cta:          { main: "#C84C0E", tint: "rgba(200,76,14,0.20)" },
   tagStatus:    { warning: {...}, info: {...}, success: {...} }   // DIGIT defaults — placeholder colors
   ```
   then in PR #58's mirror function (`mirrorColorsConstant` in `src/index.js`) extend the mapping so MDMS `colors.shell-tint`/`colors.cta-tint` populate `Colors.lightTheme.shell.tint`/`Colors.lightTheme.cta.tint`, and the three `tag-status.*` groups populate `Colors.lightTheme.tagStatus.*`.

4. **`packages/css/tailwind.config.js` — extend, do not replace.** Add new utility classes that resolve to vars:
   ```js
   colors: {
     ...existing,
     shell: { main: "var(--color-digitv2-header-sidenav, #0B4B66)", tint: "var(--color-shell-tint, #FFFFFF)" },
     cta:   { main: "var(--color-primary-main, #C84C0E)", tint: "var(--color-cta-tint, rgba(200,76,14,0.20))" },
     tagStatus: {
       warning: { bg: "var(--color-tag-status-warning-bg, #FEF3C7)", ... },
       info:    { ... },
       success: { ... },
     }
   }
   ```
   This keeps `bg-primary-main` working (still orange via Tailwind's compiled value) and gives us new `bg-shell-main`, `bg-shell-tint`, `bg-cta-main`, `bg-cta-tint`, `bg-tagStatus-warning-bg` etc. classes for the upcoming component rewrites. **Don't** rebind `primary.*` here yet — that's Phase 5's hard switch when we delete employee orange.

5. **Add CSS vars on `:root` as a fallback.** A new file `packages/css/src/digitv2/_nairobi-tokens.scss` declares the same vars with the Nairobi values as fallback, so applies even before MDMS load completes:
   ```scss
   :root {
     --color-shell-tint: #E8F3EE;
     --color-cta-tint: rgba(254, 201, 49, 0.20);
     ...
   }
   ```
   Imported from `packages/css/src/digitv2/index.scss`.

**Deliverables (one PR):**
- `packages/digit-ui-components/src/constants/colors/colorconstants.js` (additive)
- `src/index.js` (extend the mirror map)
- `packages/css/tailwind.config.js` (additive)
- `packages/css/src/digitv2/_nairobi-tokens.scss` (new)
- `packages/css/src/digitv2/index.scss` (one import line)

**Verify before merge:**
- `node --test src/theme/applyTheme.test.js` — passes.
- Build the digit-ui (just locally, esbuild dev) and inspect `:root` in DevTools — `--color-shell-tint` and `--color-cta-tint` present, with kenya-green values once MDMS loads.
- No visual regression on existing pages (the entire DIGIT primary palette still resolves the same).

**MDMS sync:** before this PR merges, the kenya-green ThemeConfig record must be updated on naipepea. If MDMS write goes first, Phase 1 code shows the new tokens immediately on pull-deploy. If code merges first, the pages render with bundled fallbacks (acceptable transient).

---

## Phase 2 — atom rewrite (Button, Tag, OtpCountdownPill)

**Branch:** `feat/nairobi-atoms`

**Goal:** ship the canonical Nairobi atoms that every other phase depends on.

**Components built (with synthetic interaction states from `research/component-variants.json`):**

- `<Button variant="primary" | "secondary" | "tertiary" | "muted">` — at `packages/digit-ui-components/src/atoms/NairobiButton.js`. Use the mapping from `component-variants.json` btn variants. Disabled = the `btn-inactive` styling, applied automatically when `disabled` prop true. Hover/pressed/focus = the synthetic states from `syntheticInteractionStates.primary` etc.
- `<Tag variant="warning" | "info" | "success" | "error" | "complaint-type">` — at `packages/digit-ui-components/src/atoms/NairobiTag.js`. The first three use the system status colors from `tags` COMPONENT_SET. `error` synthesised from `--color-error`. `complaint-type` is the yellow-fill green-border tag from `findings/components.json` (different shape — radius 4, smaller padding) — call this out as a distinct variant.
- `<OtpCountdownPill seconds initialSeconds onResend />` — pure presentational, no API. `seconds` ticks client-side via `setInterval`, hits 0, shows `Resend` link. Per DECISIONS.md D-002.
- `<ComplaintTag status />` thin wrapper around `<Tag variant="complaint-type">` for backward compat in PGR pages.

**Constraints:**
- Don't add to the components index until consumed by a screen — kept tree-shakeable.
- Storybook entries (or stories.js where the package convention exists) for every variant of every atom.

**Verify:**
- Visual regression by running storybook locally; confirm hover and focus rings actually render.
- New atom JS + SCSS files; no edits to the existing `Button.js` or `Tag.js` (keep DIGIT defaults usable for Bomet).

---

## Phase 3 — mobile chrome (TopBar, BackStrip, Sidebar consolidation)

**Branch:** `feat/nairobi-mobile-chrome`

**Goal:** the Nairobi citizen mobile shell — top bar, back strip, side menu — render with the new tokens. Sidebar consolidation per DECISIONS.md D-006.

**Steps:**
1. **`<TopBar variant="citizen-mobile">`** — new component. Green shell `#204F37`, 56px tall, menu (24×24 white) left, bell (24×24 yellow `#FEC931`) right. Keep DIGIT's existing `TopBar` for employee/Bomet.
2. **`<BackStrip>`** — `#E8F3EE` (`var(--color-shell-tint)`) bg, 48px tall, leading arrow_left, label Inter 16/24/medium. Reused on every wizard step.
3. **Sidebar consolidation** — grep for `StaticCitizenSideBar` usages; migrate any to dynamic `CitizenSideBar`; delete `StaticCitizenSideBar.js`. Keep dynamic. Apply Nairobi colors via existing `var(--color-digitv2-header-sidenav)` and verify it picks up `#204F37` from MDMS.
4. **Bell icon** — apply yellow fill (`var(--color-cta-main)`) to the bell svg. Verify on `/citizen/engagement/notifications`.

**Verify:**
- Open `/citizen` on a mobile viewport — green top bar with yellow bell.
- Navigate into any complaint flow step — back strip renders below the top bar.
- Remove `StaticCitizenSideBar.js` — no broken imports (CI runs).

---

## Phase 4 — citizen Home

**Branch:** `feat/nairobi-citizen-home`

**Goal:** rewrite `/citizen` Home to match the Figma — Quick Pay Card + Complaints Card on `#FFF4D6` bg.

**Steps:**
1. New `<ServiceCard>` molecule (uses Phase 2 atoms internally). Full-width, 12px radius, `#FFF4D6` bg, illustration slot on right, CTA bottom.
2. Rewrite `packages/modules/core/src/pages/citizen/Home/index.js` to render two `<ServiceCard>` instances + a welcome card. Drop the `LandingPageCard` references at this site (don't delete the file per DECISIONS.md D-005).
3. Add JSDoc `@deprecated` to `LandingPageCard` re-export with the migration path.

**Verify:** `/citizen` shows two cards in green/yellow palette. No `LandingPageCard` rendered on the citizen Home tree.

---

## Phase 5 — citizen Create flow shell

**Branch:** `feat/nairobi-citizen-create-shell`

**Goal:** the 6-step wizard frame is in place. Each step renders top bar + back strip + step body + bottom CTA bar from the new atoms. Step bodies still use the existing PGR forms.

**Steps:**
1. New `<WizardShell>` organism: top bar, back strip with step title from MDMS, body slot, bottom CTA bar with primary `Next` button (label from MDMS per DECISIONS.md D-003).
2. Refactor `packages/modules/pgr/src/pages/citizen/Create/index.js` to wrap each step in `<WizardShell>`.
3. **MDMS — add per-step submit labels** per DECISIONS.md D-003. New schema or extension to `RAINMAKER-PGR.PgrUiConstants` with `createFlow.stepSubmitLabels` map.
4. Read the map in the citizen Create container; pass `submitBarLabel` prop down.

**Verify:** all 6 steps in the wizard show consistent chrome + correct submit labels.

---

## Phase 6 — citizen Create step bodies

**Branch:** `feat/nairobi-citizen-create-steps`

**Goal:** each step body matches the Figma. The new atoms (Button, Tag, OtpCountdownPill) and chrome (WizardShell) from earlier phases are now consumed.

Per-step deltas:
- **Step 1 (type)** — vertical list with material icon + label + chevron. Replace existing tile grid.
- **Step 2 (subtype)** — same row pattern.
- **Step 3 (pin)** — ensure the existing map renders inside the new shell; add the `<MapZoomControlStack>` component (4 stacked white cards bottom-right per `research/components.json`).
- **Step 4 (address)** — single-screen form. **Blocked on `feat/nairobi-pgr-step4-collapse`** (DECISIONS.md D-001) — that sibling branch must merge first.
- **Step 5 (photos)** — `<DropZone>` molecule with green dashed outline.
- **Step 6 (details)** — single textarea.

**Verify:** end-to-end smoke — file a complaint from `/citizen`. Each step looks like the Figma.

---

## Phase 7 — citizen My Complaints + auth + success

**Branch:** `feat/nairobi-citizen-tail`

**Goal:** the surrounding citizen surfaces — list/detail/login/success.

**Steps:**
1. **My Complaints** — rewrite `packages/modules/pgr/src/pages/citizen/<Inbox-or-similar>/index.js`. Each row uses `<ComplaintCard>` (white bg, 12px radius, `<Tag variant="complaint-type">` for status, complaint number + status label).
2. **OTP login** — rewrite `Login/SelectOtp.js` (or sibling) to render the OTP layout from Figma. Use `<OtpCountdownPill>` from Phase 2. Don't change auth logic — pure visual rewrite per DECISIONS.md D-002.
3. **Success page** — new `<SuccessPanel>` organism: green panel `#2E7D32`, white check_circle 48×48, white headline + complaint number.

---

## Phase 8 — `LandingPageCard` deprecation marker

**Branch:** `feat/nairobi-deprecate-landingpagecard`

**Goal:** loud `@deprecated` marker on `LandingPageCard` so employee + DSS migrations are tracked. Don't delete yet (per DECISIONS.md D-005).

- Add `@deprecated` JSDoc.
- `console.warn` once per session if rendered (esbuild dev only — define-guarded for prod).
- Add a `LANDING-PAGE-CARD-MIGRATION.md` listing every consumer file:line and its target Nairobi component.

Hard-delete is a later branch (`feat/nairobi-cleanup-landing-page-card`) once employee + DSS migrate.

---

## Sibling branches (off main, run in parallel where independent)

- **`feat/nairobi-pgr-step4-collapse`** — merge `pincode + address + landmark` into one route per DECISIONS.md D-001. Touches `defaultConfig.js` and the FormComposer step machinery. Independent of all phases above; merge before Phase 6.
- **`feat/nairobi-overhaul-employee`** — employee shell + Inbox + Search + Detail + CSR Create-on-Behalf, hide HRMS/Configurator/DSS/Workbench/Utilities. Driven by `EMPLOYEE-SCOPE.md`. Depends on Phase 1 and Phase 2 atoms.
- **`feat/nairobi-overhaul-states`** — replace synthetic interaction states with canonical Figma variants once the design source publishes them. Touches the Phase 2 atoms. Async — run when design lands.
- **`feat/nairobi-cleanup-landing-page-card`** — hard-delete `LandingPageCard`. Last; runs after employee + DSS migrate.

---

## Phase order summary

```
P1 token foundation                        ← starts now, this branch
   ↓
P2 atoms                                   ← independent of MDMS sync
   ↓
P3 mobile chrome                           ┐
P4 citizen Home                            │ — these three can ship in any order once P2 is in
P7 citizen tail (login/list/success)       ┘
   ↓
P5 wizard shell                            ← depends on P2, P3, MDMS submit-label schema
   ↓
P6 wizard step bodies                      ← depends on P5 + step4-collapse sibling branch
   ↓
P8 LandingPageCard deprecation             ← any time after P4

(parallel) Employee branch                 ← depends on P1 + P2; otherwise independent
(parallel) Step4 collapse                  ← independent; gates P6 step 4 only
(parallel) States re-issue                 ← depends only on Figma re-publish
```

Each phase is ~1-3 days of focused work + review. Total to "Nairobi is fully live on naipepea citizen" is about **4-6 PRs** (P1-P7), assuming MDMS sync isn't a blocker.

---

## Open items not in any phase

- **Tailwind hard-rebind of `primary.main` from orange to yellow** — postponed indefinitely. Reasoning: that change cascades to Bomet and any other DIGIT deploy on this fork. We treat the new `bg-cta-main` / `bg-shell-main` utility classes as the canonical Nairobi surface and let `bg-primary-main` keep painting orange where it's still used. Only rebind primary on a conscious, separately-reviewed branch.
- **Tag-error variant** — Figma didn't publish one. Synthesize from `--color-error` (kenya-green has `#E02D3C`); flagged in `component-variants.json`.
- **`#205038` vs `#204F37`** — designer typo on tab-selected. Normalise everywhere to `#204F37` in code.
