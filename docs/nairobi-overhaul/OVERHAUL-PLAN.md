# Nairobi Citizen Theme — Destructive Replication Plan for `digit-ui-esbuild`

Branch: `feat/nairobi-overhaul-citizen` · Worktree: `/Users/kanavdwevedi/work/nairobi-overhaul/`

Sources of truth (do not re-derive):
- `/Users/kanavdwevedi/work/nairobi-citizen-theme/findings/tokens.json` — 33 colors, 31 type styles, 10 radii, 26 spacings, 4 shadows, 6 icon sizes, 7 divergences.
- `/Users/kanavdwevedi/work/nairobi-citizen-theme/findings/components.json` — 32 components (4 buttons, 5 cards, 1 header, 19 icons, 1 OTP pill, 2 tags) + 6 patterns. **Default visual state only — no hover/disabled/focus data was in the canvas at extraction time.**
- `/Users/kanavdwevedi/work/nairobi-citizen-theme/findings/screens.json` — 10 screens (Home, 6-step complaint flow, OTP, Success, My Complaints).

Scope: Citizen surfaces only. Employee theme stays untouched.

---

## 1. Token map

Frequency-weighted canonical token table. "Current digit-ui mapping" lists where the value lives **today** and therefore where the rebind must land.

### 1.1 Color (sorted by frequency)

| Semantic name | Hex (alpha) | Role | Frequency | Current digit-ui mapping |
|---|---|---|---|---|
| `brand.forest` | `#204F37` | Header, sidenav, brand text/icons, secondary outline border | 196 | rebind `tailwind.config.js → digitv2.lightTheme.header-sidenav` (today `#0B4B66`); rebind `Colors.lightTheme.primary[2]` in `packages/digit-ui-components/src/constants/colors/colorconstants.js` (today `#0B4B66`); used by `topbar.scss`, `sidebar.scss`, `headerV2.scss` |
| `surface.base` | `#FFFFFF` | Card / sheet / button-secondary fill | 186 | already `tailwind.colors.white`; `Colors.lightTheme.paper.primary`; `digitv2.lightTheme.paper` — keep |
| `brand.cta-yellow` | `#FEC931` | Primary CTA fill | 85 | rebind `tailwind.colors.primary.main` (today `#c84c0e`); rebind `Colors.lightTheme.primary[1]` (today `#C84C0E`); `tailwind.colors.focus`; `boxShadow.radiobtn` |
| `border.divider` | `#D6D5D4` | Card divider, map-control border | 64 | already `tailwind.colors.border` and `digitv2.lightTheme.divider` — keep |
| `text.helper` | `#787878` | Helper / sub-copy / map-zoom label | 60 | already `Colors.lightTheme.text.secondary` — keep |
| `surface.app-bg` | `#FAFAFA` | Page background | 32 | already `digitv2.lightTheme.paper-secondary` and `Colors.lightTheme.paper.secondary` — keep |
| `text.primary` | `#000000` | Button label on yellow CTA, "Next" labels | 30 | already `tailwind.colors.black`. **Behavioural rebind**: button label color must flip from white→black because CTA bg flips orange→yellow. |
| `text.body-strong` | `#191C1D` | Body copy on cards | 28 | **NEW token** — not currently in palette. Add to `Colors.lightTheme.text.bodyStrong` and `tailwind.colors.text.bodyStrong`. |
| `surface.cta-tint` (alpha 0.2) | `#FEC931` @ 20% | Yellow tint background | 26 | **NEW token** — add as `surface.ctaTint` |
| `surface.brand-tint` | `#E8F3EE` | "Back" strip below header, secondary surfaces | 25 | **NEW token** — add as `surface.brandTint`. Has no DIGIT analogue (DIGIT uses neutral grey). |
| `overlay.scrim` (0.15) | `#000000` @ 15% | Button shadow color | 21 | bake into `boxShadow.button` (see shadows below) |
| `text.secondary.tint80` | `#1D2433` @ 80% | Secondary black text token in Figma library | 17 | not currently a token — fold into `text.body-strong` for now (visually equivalent at 80% alpha on white) |
| `border.neutral-200` | `#E6E6E6` | Illustration / divider edge | 14 | not present in tailwind/Colors — add as `border.neutral200` |
| `text.form-label` | `#363636` | Form labels (Pincode, City, etc.) | 12 | already `Colors.lightTheme.text.primary` (`#363636`). Keep — but note tailwind `text.primary` is `#0B0C0C`, so this is asymmetric. |
| `illustration.blue` | `#2A5084` | undraw illustration accent | 11 | not a token — leave inline in illustration SVG only |
| `border.neutral-300` | `#E1E6EF` | Stale Figma "Neutral/300" / "Neutral/0" frames | 10 | not currently a token; **do not add** — these are dragged-in legacy frames per tokens.md, not Nairobi intent |
| `overlay.scrim` (0.12) | `#000000` @ 12% | Input drop shadow | 10 | bake into `boxShadow.input` |
| `text.primary-alt` | `#0B0C0C` | DIGIT-legacy text token preserved | 7 | already `tailwind.colors.text.primary` — **keep but downgrade**: not the canonical body color (only 7 hits). Body should resolve to `#191C1D`. |
| `overlay.scrim` (0.16) | `#000000` @ 16% | Card shadow | 6 | already `boxShadow.card: "0 1px 2px 0 rgba(0, 0, 0, 0.16)"` — keep |
| `illustration.ink` | `#090814` | undraw illustration ink | 6 | inline SVG only — no token |
| `surface.cta-tint` (0.8) | `#FFF4D6` @ 80% | ComplaintTag fill, OTP pill fill | 5 | **NEW token** — add `surface.ctaTintWeak` |
| `icon.fill` | `#D9D9D9` | Map zoom-in/out icon stroke | 3 | flagged accident in tokens.md — leave as inline icon color |
| `illustration.blue-deep` | `#1D4672` | "Helpful Context Card" icon | 3 | flagged accident — inline only |
| `accent.unmapped` | `#F2F2F2` `#B7B7B7` `#F7F7F7` `#F3F5F8` `#2F2E41` | Stray Figma frames | 1–3 each | **all flagged accident in tokens.md** — drop; do not introduce |
| `border.neutral` | `#282828` | One stray "Neutral/300" frame | 2 | accident — drop |
| `accent.unmapped` | `#C62828` | Failure status panel bg | 1 | not yet a token, but `Status Result Card` pattern needs it. Map onto existing `tailwind.colors.error: #D4351C` for now — note divergence. |
| `accent.unmapped` | `#2E7D32` | Success status panel bg | 1 | map onto `tailwind.colors.success: #00703C` for now — note divergence. screens.json calls this out as the success-panel color. |

### 1.2 Typography

Single font-family swap: **Roboto → Inter** (216 hits Inter, 29 stale Roboto, 7 SF Pro Text from iOS status bars and ignored).

| Style | Family / weight / size / line | Frequency | Current digit-ui mapping |
|---|---|---|---|
| `Heading/H3-Semibold` | Inter 600 / 20 / 24 | 29 | Used for **CTA button labels** ("Next", "Skip and Continue", "Go back to Home") — collides with DIGIT's `text-btn` (16/24, Roboto 500). Rewrite `.button` SCSS. |
| `Heading/H4` (Inter 700 16/18) | Inter 700 / 16 / 18 | 28 | Card headings; map to tailwind `caption-m` slot |
| `Body/Regular` | Inter 400 / 14 / 20 | 28 | maps to tailwind `body-s` (currently 14/16) — bump line-height to 20 |
| `Heading/H4` (Roboto 700 16/19) | Roboto 700 / 16 / 19 | 24 | **stale Roboto** per tokens.md — rebind family to Inter |
| `Body/Medium-Large` | Inter 500 / 16 / 19 | 21 | "Back" label on header strip; new |
| `Body/Medium` | Inter 500 / 14 / 23 | 19 | Helper paragraph on form steps; new |
| `Body/Regular-Large` | Inter 400 / 16 / 24 | 16 | maps to `body-l` (16/24) — keep size, swap family |
| `Heading/H2` (28/38) | Inter 700 / 28 / 38 | 14 | Step page titles ("Pin Property Location", "OTP Verification") — closest tailwind: `heading-xl` 32/40. Tighten size to 28. |
| `Subheading/Semibold` | Inter 600 / 16 / 18 | 9 | Sub-type labels |
| `Body/Medium-Large` (16/16) | Inter 500 / 16 / 16 | 7 | Form-field labels |
| `Caption/Regular` | SF Pro Text 400 / 12 / 16 | 7 | iOS status bar — **drop, not in scope** |
| `Heading/H1` | Inter 700 / 32 / 39 | 2 | Success/Failure result page title — maps to `heading-xl` 32/40 |
| `Heading/H2` (Roboto 24/28) | Roboto 700 / 24 / 28 | 2 | Stale Roboto — rebind to Inter |
| `Heading/H4` (Roboto 18/21) | Roboto 700 / 18 / 21 | 2 | Stale Roboto — rebind to Inter |

Action: `tailwind.config.js → fontFamily.sans = ["Inter", "sans-serif"]`. Drop `fontFamily.rc` ("Roboto Condensed") from citizen-only entry points (employee can keep it). Remove the commented Google Fonts URL line and add an Inter @font-face in `index.scss`.

### 1.3 Radius

| Token | Value | Frequency | Mapping |
|---|---|---|---|
| `rounded-md` | `8px` | 81 + 7 (6px) | **New default for buttons/panels.** DIGIT today uses `4px` everywhere — rebind. |
| `rounded-sm` | `4px` | 54 | Tags / inputs / status panel inside Status Result Card |
| `rounded-lg` | `12px` | 45 + 20 (top-only `12px 12px 0 0`) + 1 (`8px 8px 0 0`) + 1 (`0 0 8px 8px`) | **Cards.** Citizen cards must round 12px; bottom action sheet uses `12px 12px 0 0`. |
| `rounded-pill` | `34px 8px 8px 34px` / `90px` | 1 + 1 | Outliers — only used by stale Figma "Neutral/300" frame. Don't add. |

### 1.4 Spacing

| Token | Value | Frequency | Note |
|---|---|---|---|
| `padding/0px` | `0px` | 372 | Default reset |
| `gap/16px` | `16px` | 171 | Page-level vertical rhythm. Tailwind `padding.md` already 16px. |
| `padding/16px` | `16px` | 123 | Page padding (matches screens.json `padding: 16px`) |
| `gap/8px` | `8px` | 105 | Inline rhythm; tailwind `padding.sm` already 8px |
| `gap/4px` | `4px` | 69 | Form-row rhythm |
| `gap/12px` | `12px` | 48 | Card stacks |
| `padding/8px 24px` | `8px 24px` | 29 | **Primary button padding contract** |
| `padding/2px` | `2px` | 23 | Icon hit area |
| `padding/0px 9px` | `0px 9px` | 21 | Back-strip padding |
| `padding/4px 0px 0px` | `4px 0px 0px` | 18 | Helper-message margin |
| `gap/10px` | `10px` | 16 | Various |
| `padding/8px 9px` | `8px 9px` | 8 | Field flexible |
| `padding/4px 12px` | `4px 12px` | 6 | Tag / secondary button padding contract |

Tailwind already has `sm:8 md:16 lg:24 xl:36` and `margin xs:4 sm:8 md:16 lg:24 xl:64`. Add: `padding.btn = "8px 24px"`, `padding.tag = "4px 12px"`, `padding.backStrip = "0 9px"`, `gap.12 = 12px`.

### 1.5 Shadow

| Token | Value | Frequency | Mapping |
|---|---|---|---|
| `shadow.card` | `0px 1px 2px rgba(0, 0, 0, 0.16)` | 6 | already `tailwind.boxShadow.card` — keep |
| `shadow.button` | `0px 2px 7px rgba(0, 0, 0, 0.15)` | 20 | **NEW** — used by primary CTA / bottom action tray |
| `shadow.input` | `0px 2px 2px rgba(0, 0, 0, 0.12)` | 10 | **NEW** — used on form inputs in 6-step flow |
| `shadow.input` (alt) | `0px 2px 2px rgba(0, 0, 0, 0.15)` | 1 | one-off — fold into the 0.12 variant |

### 1.6 Icon

| Token | Size | Frequency | Mapping |
|---|---|---|---|
| `icon-24` | 24×24 | 79 | Default — covers all `Icons / *` (menu, arrow_left, lightbulb, delete, opacity, plumbing, pest_control, pets, more_horiz, location_on, close, check_circle small) |
| `icon-20` | 20×20 | 8 | Secondary button icons (file_upload, layers, add_box) |
| `icon-40` | 40×40 | 8 | Rating star (My Complaints) |
| `icon-16` | 16×16 | 4 | Tag delete icon |
| `icon-48` | 48×48 | 2 | Status Result Card hero icon (check_circle, error) |
| `icon-45` | 45×40 | 2 | rating star half — accident; treat as 40 |

---

## 2. Component map

| Nairobi spec name | digit-ui current implementation | Action |
|---|---|---|
| Button / Primary / Full Width | `packages/digit-ui-components/src/atoms/Button.js` (variant primary) + `packages/css/src/components/buttons.scss` + `packages/digit-ui-components/src/atoms/SubmitBar.js` | **REWRITE** — flip bg `#c84c0e → #FEC931`, label color `white → #000`, font `Roboto 500 16 → Inter 600 20`, height `39 → 40`, radius `4 → 8`, add `shadow.button`. (Hover/disabled states **NOT in findings — needs separate review.**) |
| Button / Primary / Status Card | same Button atom, narrower width 300px | **REWRITE** alongside above; same skin, width comes from parent `StatusResultCard` |
| Button / Secondary / Add Photos | DIGIT outline button via `ButtonSelector.js` (orange outline `#c84c0e`) | **NEW** as `PhotoActionButton` — green outline `#204F37`, Inter 500 16, left icon-20 slot |
| Button / Secondary / Upload Photos | same DIGIT outline button | **NEW** — same `PhotoActionButton` (just a different label/icon) |
| Card / Map Thumbnail Shadow | not directly present; use `Card.js` (`packages/digit-ui-components/src/atoms/Card.js`) with `cardV2.scss` | **REWRITE** card defaults: 12px radius, `shadow.card`, no border |
| Card / Map Zoom Control / Top, Middle, Bottom | not present | **NEW** as `MapZoomControlStack` molecule (3 stacked segments, `8px 8px 0 0`, `0`, `0 0 8px 8px` radii) |
| Card / Surface Shadow / Default | `Card.js` + `cardV2.scss` | **REWRITE** as part of card refresh |
| Header / Citizen / Mobile | `packages/modules/core/src/components/TopBarSideBar/TopBar.js` + Header in `digit-ui-components` (`Header.js` / `HeaderBar.js`) + `topbar.scss`, `headerV2.scss` | **NEW** as `CitizenMobileHeader` (forest #204F37 bg, white menu icon, optional pale-green back strip). Existing TopBar stays for employee. |
| Icons / arrow_left / 24×24 | `packages/svg-components/` & `packages/react-components/src/atoms/svgindex.js` | **KEEP** SVG, **REWRITE** color contract — rebind to `currentColor` consumed via Nairobi forest |
| Icons / check_circle / 24×24 + 48×48 | same SVG library | **KEEP** — caller controls size |
| Icons / close, delete (16/24), error (48), file_upload (20), grade (40/45), layers (20), lightbulb (24), location_on (24), menu (24), more_horiz (24), opacity (24), pest_control (24), pets (24), plumbing (24) | mostly already in `svg-components` | **KEEP** existing SVGs; verify the 8 PGR-category icons (lightbulb, opacity, plumbing, pest_control, pets, delete, more_horiz, location_on) are all present at sizes 16/24/40/48. If missing — minor **NEW** SVG additions; pull from Material Symbols. |
| Pill / OTP Countdown | not present (current OTP screen uses no countdown pill) | **NEW** as `OtpCountdownPill` (yellow-tint bg `rgba(255,244,214,0.8)`, 6px radius, 0 8px padding, Inter 600 16) |
| Tag / Complaint Type / Default + Compact | `Tag.js` atom + `tag.scss` + `tagV2.scss` | **REWRITE** as `ComplaintTag` — yellow-tint bg, green border `#204F37`, green text, green delete icon; existing peach `#FBEEE8` + blue border DIGIT skin removed for citizen surface |
| **Patterns** | | |
| Citizen Mobile Header Shell | `TopBar.js` + `topbar.scss` | covered by `CitizenMobileHeader` |
| Bottom CTA Tray | scattered today (each Steps/* file renders its own SubmitBar via `FormStep.js` / `ActionBar.js`) | **NEW** as `BottomCtaTray` (white sheet, top shadow, single primary CTA, optional secondary above) — replaces ad-hoc `actionbar.scss` patterns for citizen flows |
| Status Result Card | `Response.js` in `packages/modules/pgr/src/pages/citizen/` and `packages/modules/pgr/src/pages/citizen/Create/Response.js` use `BannerCard` / `Banner` today | **NEW** as `StatusResultCard` (white shadow card / 8px-radius status panel #2E7D32 success or #C62828 failure / 48px icon / H1 32px / body / 300px primary CTA) |
| **Citizen-flow primitives also in scope** | | |
| Form labels / inputs | `TextInput.js`, `textInputV2.scss` | **REWRITE** — labels Inter 500 16/16 #363636, inputs gain `shadow.input`, 4px radius, 8px 9px padding |
| FormComposer / FormStep | `FormStep.js`, `FormCard.js`, `FormComposerV2.scss` | **REWRITE** wrapper to drop legacy 4px radii, force Inter; container becomes white card with `shadow.card` and 12px radius when used as a step shell |
| TypeSelectCard (used by `SelectComplaintType`, `SelectSubType`) | `packages/react-components/src/molecules/TypeSelectCard.js` | **REWRITE** — list of category cards must adopt new radius, gap, Inter typography, tap target padding 16. Default radio uses Nairobi green checkmark instead of orange dot. |
| LandingPageCard | `packages/digit-ui-components/src/molecules/LandingPageCard.js` | **DELETE from citizen Home** (already flagged). Replace with new `ServiceCard` (Quick Pay / Complaints) — yellow-tint background `#FFF4D6`, illustration left/right, Inter Subheading 600 16/114%. |
| CitizenSideBar / StaticCitizenSideBar | `packages/modules/core/src/components/TopBarSideBar/SideBar/CitizenSideBar.js`, `StaticCitizenSideBar.js` + `sidebar.scss`, `staticSideBar.scss` | **REWRITE** — header background to `#204F37`, hover/active state to `#E8F3EE`, font swap to Inter. Hover/disabled details **not in findings — needs separate review.** |
| BackLink | `packages/digit-ui-components/src/atoms/BackLink.js` + `backButtonV2.scss` | **REWRITE** as Nairobi back strip (pale green `#E8F3EE` bg, forest text `#204F37`, Inter 500 16/19, 0 9px padding, top radius 12) |
| Login (mobile + OTP) screens | `packages/modules/core/src/pages/citizen/Login/` | **REWRITE** to compose new header + bottom CTA tray + OTP pill; existing `SelectMobileNumber.js` / `SelectOtp.js` / `SelectName.js` keep their data flow but render new atoms |

> All "REWRITE" rows that depend on hover/disabled/focus visuals are blocked: components.json captured **default state only**. Listed where it matters.

---

## 3. Screen map

For each Nairobi screen: current digit-ui route → current composition → target composition → delta.

| # | Nairobi screen (Figma node) | Current digit-ui route | Current composition (files) | Target Nairobi composition | Delta |
|---|---|---|---|---|---|
| 1 | Citizen / Home (Android - 106) | `/citizen` (post-login) | `packages/modules/core/src/pages/citizen/Home/index.js` → renders `CardBasedOptions` of `LandingPageCard`s + `WhatsNewCard` | `CitizenMobileHeader` + Welcome ("Hello, John Doe", Inter 700 24/38) + 2× `ServiceCard` (Quick Pay, Complaints) — vertical stack, 16 padding | Replace `CardBasedOptions` grid with new vertical `ServiceCard` stack. Drop tile-style icons. Hide all the secondary `appBanner*` / `whatsAppBanner*` / `WhatsNewCard` artifacts on Nairobi tenant. |
| 2 | Step 1: Type Selection (Android - 83) | `/citizen/complaint/create/complaint-type` | `packages/modules/pgr/src/pages/citizen/Create/Steps/SelectComplaintType.js` → `TypeSelectCard` | `CitizenMobileHeader` + H2 "Choose Complaint Type" + helper paragraph (Inter 500 14/23 #787878) + scrollable category list (each row: 24-icon + Inter 700 16/18 label + chevron, 16 padding, 12 gap, divider) | Rewrite `TypeSelectCard` row visuals. Submit happens on row tap (no bottom CTA). |
| 3 | Step 2: Sub-type Selection (Android - 86) | `/citizen/complaint/create/sub-type` | `Steps/SelectSubType.js` → `TypeSelectCard` | `CitizenMobileHeader` + back-strip ("Back", `surface.brand-tint`) + H2 "Choose Complaint Sub Type" + helper + radio list with Subheading 600 16/18 labels + selected-row outline forest | Need new `BackStrip` molecule (now mapped onto `BackLink` rewrite). Sub-type rows render as radio rows, not card grid. |
| 4 | Step 3: Pin Location (Android - 91) | `/citizen/complaint/create/map` | `Steps/SelectGeolocation.js` (currently a single big leaflet map with overlay submit) | `CitizenMobileHeader` + back-strip + H2 "Pin Property Location" + helper + map (with **`MapZoomControlStack`** floating right) + `BottomCtaTray` ("Next" primary + "Skip and Continue" secondary text-link) | New `MapZoomControlStack` molecule. New `BottomCtaTray` replaces inline submit. |
| 5 | Step 4: Pincode + Address (Android - 92) | combined into TWO routes today: `/citizen/complaint/create/pincode` and `/citizen/complaint/create/address` (see `defaultConfig.js`) | `Steps/SelectPincode.js` + `Steps/SelectAddress.js` | Single screen: header + back-strip + H2 "Do you know the pincode?" / "Provide Complainant Address" + 4-field form (Pincode, City, Mohalla, Landmark) + `BottomCtaTray` | **Routing change.** Either (a) merge `pincode` and `address` into one step, or (b) keep two screens but render with same shell. Plan recommends (b) — fewer redirects, same chrome. `Steps/SelectLandmark.js` is currently a third route — Figma folds it into "Provide Landmark" which is its own H2 (Android - 90). So Nairobi flow is actually 6 conceptual steps but uses 7 internal routes. Document this divergence; do not collapse routes for v1. |
| 6 | Step 5: Upload Photos (Android - 95) | `/citizen/complaint/create/upload-photos` | `Steps/SelectImages.js` (uses `MultiUploadWrapper` / `UploadFile`) | header + back-strip + H2 "Upload Complaint Photos" + helper + `PhotoActionButton` ("Add Photos") + thumbnail grid + `BottomCtaTray` | Replace orange outline upload button with `PhotoActionButton`. Empty state needs subtle upload illustration ("Your uploaded images will appear here once they are uploaded"). |
| 7 | Step 6: Additional Details (Android - 97) | `/citizen/complaint/create/additional-details` | `Steps/SelectDetails.js` → textarea | header + back-strip + H2 "Provide Additional Details" + textarea with `shadow.input` + `BottomCtaTray` (**Submit** label, not Next) | CTA label text must read "Submit" on this last step. Today `defaultConfig.js` always uses `CS_COMMON_NEXT`. |
| 8 | Auth / OTP Verification (Android - 100) | `/citizen/login/otp` | `packages/modules/core/src/pages/citizen/Login/SelectOtp.js` (uses `otpInputV2.scss`) | header + back-strip + H2 "OTP Verification" + helper + 4-slot OTP input + **`OtpCountdownPill`** ("00:25") + Resend OTP link + `BottomCtaTray` | Need new `OtpCountdownPill` atom. Resend link styling moves to Inter 500 16/24. |
| 9 | Complaint Success (Android - 111) | `/citizen/complaint/create/response` | `Create/Response.js` (renders DIGIT `BannerCard` + ActionBar) | header + `StatusResultCard` (success #2E7D32, 48px check_circle, H1 "Complaint Submitted", reference, "Go back to Home" 300px primary CTA) | **NEW** `StatusResultCard`. Failure variant (Android - 109) reuses same component with red panel #C62828 and 48px error icon + "Sorry, there is a problem with the service. try again later." copy. |
| 10 | My Complaints list (Android - 102) | `/citizen/complaint/my-complaints` | `packages/modules/pgr/src/pages/citizen/ComplaintsList.js` → list of `Complaint.js` cards | header + back-strip + H2 "My Complaints" + list of complaint cards (each: white shadow card 12-radius, status `ComplaintTag`, Complaint No. heading H4, status label, filed date, photo strip if available) | **REWRITE** `Complaint.js` card composition. Replace `status-highlight` div with new `ComplaintTag`. |

Screens that **don't exist as standalone routes today**: none — all 10 map onto existing routes. The Login → Home transition still chains through `select-language` and `select-location` (LanguageSelection.js, LocationSelection.js) which are not in screens.json — left unchanged.

---

## 4. Files to DELETE

Delete these citizen-only assets / variants. Employee equivalents stay.

```
packages/css/src/components/buttons.scss                 # rewritten as nairobi/buttons.scss
packages/css/src/components/tag.scss                     # rewritten as nairobi/tag.scss
packages/css/src/components/topbar.scss                  # split: employee variant kept under digitv2/, citizen-mobile rewritten
packages/css/src/components/staticSideBar.scss           # citizen sidebar rewritten
packages/css/src/components/sidebar.scss                 # citizen rules rewritten; employee rules moved into digitv2/
packages/css/src/digitv2/components/headerV2.scss        # 6-line file — replaced by CitizenMobileHeader.scss
packages/css/src/digitv2/components/backButtonV2.scss    # back-strip rewritten
packages/css/src/digitv2/components/tagV2.scss           # ComplaintTag replaces
packages/css/src/digitv2/components/inputotpV2.scss      # OTP styling rewritten (the file is otpInputV2.scss — check exact name)
packages/css/src/components/inputotp.scss                # legacy OTP CSS
packages/css/src/digitv2/components/actionbarV2.scss     # replaced by BottomCtaTray
packages/css/src/components/actionbar.scss               # ditto
packages/digit-ui-components/src/molecules/LandingPageCard.js   # citizen Home no longer uses this — DELETE; employee Home does not consume it
packages/digit-ui-components/src/molecules/LandingPageWrapper.js # paired wrapper
packages/css/src/components/CitizenHomeCard.scss         # citizen home rewritten with ServiceCard
packages/css/src/components/changeLanguage.scss          # rewritten under nairobi
```

> If any of the SCSS deletes leave dangling `@import` lines in `packages/css/src/index.scss` or `packages/css/src/digitv2/index.scss`, those imports must be removed in the same PR.

---

## 5. Files to REWRITE

Grouped by component family.

### 5.1 Tokens (Phase 1 — foundational)

```
packages/css/tailwind.config.js
  - colors.primary.{light,main,dark}         → re-bind to brand.cta-yellow scale
  - colors.focus                             → #FEC931
  - colors.text.primary                      → #191C1D (was #0B0C0C)
  - digitv2.lightTheme.primary               → #FEC931
  - digitv2.lightTheme.header-sidenav        → #204F37
  - digitv2.lightTheme.primary-bg            → #E8F3EE
  - fontFamily.sans                          → ["Inter", "sans-serif"]
  - boxShadow.card                           → keep
  - boxShadow.button (NEW)                   → "0px 2px 7px rgba(0,0,0,0.15)"
  - boxShadow.input (NEW)                    → "0px 2px 2px rgba(0,0,0,0.12)"
  - borderRadius default                     → 8px (DIGIT default 4 stays for tags via explicit rounded-sm)

packages/digit-ui-components/src/constants/colors/colorconstants.js
  - lightTheme.primary.1   → "#FEC931"
  - lightTheme.primary.2   → "#204F37"
  - lightTheme.primary.bg  → "#E8F3EE"
  - lightTheme.text.bodyStrong (NEW)  → "#191C1D"
  - lightTheme.surface.ctaTint (NEW)  → "rgba(254,201,49,0.2)"
  - lightTheme.surface.ctaTintWeak (NEW) → "rgba(255,244,214,0.8)"
  - lightTheme.surface.brandTint (NEW) → "#E8F3EE"

packages/css/src/index.scss
  - Add @font-face for Inter (locally-hosted via /public/fonts/) OR
    the Google Fonts URL currently commented out, swapped to Inter weights 400/500/600/700.
```

### 5.2 Citizen header / chrome

```
packages/modules/core/src/components/TopBarSideBar/TopBar.js
  - Branch on `CITIZEN && mobileView` → render new <CitizenMobileHeader />
    composed from a new file (see §6). Employee path untouched.

packages/modules/core/src/components/TopBarSideBar/SideBar/CitizenSideBar.js
packages/modules/core/src/components/TopBarSideBar/SideBar/StaticCitizenSideBar.js
  - Replace background to #204F37, hover/active backgrounds to #E8F3EE,
    swap typography to Inter 500/16. (Hover state details NOT in findings;
    pending screenshot — flag as P2.)
```

### 5.3 Atoms

```
packages/digit-ui-components/src/atoms/Button.js
  - variants["primary"] CSS contract: bg #FEC931, text #000, padding 8 24,
    radius 8, height 40, shadow.button, font Inter 600 20.
  - Hover/disabled NOT in findings — keep current opacity-based disabled
    treatment as a stub and flag with TODO.

packages/digit-ui-components/src/atoms/SubmitBar.js
  - Uses primary skin from Button — no further work, but verify props pipe through.

packages/digit-ui-components/src/atoms/BackLink.js
  - Render as Nairobi back-strip when consumed inside citizen flows.
  - Bg #E8F3EE, text #204F37, padding 0 9px, radius "12 12 0 0".

packages/digit-ui-components/src/atoms/Tag.js
  - Variant "complaint" → bg rgba(255,244,214,0.8), border 1px solid #204F37,
    radius 6, padding 4 12, text Inter 700 16, icon-16 left slot, color #204F37.
  - Compact variant → 4 12 padding, Inter 700 14.

packages/digit-ui-components/src/atoms/TextInput.js + textInputV2.scss
  - Border 1px #D6D5D4, radius 4, padding 8 9, shadow.input,
    label Inter 500 16/16 #363636, font Inter 400 14/20.
```

### 5.4 Molecules / pattern carriers

```
packages/react-components/src/molecules/TypeSelectCard.js
  - Strip MaterialUI hover ripple, render rows as flex 16-padding 12-gap,
    swap radio dot to forest checkmark, font Inter 700 16/18.

packages/digit-ui-components/src/molecules/FormStep.js
packages/digit-ui-components/src/molecules/FormCard.js
packages/css/src/digitv2/components/FormComposerV2.scss
  - Card chrome: white bg, radius 12, shadow.card, padding 16.
  - Field gap 12. Label Inter 500 16/16.

packages/modules/pgr/src/components/Complaint.js
packages/modules/pgr/src/components/inbox  (whichever subfile renders the row)
  - Compose new ComplaintTag for status. Card radius 12. Status label Inter 700 16.

packages/modules/pgr/src/pages/citizen/Create/Response.js
packages/modules/pgr/src/pages/citizen/Response.js
  - Replace BannerCard with <StatusResultCard variant="success" />.
  - Failure path uses variant="error".
```

### 5.5 Screens

```
packages/modules/core/src/pages/citizen/Home/index.js
  - Replace CardBasedOptions composition with <CitizenDashboard /> rendering
    Welcome + 2× <ServiceCard />.

packages/modules/pgr/src/pages/citizen/Create/index.js
packages/modules/pgr/src/pages/citizen/Create/defaultConfig.js
  - Wrap each route render with <CitizenStepShell> giving header + back-strip + bottom tray.
  - Force last step (`additional-details`) to use submitBarLabel "CS_COMMON_SUBMIT" instead of CS_COMMON_NEXT.

packages/modules/pgr/src/pages/citizen/ComplaintsList.js
  - Replace inline error <Card> with <StatusResultCard variant="error" />.
  - Render list inside <CitizenStepShell title="My Complaints" />.

packages/modules/core/src/pages/citizen/Login/SelectMobileNumber.js
packages/modules/core/src/pages/citizen/Login/SelectOtp.js
packages/modules/core/src/pages/citizen/Login/SelectName.js
  - Reuse <CitizenStepShell />. SelectOtp adds <OtpCountdownPill /> + <BottomCtaTray />.
```

---

## 6. New files to CREATE

| Path | Purpose | Nairobi component |
|---|---|---|
| `packages/digit-ui-components/src/molecules/CitizenMobileHeader.js` | 56px forest top bar with menu + DIGIT mark and optional `BackStrip` slot below | `Header / Citizen / Mobile` |
| `packages/css/src/components/nairobi/citizenHeader.scss` | header chrome | — |
| `packages/digit-ui-components/src/atoms/OtpCountdownPill.js` | small yellow-tint pill rendering `mm:ss` | `Pill / OTP Countdown` |
| `packages/digit-ui-components/src/atoms/PhotoActionButton.js` | green-outline secondary CTA with left icon-20 | `Button / Secondary / Add/Upload Photos`. **Blocked on hover/disabled — see §8.** |
| `packages/digit-ui-components/src/molecules/MapZoomControlStack.js` | three stacked white segments with shared 1px shadow | `Card / Map Zoom Control / Top|Middle|Bottom` |
| `packages/digit-ui-components/src/molecules/BottomCtaTray.js` | white bottom sheet, `12 12 0 0` radius, `shadow.button`, primary CTA + optional secondary | `Bottom CTA Tray` pattern |
| `packages/digit-ui-components/src/molecules/StatusResultCard.js` | success/error result panel with 48px icon, H1, body, primary CTA | `Status Result Card` pattern + Success / Failure pages |
| `packages/digit-ui-components/src/molecules/ServiceCard.js` | yellow-tint card with illustration + heading + helper + chevron | Quick Pay / Complaints cards on Home |
| `packages/digit-ui-components/src/molecules/CitizenStepShell.js` | composes CitizenMobileHeader + BackStrip + scroll body + BottomCtaTray for the 6-step flow | implicit composition — see screens.json |
| `packages/digit-ui-components/src/atoms/ComplaintTag.js` | thin wrapper over `Tag.js` that pre-binds variant `complaint` and fixes the delete-icon contract | `Tag / Complaint Type` (Default + Compact) |
| `packages/css/src/components/nairobi/buttons.scss` | replaces `buttons.scss` for citizen | — |
| `packages/css/src/components/nairobi/tag.scss` | replaces `tag.scss` for citizen | — |
| `packages/css/src/components/nairobi/bottomCtaTray.scss` | tray chrome | — |
| `packages/css/src/components/nairobi/statusResultCard.scss` | success/error panel chrome | — |
| `packages/css/src/components/nairobi/serviceCard.scss` | service card chrome | — |
| `public/fonts/Inter-{400,500,600,700}.woff2` | self-host Inter so Citizen flow has no Google Fonts dependency | — |

NEW components blocked on missing default-only data (components.json gap):
- `Button` (primary skin) — hover, disabled, focus, pressed states unknown.
- `PhotoActionButton` — hover/disabled.
- `BackStrip` / `BackLink` — hover/pressed.
- `ComplaintTag` — hover, removable-pressed.
- `OtpCountdownPill` — expired/transient state.

---

## 7. Phased migration order

Each phase is a single PR-shaped step. The app stays shippable after every phase by gating the new tokens/components on a feature flag (`globalConfigs.NAIROBI_CITIZEN_THEME = true` for naipepea tenant) until phase 8.

### Phase 1 — Token rebind (broad, low-risk)
1. Edit `packages/css/tailwind.config.js`: primary palette → yellow, header-sidenav → forest, fontFamily.sans → Inter, add boxShadow.button + boxShadow.input.
2. Edit `packages/digit-ui-components/src/constants/colors/colorconstants.js`: rebind primary[1], primary[2], primary.bg, add bodyStrong / surface.ctaTint*.
3. Add Inter @font-face in `packages/css/src/index.scss`. Drop `font-family: 'Roboto Condensed'` references that are citizen-touched.
4. Smoke-test employee theme remains visually unchanged (employee uses different overrides).

PR title: `feat(css): rebind citizen tokens to Nairobi palette + Inter`

### Phase 2 — Atoms refresh
1. Rewrite `Button.js` primary skin + `buttons.scss`.
2. Rewrite `Tag.js` + add `complaint` variant.
3. Rewrite `BackLink.js` + back-strip variant.
4. Rewrite `TextInput.js` + `textInputV2.scss`.
5. Add new atoms: `OtpCountdownPill.js`, `PhotoActionButton.js`, `ComplaintTag.js`.

PR title: `feat(components): Nairobi atoms (Button, Tag, BackLink, TextInput, OTP pill, photo button)`

### Phase 3 — Citizen chrome
1. Add `CitizenMobileHeader.js` molecule + scss.
2. Branch `TopBar.js` to render it on citizen+mobile.
3. Rewrite `CitizenSideBar.js` + `StaticCitizenSideBar.js` styles.

PR title: `feat(core): CitizenMobileHeader + sidebar restyle`

### Phase 4 — Pattern molecules
1. `BottomCtaTray.js`.
2. `MapZoomControlStack.js`.
3. `StatusResultCard.js`.
4. `ServiceCard.js`.
5. `CitizenStepShell.js` composition.

PR title: `feat(components): Nairobi pattern molecules (CtaTray, ZoomStack, StatusCard, ServiceCard, StepShell)`

### Phase 5 — PGR step rewires
1. Wrap every `Steps/Select*.js` render in `<CitizenStepShell>`.
2. Replace ad-hoc submit bars with `<BottomCtaTray>`.
3. Force last step CTA label to `CS_COMMON_SUBMIT`.
4. Rewrite `TypeSelectCard.js` rows.
5. Rewrite `Steps/SelectGeolocation.js` to compose `MapZoomControlStack`.
6. Rewrite `Steps/SelectImages.js` to use `PhotoActionButton`.

PR title: `feat(pgr): Nairobi 6-step shell + zoom stack + photo buttons`

### Phase 6 — Result + list screens
1. Replace `Create/Response.js` with `<StatusResultCard variant="success" />`.
2. Update `ComplaintsList.js` to compose `CitizenStepShell` + new `Complaint.js` card with `ComplaintTag`.
3. Failure paths render `<StatusResultCard variant="error" />`.

PR title: `feat(pgr): Nairobi success / failure / list screens`

### Phase 7 — Home + Auth
1. Rewrite `Home/index.js` with `<CitizenDashboard>` + 2× `ServiceCard`.
2. Rewrite `Login/SelectMobileNumber.js`, `SelectOtp.js`, `SelectName.js` to use new shell + `OtpCountdownPill`.

PR title: `feat(core): Nairobi citizen Home + Login screens`

### Phase 8 — Cleanup / deletes
1. Remove deleted SCSS imports from `index.scss` / `digitv2/index.scss`.
2. Delete `LandingPageCard.js`, `LandingPageWrapper.js`, paired SCSS.
3. Drop the feature flag.
4. Remove `Roboto Condensed` references that are no longer reached.

PR title: `chore: drop legacy DIGIT citizen assets after Nairobi cutover`

---

## 8. Open questions / gaps

1. **Hover / disabled / focus / pressed states** — components.json captures **default visual state only** (the canvas at copy-as-CSS time had no other states). Blocking: `Button` primary, `PhotoActionButton`, `Tag` removable interaction, `BackStrip`, `OtpCountdownPill` expired state, `CitizenSideBar` row hover, all `TypeSelectCard` row pressed/selected affordances. Action: separate Figma walk specifically for interaction states, OR pull from current Bomet build at https://naipepea.digit.org/ (which already has citizen-flow live).
2. **Status panel hex divergences** — Figma uses `#2E7D32` (success) and `#C62828` (failure) but tokens.md flags them as "accent.unmapped" / accidents. DIGIT defaults are `#00703C` (success) and `#D4351C` (error). Confirm with design whether to override DIGIT alert colours just for the StatusResultCard, or to fold these into a tenant-scoped alert palette.
3. **Routing collapse for Step 4 (Pincode + Address)** — Figma shows one screen ("Provide Complainant Address") that contains both pincode and address fields, but `defaultConfig.js` has them as separate routes (`pincode`, `address`, `landmark`). Plan recommends keeping three routes with the same shell rather than merging — confirm with PM whether merging the three into one route is desired (would change session-storage key shape + back-button behaviour).
4. **Submit-button copy on the last step** — `defaultConfig.js` uses `CS_COMMON_NEXT` everywhere. Figma's last step (Android - 97) shows submit affordance. Need a localization key (likely existing `CS_COMMON_SUBMIT`) plumbed into the config — confirm key name.
5. **OTP countdown logic** — Figma shows "00:25" / "Resend OTP" link. Today `SelectOtp.js` exposes `setCanSubmitOtp` but no countdown. Need a `useCountdown` hook (probably already in `digit-ui-libraries` — verify) and a re-OTP API call wired to a Resend link. Not captured in findings — treat as new logic.
6. **Map zoom control behaviour** — Figma shows three stacked segments. The middle one carries text (per components.json its color is `#787878` and label is Inter 400 14). Is the middle segment a label/zoom-level readout or a "current location" button? Not captured in findings — needs PM.
7. **Citizen Home illustration sources** — Figma references `undraw_mobile-payments_uate 1` and a "File issues and track complaint status" illustration. We need PNG/SVG assets — not captured in findings. Will need separate asset export pass.
8. **Stale Roboto in 29 hits** — tokens.md flags these as legacy DIGIT components dragged into the canvas. Plan assumes universal Roboto→Inter swap; confirm none of those Roboto rows survive intentionally.
9. **`StaticCitizenSideBar` vs `CitizenSideBar` divergence** — both files exist. Plan rewrites both; confirm which is actually mounted on the Nairobi citizen build (and whether `staticSideBar.scss` (27 lines) is a thin override or a full skin).
10. **Self-hosting Inter** — `index.scss` has a commented-out Google Fonts URL line. Plan recommends self-hosting under `/public/fonts/` to avoid the third-party dependency on Nai Pepea (Kenya DPA / data-residency lens). Confirm asset license (Inter is OFL — fine).
11. **PGR `defaultConfig.js` mutation surface** — current code merges `Digit.Customizations.PGR.complaintConfig` over `defaultConfig`. Some Nairobi-specific text and route changes could land in the customization (`packages/templates/.../PGR/complaintConfig.js`) instead of the default config. Pick one mutation surface before phase 5.
12. **Tag color + size collision with employee theme** — `Tag.js` is shared. The "complaint" variant is additive, but the existing default tag (`tagV2.scss`) currently bleeds into citizen surfaces too. Verify all citizen call-sites switch to `variant="complaint"`.
13. **`LandingPageCard` deletion blast radius** — `LandingPageCard.js` is consumed elsewhere (Bomet dashboards in employee, possibly DSS). Audit non-citizen consumers before removing the file. Safer interim: keep the file, just stop importing it from `Home/index.js` and put a `@deprecated` JSDoc on it.
14. **Icon parity** — components.json lists 19 icon variants. Verified `arrow_left`, `menu`, `check_circle`, `close`, `error`, `delete`, `file_upload`, `grade`, `layers`, `lightbulb`, `location_on`, `more_horiz`, `opacity`, `pets`, `pest_control`, `plumbing` are all PGR-relevant. Need to confirm each is present in `packages/svg-components/` at all required sizes (16/20/24/40/48). Not captured in findings — needs separate review.
