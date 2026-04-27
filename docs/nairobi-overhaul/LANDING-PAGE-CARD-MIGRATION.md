# LandingPageCard migration tracker

Per [DECISIONS.md D-005](./DECISIONS.md#d-005--landingpagecard-deletion-strategy), `LandingPageCard` (and its `EmployeeModuleCard` wrapper in `digit-ui-react-components`) is being removed in three stages: (1) drop it from every citizen-flow render on `feat/nairobi-overhaul-citizen` and mark the export `@deprecated` so new code stops reaching for it; (2) on `feat/nairobi-overhaul-employee`, replace the remaining employee-side usages with the Nairobi `KpiTile` / employee module-card rewrite; (3) on `feat/nairobi-cleanup-landing-page-card`, hard-delete `LandingPageCard.js`, `LandingPageWrapper.js`, the `EmployeeModuleCard` wrapper, and the `@egovernments/digit-ui-components` re-export. This file enumerates every remaining consumer so step 3 has a no-surprise checklist.

**What triggers final delete:** the hard-delete branch (`feat/nairobi-cleanup-landing-page-card`) opens once both `feat/nairobi-overhaul-employee` and `feat/nairobi-overhaul-citizen` have merged and the "Employee scope" section below is fully empty.

A one-shot `console.warn` fires on the first render of `LandingPageCard` in dev builds (esbuild-define stripped from prod) — when it shows up in the console for a flow we thought was migrated, that flow is missing from this tracker.

Source of truth: `grep -rn "LandingPageCard\|EmployeeModuleCard\|landing-page-card" packages/` (skipping `node_modules`, `dist`, `vendor`).

---

## ✅ Migrated already (citizen Home — Phase 4 done on `feat/nairobi-overhaul-citizen`)

| file:line | current usage | target Nairobi component | branch / phase that migrates it | status |
|---|---|---|---|---|
| `packages/modules/core/src/pages/citizen/Home/index.js:16` | JSDoc reference only — no live render | `NairobiServiceCard` (already wired) | `feat/nairobi-overhaul-citizen` Phase 4 | done — citizen Home now renders two `<NairobiServiceCard>` surfaces (Pay Bills, File or Track Complaints) |

---

## ⏳ In-flight (citizen branch — currently `feat/nairobi-overhaul-citizen`)

None. Every citizen-flow render of `LandingPageCard` was eliminated in Phase 4. New citizen surfaces (My Complaints, Success, OTP) shipping in Round 2 use `NairobiComplaintCard`, `NairobiSuccessPanel`, and `NairobiOtpCountdownPill` per TASKS.md R2-A / R2-B — they never reach for `LandingPageCard`.

---

## 📦 Employee scope (will land on `feat/nairobi-overhaul-employee` per D-005 step 2)

The employee shell renders `LandingPageCard` directly, plus six per-module wrapper cards funnel through `EmployeeModuleCard` (which in turn renders `LandingPageCard`). Both the direct render and every wrapper need to migrate before step 3.

### Direct `LandingPageCard` consumer

| file:line | current usage | target Nairobi component | branch / phase that migrates it | status |
|---|---|---|---|---|
| `packages/modules/core/src/components/RoleBasedEmployeeHome.js:2` | `import { Button, LandingPageCard, LandingPageWrapper } from "@egovernments/digit-ui-components";` | drop import; replace `LandingPageWrapper` with a Nairobi tiled grid; replace `LandingPageCard` render with a Nairobi `EmployeeModuleCard` rewrite (or `KpiTile` if the role-home tiles collapse to KPI surfaces per `EMPLOYEE-SCOPE.md`) | `feat/nairobi-overhaul-employee` (R1-D bootstrap leaves `// TODO Nairobi rewrite`; R2-C does the rewrite) | pending |
| `packages/modules/core/src/components/RoleBasedEmployeeHome.js:216` | `<LandingPageCard key={current} buttonSize={"medium"} {...propsForModuleCard} />` — renders one card per accessible employee module from MDMS `HomeScreenOrder.CardsAndLinksOrder` | as above | `feat/nairobi-overhaul-employee` R2-C | pending |

### `EmployeeModuleCard` wrapper (re-exports `LandingPageCard` from `digit-ui-react-components`)

| file:line | current usage | target Nairobi component | branch / phase that migrates it | status |
|---|---|---|---|---|
| `packages/react-components/src/atoms/EmployeeModuleCard.js:3` | `import { Button, LandingPageCard } from "@egovernments/digit-ui-components";` | rewrite the wrapper to render the Nairobi `EmployeeModuleCard` directly (no longer a `LandingPageCard` thin wrapper) | `feat/nairobi-overhaul-employee` R2-C | pending |
| `packages/react-components/src/atoms/EmployeeModuleCard.js:86` | `return <LandingPageCard className={className} buttonSize={buttonSize} {...propsForModuleCard} />;` | replace render with Nairobi `EmployeeModuleCard` body | `feat/nairobi-overhaul-employee` R2-C | pending |
| `packages/react-components/src/index.js:37,399` | top-level re-export of `EmployeeModuleCard, ModuleCardFullWidth` | keeps the same export name; only the implementation behind it changes | `feat/nairobi-overhaul-employee` R2-C | pending — export survives |

### `EmployeeModuleCard` consumers (per-module home tiles)

These render through `EmployeeModuleCard` so they migrate transitively when the wrapper is rewritten. They stay listed because each one's icon / metrics props need to map cleanly onto the Nairobi card's slot shape; the rewrite owner audits them one by one.

| file:line | current usage | target Nairobi component | branch / phase that migrates it | status |
|---|---|---|---|---|
| `packages/modules/pgr/src/components/PGRCard.js:4,73` | `<EmployeeModuleCard {...propsForModuleCard} />` — PGR module home tile | Nairobi `EmployeeModuleCard` (transitive via wrapper rewrite); PGR is the only employee module surfaced under Nairobi scope, so this is the highest-fidelity consumer | `feat/nairobi-overhaul-employee` R2-C | pending — primary surface |
| `packages/modules/hrms/src/components/hrmscard.js:1,54` | HRMS module tile | hidden per `EMPLOYEE-SCOPE.md` (HRMS is one of the modules suppressed by R1-D's three surfacing levers) | `feat/nairobi-overhaul-employee` R1-D hides; wrapper rewrite renders to nothing | will-not-render after R1-D |
| `packages/modules/workbench/src/components/WorkbenchCard.js:1,54` | Workbench module tile | hidden per `EMPLOYEE-SCOPE.md` | `feat/nairobi-overhaul-employee` R1-D hides | will-not-render after R1-D |
| `packages/modules/workbench/src/components/HRMSCard.js:1,41` | second HRMS tile inside Workbench | hidden per `EMPLOYEE-SCOPE.md` | `feat/nairobi-overhaul-employee` R1-D hides | will-not-render after R1-D |
| `packages/modules/sandbox/src/components/SandboxCard.js:1,38` | Sandbox / Utilities tile | hidden per `EMPLOYEE-SCOPE.md` | `feat/nairobi-overhaul-employee` R1-D hides | will-not-render after R1-D |
| `packages/modules/engagement/src/components/EngagementCard.js:5,160` | Engagement module tile (`longModuleName` variant) | not in Nairobi scope; if it survives, it inherits the wrapper rewrite | `feat/nairobi-overhaul-employee` R2-C (or hidden) | pending |

### DSS

`grep` did not surface any DSS module file directly importing `LandingPageCard` or `EmployeeModuleCard` in this tree. DECISIONS.md D-005 mentions DSS as a known consumer in upstream — if a DSS module gets pulled into this tree later, it lands on `feat/nairobi-overhaul-employee` with the same wrapper-swap pattern. Until then, no row.

---

## 🗑️ Hard-delete plan (`feat/nairobi-cleanup-landing-page-card` per D-005 step 3)

All of these get deleted or pruned in the final cleanup branch. They are listed here, not under "in-flight", because they are only safe to touch once every row above is `pending → done`.

| file:line | current usage | target Nairobi component | branch / phase that migrates it | status |
|---|---|---|---|---|
| `packages/digit-ui-components/src/molecules/LandingPageCard.js` (whole file) | the deprecated component itself | n/a — deleted | `feat/nairobi-cleanup-landing-page-card` | scheduled |
| `packages/digit-ui-components/src/molecules/index.js:20,57` | `import LandingPageCard from "./LandingPageCard"` + re-export | n/a — pruned | `feat/nairobi-cleanup-landing-page-card` | scheduled |
| `packages/digit-ui-components/src/index.js:309,423` | top-level `LandingPageCard` re-exports (twice — atoms group + molecules group) | n/a — pruned | `feat/nairobi-cleanup-landing-page-card` | scheduled |
| `packages/digit-ui-components/src/molecules/stories/LandingPageCard.stories.js` (whole file) | Storybook story for the deprecated card | n/a — deleted | `feat/nairobi-cleanup-landing-page-card` | scheduled |
| `packages/digit-ui-components/src/molecules/stories/LandingPageWrapper.stories.js` (whole file) | Storybook story; `LandingPageWrapper` follows `LandingPageCard` | n/a — deleted | `feat/nairobi-cleanup-landing-page-card` | scheduled |
| `packages/digit-ui-components/src/molecules/stories/MenuCardWrapper.stories.js:14` | docstring still references `LandingPageCards` | update copy or delete the story if Wrapper goes too | `feat/nairobi-cleanup-landing-page-card` | scheduled — copy fix |
| `packages/css/src/pages/employee/sandbox.scss:574,730,892` | `.digit-landing-page-card` SCSS overrides for the employee Sandbox surface | n/a — deleted alongside the component | `feat/nairobi-cleanup-landing-page-card` (Sandbox itself is hidden after R1-D, so the SCSS is dead earlier; pruning lands here for tidiness) | scheduled |

---

## How to keep this tracker honest

1. After every PR that touches a row, flip its `status`.
2. If `console.warn("[deprecated] LandingPageCard rendered …")` appears in dev for a flow whose row says `done` or `will-not-render`, the row is wrong — re-grep and fix the table before continuing.
3. The `📦 Employee scope` section is the gate for opening `feat/nairobi-cleanup-landing-page-card` — every row in that section must be `done` (or `will-not-render` with R1-D landed) before the cleanup branch is cut.
