# Nairobi overhaul — task tracker

Definition of done: every citizen screen in `research/screens.json` and every in-scope employee screen in `EMPLOYEE-SCOPE.md` matches the Figma / extrapolation, with atoms / molecules / organisms living in the canonical Nairobi component slots.

## Status

### Done

| # | Branch | PR | What |
|---|---|---|---|
| 0 | `feat/nairobi-overhaul-citizen` | #59 (planning trunk) | research dump + plans |
| 1 | `feat/nairobi-overhaul-citizen` | #59 | token foundation (default.json + schema + scss + tailwind extension) |
| 2 | `feat/nairobi-overhaul-citizen` | #59 | atoms — Button, Tag, OtpCountdownPill |
| 2.5 | `feat/nairobi-overhaul-citizen` | #59 | atom showcase route at `/citizen/complaints/_showcase` |
| 2.5 | `feat/nairobi-overhaul-citizen` | #59 | infra doc (`INFRA-DEPLOY.md` for `/digit-ui-rebuild`) |
| 3 | `feat/nairobi-overhaul-citizen` | #59 | mobile chrome — TopBar + BackStrip |
| 4 | `feat/nairobi-overhaul-citizen` | #59 | citizen Home + ServiceCard molecule, LandingPageCard removed from citizen flow + @deprecated |
| D-006 | `feat/nairobi-citizen-desktop-sidebar` | #60 | desktop sidebar consolidation, `StaticCitizenSideBar.js` deleted |
| D-001 | `feat/nairobi-pgr-step4-collapse` | #61 | citizen Create address routes merged (3 → 1) |

### Remaining

Three execution rounds. Within a round, tasks are parallel-safe (different file scopes). Round n+1 starts once round n lands.

---

## Round 1 — parallel right now (4 agents)

**R1-A — Phase 5: wizard shell + per-step submit labels**
- Branch: `feat/nairobi-overhaul-citizen` (commit on top)
- Agent owns these files only:
  - NEW: `packages/digit-ui-components/src/molecules/NairobiWizardShell.js`
  - NEW: `packages/css/src/digitv2/components/nairobi-wizard-shell.scss`
  - MODIFY: `packages/modules/pgr/src/pages/citizen/Create/index.js` (wrap steps in WizardShell, expose submitBarLabel prop)
  - MODIFY: `packages/digit-ui-components/src/molecules/index.js` (export)
  - MODIFY: `packages/digit-ui-components/src/index.js` (top-level export)
  - NEW: `packages/modules/pgr/src/pages/citizen/Create/stepLabels.js` — bundled per-route submit labels (D-003 via local config — MDMS sync deferred; matches the bundling stance from Phase 1)
- Composes: TopBar at top, BackStrip below, content slot, bottom CTA bar with NairobiButton primary
- Verify: 7/7 applyTheme tests, parse-check on every touched file
- Commit format: `feat(nairobi): phase 5 — wizard shell + bundled per-step submit labels`

**R1-B — Atoms batch 2 (Phase 6/7 + employee blockers)**
- Branch: `feat/nairobi-overhaul-citizen` (commit on top)
- Agent owns these files only:
  - NEW atoms: `NairobiSuccessPanel`, `NairobiComplaintCard`, `NairobiDropZone`, `NairobiMapZoomControlStack`, `NairobiKpiTile`, `NairobiSlaPill`, `NairobiWorkflowTimeline`
  - + matching SCSS files
  - MODIFY: `packages/digit-ui-components/src/atoms/index.js` (one batch export block)
  - MODIFY: `packages/digit-ui-components/src/index.js` (top-level exports — append after the existing Nairobi atoms)
  - MODIFY: `packages/css/src/digitv2/index.scss` (append imports)
  - MODIFY: `packages/modules/pgr/src/pages/citizen/_NairobiShowcase.js` (append sections demonstrating each)
- Source specs: `research/component-variants.json` + `research/findings/components.json` + `LOVABLE-PROMPT.md` employee section
- Verify: parse-check on every file, render the showcase route in your head
- Commit format: `feat(nairobi): atoms batch 2 — phase 6/7/employee primitives`

**R1-C — Phase 8: LandingPageCard migration tracker**
- Branch: `feat/nairobi-overhaul-citizen` (commit on top)
- Agent owns these files only:
  - MODIFY: `packages/digit-ui-components/src/molecules/LandingPageCard.js` — add a one-shot `console.warn` (esbuild dev-mode only, define-guarded for prod) listing the migration target component when the deprecated component is rendered
  - NEW: `docs/nairobi-overhaul/LANDING-PAGE-CARD-MIGRATION.md` — every remaining consumer of `LandingPageCard` with `file:line | current usage | target Nairobi component | branch that migrates it`
- Run `grep -rn "LandingPageCard\|EmployeeModuleCard" packages/` to enumerate consumers
- Commit format: `chore(nairobi): track LandingPageCard migration debt`

**R1-D — Employee branch bootstrap**
- Branch: NEW `feat/nairobi-overhaul-employee` (off `main`) in worktree `~/work/nairobi-overhaul-employee/`
- Agent owns this worktree only — independent of all citizen branches
- Per `EMPLOYEE-SCOPE.md`:
  - Hide all employee modules except PGR via the three surfacing levers (`EmployeeSideBar.js`, `Home.js`, `RoleBasedEmployeeHome.js`, `QuickStart/Config.js`)
  - Apply Nairobi tokens to the employee shell (use `var(--color-shell-main)` etc. — same fallback approach as #60)
  - Stub Inbox/Search/Detail/Create-on-Behalf rewrites by adding `// TODO Nairobi rewrite` markers; do NOT do the rewrites yet (Round 2)
- Open as draft PR
- Commit format: `feat(nairobi-employee): hide non-PGR modules + apply shell tokens`

---

## Round 2 — after Round 1 lands (3 agents)

**R2-A — Phase 6: citizen Create wizard step bodies**
- Branch: `feat/nairobi-overhaul-citizen`
- Per-step rewrites consuming Phase 5 wizard shell + R1-B atoms:
  - Step 1 (type) — vertical material-icon list
  - Step 2 (subtype) — same row pattern
  - Step 3 (pin) — `NairobiMapZoomControlStack` overlaid on existing map
  - Step 4 (address) — visual rewrite of the merged step from PR #61 (waits for #61 merge OR cherry-pick)
  - Step 5 (photos) — `NairobiDropZone`
  - Step 6 (details) — single textarea inside WizardShell

**R2-B — Phase 7: My Complaints + OTP + Success**
- Branch: `feat/nairobi-overhaul-citizen`
- My Complaints — list of `NairobiComplaintCard` rows + back strip
- OTP login — visual rewrite using `NairobiOtpCountdownPill` from Phase 2
- Success page — `NairobiSuccessPanel` from R1-B

**R2-C — Employee Inbox / Search / Detail / CSR Create**
- Branch: `feat/nairobi-overhaul-employee` (continuation of R1-D)
- KPI tiles, ComplaintCard rows, SlaPill on table rows, WorkflowTimeline on detail
- CSR Create-on-Behalf — clones citizen wizard with extra Citizen Lookup step at start

---

## Round 3 — after employee branch merges

**R3-A — Final LandingPageCard hard-delete**
- Branch: NEW `feat/nairobi-cleanup-landing-page-card` (off `main` after employee + citizen merge)
- Agent: delete `LandingPageCard.js` + `LandingPageWrapper.js`, prune the re-exports, drop the @deprecated marker

---

## Synthetic states later (parallel, untimed)

**SX — Replace synthetic interaction states with canonical Figma variants**
- Branch: NEW `feat/nairobi-overhaul-states` (off `main` whenever the design source publishes hover/pressed/disabled/focus/error variants)
- Touches: every Phase 2/Phase 3 atom SCSS
- Reverses the synthetic-state assumptions from DECISIONS.md D-007

---

## Coordination rules (apply throughout)

1. **Round n+1 cannot start until round n's PRs are pushed.** Mid-round, multiple agents on the SAME branch are OK iff their file scopes don't overlap (the per-task "agent owns these files only" list is the contract).
2. **Branch ownership.** `feat/nairobi-overhaul-citizen` carries Phases 1-7 + atoms + showcase + infra. `feat/nairobi-overhaul-employee` carries the employee scope. Sibling branches (#60, #61) are standalone.
3. **No MDMS writes** until execution is more confident — every config token bundles into `default.json` per the Phase 1 stance. D-003 per-step submit labels follow the same pattern (R1-A bundles them).
4. **No new dependencies.** Atoms render with hand-written SVG + CSS vars + literal hex fallbacks.
5. **Verification minimum** for every commit: `node --test src/theme/applyTheme.test.js` + `npx esbuild --loader:.js=jsx <each touched .js>`.
