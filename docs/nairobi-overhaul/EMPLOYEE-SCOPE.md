# Nairobi PGR Employee Scope

## Scope Frame

This document scopes only the employee-side Nairobi overhaul for PGR v1.

- In scope user jobs:
  - `CSR` filing a complaint on behalf of a citizen.
  - `GRO` searching/listing complaints and assigning them.
  - `LME` searching/listing complaints and resolving them.
- In scope product surface:
  - Employee shell.
  - PGR create complaint.
  - PGR search/list/inbox.
  - PGR complaint detail and workflow actions required to assign or resolve.
- Explicitly out of scope for surfaced navigation in v1:
  - `HRMS`
  - `Configurator / Sandbox`
  - `DSS dashboards`
  - `Workbench`
  - `Utilities`
  - `Engagement employee`
  - `Payment`
- Constraint:
  - Citizen Nairobi tokens are reused unchanged from `tokens.json`; employee is an extrapolation, not a new token system. Source: `/Users/kanavdwevedi/work/nairobi-citizen-theme/findings/tokens.json`

## Current Employee Surface Map

The employee app shell mounts all employee modules under `/${contextPath}/employee/:module`, then falls back to the employee home if no module route matches. Source: `packages/modules/core/src/components/AppModules.js:21-48`

The employee home is module-card driven, not hardcoded for PGR. In standard mode it renders every registered `${code}Card`; in role-based mode it builds landing cards from access-control actions where `url === "card"`. Sources:

- `packages/modules/core/src/components/Home.js:127-186`
- `packages/modules/core/src/components/RoleBasedEmployeeHome.js:94-117`

The employee sidebar is also access-control driven and already supports top-level module suppression through `globalConfigs.EMPLOYEE_MODULE_DENYLIST`. Source: `packages/modules/core/src/components/TopBarSideBar/SideBar/EmployeeSideBar.js:50-67`

That means v1 hiding is a surfacing problem in three places:

1. Sidebar URLs from access control. Source: `packages/modules/core/src/components/TopBarSideBar/SideBar/EmployeeSideBar.js:63-83`
2. Home cards from module card components or access-control cards. Sources:
   - `packages/modules/core/src/components/Home.js:127-186`
   - `packages/modules/core/src/components/RoleBasedEmployeeHome.js:163-223`
3. Quick-start / sandbox helper links for multi-root tenants. Source: `packages/modules/core/src/pages/employee/QuickStart/Config.js:13-49`

## Current PGR Employee Flow Map

PGR employee routes are registered in a dedicated switch:

- `CreateComplaint` at `match.url + Employee.CreateComplaint`
- `ComplaintDetails` at `match.url + Employee.ComplaintDetails + ":id*"`
- `InboxV2` at `match.url + Employee.InboxV2`
- `Inbox` at `match.url + Employee.Inbox`
- `Response` at `match.url + Employee.Response`

Source: `packages/modules/pgr/src/pages/employee/index.js:77-93`

The route constants resolve to:

- `Inbox = "/inbox"`
- `ComplaintDetails = PGR_EMPLOYEE_COMPLAINT_DETAILS`
- `CreateComplaint = PGR_EMPLOYEE_CREATE_COMPLAINT`
- `Response = "/response"`
- `InboxV2 = "/inbox-v2"`

Source: `packages/modules/pgr/src/constants/Routes.js:18-26`

The current employee create flow is not the citizen 6-step wizard. It is a single `FormComposer` with grouped sections for complainant details, complaint details, location, and additional details. Source: `packages/modules/pgr/src/pages/employee/CreateComplaint/index.js:191-281`

The current employee inbox already supports:

- search text
- filtering
- pagination
- desktop table
- mobile card rendering

Source: `packages/modules/pgr/src/pages/employee/Inbox.js:9-69`

The current complaint detail page already supports workflow-driven actions:

- `ASSIGN`
- `REASSIGN`
- `RESOLVE`
- `REJECT`
- `REOPEN`

and renders the action menu from `workflowDetails.data.nextActions`. Sources:

- `packages/modules/pgr/src/pages/employee/ComplaintDetails.js:285-333`
- `packages/modules/pgr/src/pages/employee/ComplaintDetails.js:457-471`

That is enough to support the v1 operational roles without expanding the product surface beyond PGR.

## Route Classification Rule

For this v1:

- `KEEP for v1` means the route must remain reachable and polished because it directly enables create/search/list/assign/resolve.
- `HIDE for v1` means the route stays in code and can remain directly addressable if needed, but must not be discoverable from sidebar, landing cards, quick links, or shell affordances.
- `DELETE eventually` means long-term non-target surface; do not delete now, but avoid investing Nairobi-specific styling into it.

---

## 1. In-Scope Routes (v1)

| Route | Current Module | Current File | Role |
| --- | --- | --- | --- |
| `/${contextPath}/employee` | Core employee shell + home fallback | `packages/modules/core/src/components/AppModules.js:38-48`, `packages/modules/core/src/components/Home.js:127-186` | All employee roles land here; for v1 this home should surface only PGR. |
| `/${contextPath}/employee/pgr/inbox` | PGR employee inbox | `packages/modules/pgr/src/pages/employee/index.js:87-92`, `packages/modules/pgr/src/pages/employee/Inbox.js:9-69` | `GRO`, `LME`, `CSR` primary list/search surface. |
| `/${contextPath}/employee/pgr/inbox-v2` | PGR inbox search composer variant | `packages/modules/pgr/src/pages/employee/index.js:90`, `packages/modules/pgr/src/pages/employee/new-inbox.js:1-56` | Keep registered as the richer search/list path; can become the desktop target if preferred over legacy inbox. |
| `/${contextPath}/employee/pgr/complaint/create` | PGR employee create complaint | `packages/modules/pgr/src/pages/employee/index.js:88`, `packages/modules/pgr/src/components/PGRCard.js:11-12`, `packages/modules/pgr/src/pages/employee/CreateComplaint/index.js:191-281` | `CSR` filing on behalf of citizen. |
| `/${contextPath}/employee/pgr/complaint/details/:id` | PGR complaint detail | `packages/modules/pgr/src/pages/employee/index.js:89`, `packages/modules/pgr/src/components/DesktopInbox.js:31-41`, `packages/modules/pgr/src/pages/employee/ComplaintDetails.js:334-471` | `GRO` assign/reassign, `LME` resolve, `CSR` inspect complaint. |
| `/${contextPath}/employee/pgr/response` | PGR response page | `packages/modules/pgr/src/pages/employee/index.js:92`, `packages/modules/pgr/src/pages/employee/CreateComplaint/index.js:168-171` | `CSR` post-create confirmation. |
| `/${contextPath}/employee/user/profile` | Shared employee profile | `packages/modules/core/src/pages/employee/index.js:91`, `packages/modules/core/src/components/TopBarSideBar/index.js:35-41` | All employee roles; needed because top bar dropdown exposes profile. |
| `/${contextPath}/employee/user/language-selection` | Shared employee language selector | `packages/modules/core/src/pages/employee/index.js:100-102`, `packages/modules/core/src/components/TopBarSideBar/TopBar.js:116-123` | All employee roles; needed because top bar exposes language change. |
| `/${contextPath}/employee/user/login` | Shared employee auth | `packages/modules/core/src/pages/employee/index.js:80-83` | All employee roles. |
| `/${contextPath}/employee/user/login/otp` | Shared employee OTP | `packages/modules/core/src/pages/employee/index.js:84-86` | All employee roles using OTP login flow. |
| `/${contextPath}/employee/user/forgot-password` | Shared employee auth recovery | `packages/modules/core/src/pages/employee/index.js:87-89` | All employee roles. |
| `/${contextPath}/employee/user/change-password` | Shared employee auth maintenance | `packages/modules/core/src/pages/employee/index.js:90-92` | All employee roles. |
| `/${contextPath}/employee/user/error` | Shared error route | `packages/modules/core/src/pages/employee/index.js:92-99` | Needed fallback if hidden module links are hit directly. |

### Keep Notes

- The minimum operational PGR keep set is really four PGR paths: inbox, inbox-v2, complaint create, complaint details, plus response. Source set:
  - `packages/modules/pgr/src/pages/employee/index.js:87-93`
  - `packages/modules/pgr/src/pages/employee/Inbox.js:9-69`
  - `packages/modules/pgr/src/pages/employee/CreateComplaint/index.js:191-281`
  - `packages/modules/pgr/src/pages/employee/ComplaintDetails.js:334-471`
- For navigation, `PGRCard` already narrows create access to `CSR` via `accessTo: ["CSR"]` in one link set and role filtering in another. Source: `packages/modules/pgr/src/components/PGRCard.js:11-12`, `packages/modules/pgr/src/components/PGRCard.js:22-48`
- For workflow actions, no new route is required for assign/resolve; they occur inside complaint detail modal/action bar. Source: `packages/modules/pgr/src/pages/employee/ComplaintDetails.js:62-194`, `packages/modules/pgr/src/pages/employee/ComplaintDetails.js:457-471`

---

## 2. Hidden Routes (v1)

These routes remain registered but must not be surfaced in sidebar, landing cards, quick links, or employee home composition.

| Route | Current Module | Nav-Suppression Mechanism | Long-Term Status |
| --- | --- | --- | --- |
| `/${contextPath}/employee/hrms/*` including `/inbox`, `/create`, `/response`, `/details/:tenantId/:id`, `/edit/:tenantId/:id` | HRMS | Add `HRMS` to sidebar denylist via `EMPLOYEE_MODULE_DENYLIST`; remove/disable `HRMSCard` from home card render; exclude HRMS access-control cards in role-based home. Sources: `packages/modules/core/src/components/TopBarSideBar/SideBar/EmployeeSideBar.js:50-67`, `packages/modules/hrms/src/components/hrmscard.js:13-48`, `packages/modules/hrms/src/pages/index.js:44-52` | Hide for v1; delete eventually from Nairobi-themed employee shell. |
| `/${contextPath}/employee/dss/*` including `/landing/:moduleCode`, `/dashboard/:moduleCode`, `/drilldown`, `/national-faqs`, `/national-about` | DSS | Add `DSS` to sidebar denylist; remove `DSSCard` and `NDSSCard` from home; keep direct URLs valid if linked elsewhere. Sources: `packages/modules/dss/src/Module.js:58-70`, `packages/modules/dss/src/components/DSSCard.js:27-87`, `packages/modules/core/src/components/TopBarSideBar/SideBar/EmployeeSideBar.js:50-67` | Hide for v1; delete eventually from Nairobi-specific employee nav. |
| `/${contextPath}/employee/engagement/event/*` | Engagement employee | Add `Engagement` to sidebar denylist; remove `EngagementCard` from home; do not style event inbox/forms for Nairobi v1. Sources: `packages/modules/engagement/src/Module.js:195-208`, `packages/modules/engagement/src/components/EngagementCard.js:107-131`, `packages/modules/core/src/components/TopBarSideBar/SideBar/EmployeeSideBar.js:50-67` | Hide for v1; delete eventually from employee Nairobi surface. |
| `/${contextPath}/employee/engagement/documents/*` | Engagement employee | Same as above: denylist sidebar, suppress `EngagementCard`, no landing tile. Sources: `packages/modules/engagement/src/Module.js:209-218`, `packages/modules/engagement/src/components/EngagementCard.js:132-151` | Hide for v1; delete eventually. |
| `/${contextPath}/employee/engagement/messages/*` | Engagement employee | Same as above. Sources: `packages/modules/engagement/src/Module.js:219-220`, `packages/modules/engagement/src/pages/employee/Messages/index.js:13-18`, `packages/modules/engagement/src/components/EngagementCard.js:84-106` | Hide for v1; delete eventually. |
| `/${contextPath}/employee/engagement/surveys/*` and `/${contextPath}/employee/engagement/survey/create-response` | Engagement employee | Same as above. Sources: `packages/modules/engagement/src/pages/employee/CitizenSurveys/index.js:15-23`, `packages/modules/engagement/src/components/EngagementCard.js:54-82` | Hide for v1; delete eventually. |
| `/${contextPath}/employee/workbench/*` including `/manage-master-data`, `/localisation-search`, `/mdms-*`, `/upload-boundary`, `/sidebar-*`, `/manage-schema` | Workbench | Add `Workbench` to sidebar denylist; remove `WorkbenchCard`; suppress workbench deep links from sandbox quick links where possible. Sources: `packages/modules/workbench/src/pages/employee/index.js:123-150`, `packages/modules/workbench/src/components/WorkbenchCard.js:14-48`, `packages/modules/core/src/components/TopBarSideBar/SideBar/EmployeeSideBar.js:50-67` | Hide for v1; delete eventually from this shell. |
| `/${contextPath}/employee/sandbox/*` including `/landing`, `/productPage`, `/productDetailsPage/:module`, `/tenant-*`, `/tenant-management/*`, `/application-management/*`, `/landing/select-role` | Sandbox / configurator | Add `Sandbox` top-level root to sidebar denylist; remove `SandboxCard`; suppress quick-start side panel on employee home; do not surface configure links from PGR/HRMS cards. Sources: `packages/modules/sandbox/src/pages/employee/index.js:74-108`, `packages/modules/sandbox/src/components/SandboxCard.js:13-34`, `packages/modules/core/src/components/Home.js:178-183`, `packages/modules/core/src/pages/employee/QuickStart/Config.js:25-49` | Hide for v1; keep code for admin/config usage outside Nairobi rollout. |
| `/${contextPath}/employee/utilities/*` including `/search/:moduleName/:masterName`, `/create/:moduleName/:masterName`, `/iframe/:moduleName/:pageName`, `/non-iframe/:moduleName/:pageName`, `/doc-viewer`, `/playground/*`, `/audit-log`, `/workflow` | Utilities | Add `Utilities` to sidebar denylist; do not render a module card if one is registered; do not link from home or quick links. Sources: `packages/modules/utilities/src/pages/employee/index.js:36-71`, `packages/modules/core/src/components/TopBarSideBar/SideBar/EmployeeSideBar.js:50-67` | Hide for v1; delete eventually from Nairobi shell. |
| `/${contextPath}/employee/payment/*` including `/collect/:businessService/:consumerCode`, `/success/:businessService/:receiptNumber/:consumerCode`, `/integration/:moduleName/:pageName`, `/failure` | Common payment | Keep route registered because downstream modules may still push to it, but remove any explicit employee home or sidebar surfacing; for Nairobi v1 do not expose payment as a first-class nav item. Source: `packages/modules/common/src/payments/employee/index.js:31-45` | Hide for v1; delete eventually only if no downstream dependency remains. |
| `/${contextPath}/employee/login`, `/${contextPath}/employee/forgot-password`, `/${contextPath}/employee/change-password` legacy fallthroughs | Core | Leave as technical redirects only; do not add any new nav affordance. Source: `packages/modules/core/src/components/AppModules.js:31-39` | Hide for v1. |
| `/${contextPath}/employee` home cards for non-PGR modules | Core employee home | Filter module cards so only `PGRCard` renders in standard home and only PGR access-control cards render in role-based home. Sources: `packages/modules/core/src/components/Home.js:127-186`, `packages/modules/core/src/components/RoleBasedEmployeeHome.js:94-117` | Hide for v1. |
| Quick-start helper links generated from `url === "card"` actions | Core quick setup | Disable the quick setup panel entirely for the Nairobi employee shell, or filter its generated `configEmployeeSideBar` to PGR-only. Source: `packages/modules/core/src/pages/employee/QuickStart/Config.js:25-49` | Hide for v1. |
| PGR configure-master shortcut to sandbox | PGR card cross-link | Remove/suppress `CONFIGURE_MASTER` link from `PGRCard` so Nairobi employee home does not leak configurator access. Source: `packages/modules/pgr/src/components/PGRCard.js:36-48` | Hide for v1. |
| HRMS configure-master shortcut to sandbox | HRMS card cross-link | Hidden automatically if `HRMSCard` is not rendered; otherwise also suppress `CONFIGURE_MASTER` link. Source: `packages/modules/hrms/src/components/hrmscard.js:13-24` | Hide for v1. |

### Hidden Route Implementation Notes

- Sidebar suppression already has the cleanest built-in lever: `window.globalConfigs.getConfig("EMPLOYEE_MODULE_DENYLIST")`. Source: `packages/modules/core/src/components/TopBarSideBar/SideBar/EmployeeSideBar.js:56-61`
- That lever is insufficient by itself because home cards are rendered independently of the sidebar. Sources:
  - `packages/modules/core/src/components/Home.js:132-139`
  - `packages/modules/core/src/components/RoleBasedEmployeeHome.js:94-117`
- The role-based home is especially important in multi-root deployments because it can surface module cards and configure links even when sidebar entries are denied. Source: `packages/modules/core/src/components/RoleBasedEmployeeHome.js:163-223`
- Quick-start is another leakage path in multi-root mode. Source: `packages/modules/core/src/components/Home.js:178-183`

### Recommended v1 Hide Policy

1. Sidebar:
   - Denylist all top-level modules except `PGR`.
2. Standard employee home:
   - Render only `PGRCard`.
3. Role-based employee home:
   - Filter access-control `card` actions to `parentModule === "PGR"` only.
4. Quick setup:
   - Disable entirely for Nairobi employee v1.
5. Cross-module deep links:
   - Remove configure/help/manual links that jump from PGR into sandbox/workbench.

---

## 3. Token Extrapolation Rules

These rules reuse citizen Nairobi tokens unchanged and extend them to desktop employee surfaces.

### Token Baseline

Core citizen tokens available from the Figma extraction:

- `brand.forest = #204F37`
- `surface.base = #FFFFFF`
- `brand.cta-yellow = #FEC931`
- `border.divider = #D6D5D4`
- `text.helper = #787878`
- `surface.app-bg = #FAFAFA`
- `text.primary = #000000`

Source: `/Users/kanavdwevedi/work/nairobi-citizen-theme/findings/tokens.json`

### Shell Rules

| Citizen token/component | Employee surface rule | Override / note |
| --- | --- | --- |
| `brand.forest #204F37` | Use as the employee shell color for sidebar background and top bar background. This keeps the citizen/employee family consistent. Sources: citizen token file, employee shell components at `packages/modules/core/src/components/TopBarSideBar/TopBar.js` and `packages/modules/core/src/components/TopBarSideBar/SideBar/EmployeeSideBar.js` | No token override; same value. |
| `surface.base #FFFFFF` | Use for all main canvases: inbox body, detail card, search panel, create wizard content panel. Sources: citizen token file, current PGR content renders inside `ground-container` and card-based components at `packages/modules/pgr/src/pages/employee/index.js:83-93`, `packages/modules/pgr/src/pages/employee/ComplaintDetails.js:334-471` | No override. |
| `surface.app-bg #FAFAFA` | Use as employee page background outside cards and tables, matching citizen app page fill. Source: citizen token file | No override. |
| `brand.cta-yellow #FEC931` | Keep as the primary CTA fill for primary buttons: create complaint submit, search apply, workflow modal save/assign/resolve, table action CTA. Source: citizen token file; primary button spec in `/Users/kanavdwevedi/work/nairobi-citizen-theme/findings/components.json` | No override. |
| `border.divider #D6D5D4` | Use for table row dividers, sidebar section separators, wizard step dividers, and filter group boundaries. Source: citizen token file | No override. |
| `text.helper #787878` | Use for helper copy, meta text, timestamps, empty-state descriptions, filter labels. Source: citizen token file | No override. |
| `text.primary #000000` | Use for CTA text on yellow buttons and body text on white surfaces. Source: citizen token file | No override. |

### Desktop Extrapolation Rules

Citizen is mobile-first, so these are explicit desktop extrapolations rather than Figma-backed facts.

1. Sidebar
   - Background: solid `#204F37`.
   - Width: fixed desktop rail; current `SideNav` can stay structurally, but visual theme should be aligned to Nairobi dark shell. Source: `packages/modules/core/src/components/TopBarSideBar/SideBar/EmployeeSideBar.js:189-204`
   - Item labels: white on default.
   - Active item: use white text with a pale green or white-tinted active container derived from the forest base.
   - Icons: keep existing icon glyphs from access-control metadata, but normalize them to white/default and yellow/active accent if the component allows.
   - Open question: citizen token file does not define a dedicated sidebar active or hover color.

2. Top bar
   - Use the same forest band as citizen header.
   - Keep only employee-specific actions on the right: city selector if required, language, user dropdown/logout. Source: `packages/modules/core/src/components/TopBarSideBar/TopBar.js:116-153`
   - Replace mixed light-theme appearance with Nairobi dark band and white logo/text treatment.
   - Open question: current top bar component uses `theme="light"` and DIGIT header internals; a Nairobi version may need a custom employee top bar rather than pure CSS. Source: `packages/modules/core/src/components/TopBarSideBar/TopBar.js:126-153`

3. PGR inbox table
   - Re-skin the existing `ComplaintTable` layout rather than replacing the data model. Source: `packages/modules/pgr/src/components/DesktopInbox.js:78-104`
   - Use white table surface on `#FAFAFA` page.
   - Convert status cells into Nairobi tag pills instead of plain text where feasible.
   - Keep SLA red/green semantics, but wrap them in pill/badge affordances instead of raw text.
   - Use compact yellow action buttons only where row-level actions are introduced later; current table links directly into detail view.

4. Search / filters
   - Style the search box with citizen text-input look and 8px rounding from the button/input family. Source: citizen component file.
   - Treat active filters as compact tags/chips using the citizen compact tag idiom.
   - Keep filters left-aligned on desktop but move them into a white filter rail or horizontal strip.
   - Open question: there is no extracted citizen desktop filter bar component, only mobile tags and inputs.

5. Complaint detail
   - Keep current card/timeline structure, but convert the summary card into Nairobi white cards with generous spacing.
   - Timeline checkpoints remain vertical but should inherit the citizen green-and-divider language.
   - SLA or workflow state pill can borrow the rounded geometry from citizen pill-like components.
   - Use yellow primary action button for `WF_TAKE_ACTION`, with the modal save button also yellow. Source: `packages/modules/pgr/src/pages/employee/ComplaintDetails.js:457-471`
   - Open question: citizen findings include success and tag patterns but no desktop timeline spec.

6. Create complaint
   - Replace the current grouped `FormComposer` page with a step wizard that mirrors citizen order:
     - Step 1: Type
     - Step 2: Sub-type
     - Step 3: Location pin
     - Step 4: Address / pincode
     - Step 5: Photos
     - Step 6: Additional details
     - Step 7: Assignee / routing for employee mode
   - CSR-only fields for complainant name and mobile should sit ahead of or within the wizard, not as an unstructured form block.
   - Open question: whether assignee selection happens in create or only after creation depends on desired workflow shortcut; current code does not assign during create. Sources:
     - citizen screens: `/Users/kanavdwevedi/work/nairobi-citizen-theme/findings/screens.json`
     - current employee create: `packages/modules/pgr/src/pages/employee/CreateComplaint/index.js:191-281`

### Explicit Non-Token Overrides Needed

These are not new design tokens; they are layout conventions required because employee is desktop-first.

- Sidebar width.
- Desktop content max width and page gutters.
- Table row height.
- Wizard stepper layout across wide screens.
- Filter rail versus inline filter strip.
- Modal width for assign/resolve.
- Empty-state card sizing.

Those values do not exist in the citizen extraction and must be set as employee-only layout decisions.

---

## 4. Component Mapping

| Citizen Nairobi component | Employee equivalent | Current file path | Action |
| --- | --- | --- | --- |
| `Header / Citizen / Mobile` from screens and forest token usage | Employee top bar with city, language, profile/logout | `packages/modules/core/src/components/TopBarSideBar/TopBar.js` | `REWRITE` |
| Citizen back bar / green header strip | Employee breadcrumb + page header band | `packages/modules/pgr/src/pages/employee/index.js`, `packages/modules/dss/src/Module.js`, `packages/modules/workbench/src/pages/employee/index.js` | `REWRITE` for PGR pages; no Nairobi work needed for hidden modules |
| `Button / Primary / Full Width` | Primary CTA button on employee desktop forms, modal saves, wizard next/submit | Existing CTA points in `packages/modules/pgr/src/pages/employee/CreateComplaint/index.js`, `packages/modules/pgr/src/pages/employee/ComplaintDetails.js` | `KEEP` token family, `REWRITE` sizing/layout for desktop |
| `Button / Secondary / Upload Photos` | Secondary outlined action for photo upload in CSR create | Future employee create wizard; current upload support is modal/file upload in `packages/modules/pgr/src/pages/employee/ComplaintDetails.js:172-185` | `NEW` employee usage |
| Citizen service card / complaint entry emphasis | Employee `PGRCard` home card | `packages/modules/pgr/src/components/PGRCard.js` | `REWRITE` to be the single visible module card in v1 |
| Citizen complaint list card with status tag | Employee inbox table row / mobile complaint card | `packages/modules/pgr/src/components/DesktopInbox.js`, `packages/modules/pgr/src/components/MobileInbox.js` | `REWRITE` |
| Citizen text input styling | Employee search box and wizard fields | Search at `packages/modules/pgr/src/components/inbox/search.js` and create fields in `packages/modules/pgr/src/pages/employee/CreateComplaint/index.js` | `REWRITE` |
| Citizen tag / compact tag | Employee filter chips and status tags | Filters under `packages/modules/pgr/src/components/inbox/Filter.js`, status cell in `packages/modules/pgr/src/components/DesktopInbox.js:54-58` | `REWRITE` |
| Citizen success panel | Employee create response | `packages/modules/pgr/src/pages/employee/Response.js` | `REWRITE` |
| Citizen 6-step filing wizard | Employee CSR filing wizard with extra assignee step | `packages/modules/pgr/src/pages/employee/CreateComplaint/index.js` | `REWRITE` |
| Citizen map thumbnail / zoom control | Employee location step map card | No dedicated employee create step yet; current detail uses placeholder `MapView` in `packages/modules/pgr/src/pages/employee/ComplaintDetails.js:32-36` | `NEW` |
| Citizen pill-like status geometry | Employee SLA pill / workflow state pill | `packages/modules/pgr/src/components/DesktopInbox.js:22-24`, `packages/modules/pgr/src/pages/employee/ComplaintDetails.js:394-434` | `NEW` |
| Citizen shell typography and color pairing | Employee sidebar nav item + top bar label system | `packages/modules/core/src/components/TopBarSideBar/SideBar/EmployeeSideBar.js`, `packages/modules/core/src/components/TopBarSideBar/TopBar.js` | `REWRITE` |

### Keep / Rewrite / New Summary

- `KEEP`
  - PGR route structure.
  - PGR complaint detail workflow mechanics.
  - Existing access-control sidebar denylist hook.
  - Existing access-control home-card composition model.
- `REWRITE`
  - Employee top bar.
  - Employee sidebar visual treatment.
  - PGR home card.
  - Inbox desktop search/filter/table styling.
  - Complaint detail presentation.
  - Employee response screen.
  - Employee create flow structure.
- `NEW`
  - Desktop wizard stepper pattern.
  - Desktop assignee step UI.
  - SLA pill/tag pattern.
  - Desktop map card for location step.
  - PGR-only employee landing composition if the generic module home proves too broad.

---

## 5. Open Questions

1. Should v1 keep both `/employee/pgr/inbox` and `/employee/pgr/inbox-v2` visible, or should one become the canonical Nairobi search/list experience?
   - Current code registers both. Source: `packages/modules/pgr/src/pages/employee/index.js:88-92`

2. Does CSR create need assignment during the create flow, or should complaint creation still land first and assignment remain a GRO action from detail?
   - Current create route does not assign; current detail flow does. Sources:
     - `packages/modules/pgr/src/pages/employee/CreateComplaint/index.js:151-171`
     - `packages/modules/pgr/src/pages/employee/ComplaintDetails.js:285-333`

3. If assignee is added to create, which role set should populate it?
   - Current assign modal derives assignees from workflow `assigneeRoles` and `useEmployeeFilter`. Source: `packages/modules/pgr/src/pages/employee/ComplaintDetails.js:62-80`

4. Should `REJECT` and `REOPEN` remain visually present in v1, or only `ASSIGN` and `RESOLVE` be emphasized?
   - They are currently supported as next actions. Source: `packages/modules/pgr/src/pages/employee/ComplaintDetails.js:302-321`

5. What is the Nairobi desktop analogue for sidebar hover, active, and selected states?
   - Citizen tokens define main colors but not desktop nav interaction tokens. Source: `/Users/kanavdwevedi/work/nairobi-citizen-theme/findings/tokens.json`

6. What is the desktop typography scale?
   - Citizen extraction gives button and mobile component typography, but not a full desktop hierarchy. Source: `/Users/kanavdwevedi/work/nairobi-citizen-theme/findings/components.json`

7. What is the desired desktop table spec?
   - Current inbox is a generic DIGIT table with custom columns; citizen findings only show mobile complaint cards. Sources:
     - `packages/modules/pgr/src/components/DesktopInbox.js:26-104`
     - `/Users/kanavdwevedi/work/nairobi-citizen-theme/findings/screens.json`

8. What should the complaint detail header prioritize on desktop: complaint number, status, SLA, assignee, or complaint type?
   - Current screen is summary-table-first, not hero-header-first. Source: `packages/modules/pgr/src/pages/employee/ComplaintDetails.js:334-393`

9. Should the employee home remain the generic core home with all non-PGR cards filtered away, or should Nairobi ship a dedicated PGR-only home component?
   - Current home is generic and module-card driven. Sources:
     - `packages/modules/core/src/components/Home.js:127-186`
     - `packages/modules/core/src/components/RoleBasedEmployeeHome.js:163-223`

10. For multi-root deployments, should sandbox quick-setup be globally disabled or only hidden for Nairobi employee roles?
    - Current quick setup appears for superusers with multiple root tenant. Source: `packages/modules/core/src/components/Home.js:178-183`

11. Is employee payment intentionally out of scope even when downstream modules could deep-link to it?
    - Payment routes are still registered and may be reached indirectly. Source: `packages/modules/common/src/payments/employee/index.js:31-45`

12. Should hidden modules receive zero Nairobi styling work, or should base shell theming still apply if users deep-link into them?
    - This affects effort and regression risk across `hrms`, `dss`, `engagement`, `workbench`, `sandbox`, and `utilities`.

13. Does the employee top bar still need city switching in Nairobi v1?
    - Current top bar includes `ChangeCity` in employee mode. Source: `packages/modules/core/src/components/TopBarSideBar/TopBar.js:116-123`

14. Should the employee shell preserve the existing DIGIT breadcrumb pattern, or should Nairobi replace breadcrumbs with a stronger page-title/header strip?
    - Many modules currently provide their own breadcrumb implementations. Sources:
      - `packages/modules/pgr/src/pages/employee/index.js:12-41`
      - `packages/modules/dss/src/Module.js:12-49`
      - `packages/modules/workbench/src/pages/employee/index.js:23-74`
      - `packages/modules/sandbox/src/pages/employee/index.js:19-56`

15. Do we want mobile employee support in v1, or can Nairobi employee optimize primarily for desktop/tablet?
    - Current PGR inbox has dedicated mobile rendering. Source: `packages/modules/pgr/src/pages/employee/Inbox.js:46-64`

## Recommended v1 Outcome

If the goal is the narrowest coherent Nairobi employee rollout, the product should behave like this:

1. Employee login lands into a Nairobi-themed shell that visually mirrors the citizen green/yellow system.
2. Employee home shows only the PGR module card.
3. Sidebar shows only PGR.
4. PGR offers:
   - Create complaint for `CSR`
   - Search/list complaints for all PGR employee roles
   - Complaint detail with assign/resolve workflow actions
5. All other employee modules stay deployed but undiscoverable from the Nairobi v1 shell.

That matches the existing code architecture because routing can remain broad while surfacing is aggressively narrowed through:

- sidebar denylist
- home-card filtering
- quick-link suppression
- cross-module link removal

Sources:

- `packages/modules/core/src/components/TopBarSideBar/SideBar/EmployeeSideBar.js:50-67`
- `packages/modules/core/src/components/Home.js:127-186`
- `packages/modules/core/src/components/RoleBasedEmployeeHome.js:94-223`
- `packages/modules/core/src/pages/employee/QuickStart/Config.js:25-49`
