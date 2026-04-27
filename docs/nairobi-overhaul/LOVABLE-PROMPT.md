# Lovable prompt — Nairobi PGR Reference App

Paste this into [lovable.dev](https://lovable.dev) as a single project prompt. The output is a **reference codebase** we'll mine for component implementations during the `digit-ui-esbuild` overhaul. It is NOT meant to be production-deployed.

---

Build a citizen + employee complaint-management web app for **Nairobi City County Government**. Stack: **React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + react-router-dom + zustand**. Mobile-first, then desktop responsive. No backend — wire all data to a single in-memory mock layer with `setTimeout(..., 800)` fakes for loading states.

## Brand & tokens

Theme name: `nairobi-green`.

```
--color-shell:        #204F37   /* dark forest green — top nav, sidebar, banner */
--color-cta:          #FEC931   /* mustard yellow — primary buttons */
--color-cta-tint:     rgba(254, 201, 49, 0.20)  /* hover/pressed tint on yellow */
--color-shell-tint:   #E8F3EE   /* pale forest green — back-strip, secondary panels */
--color-card-bg:      #FFF4D6   /* pale yellow — quick-pay & complaint cards */
--color-success:      #2E7D32   /* deep green — success state */
--color-paper:        #FFFFFF
--color-paper-soft:   #FAFAFA
--color-divider:      #D6D5D4
--color-text-body:    #191C1D
--color-text-muted:   #787878
--color-text-form:    #363636
--color-text-helper:  #0F172A
--color-overlay:      rgba(29, 36, 51, 0.80)
--color-shadow-card:  rgba(0, 0, 0, 0.16)
--color-shadow-btn:   rgba(0, 0, 0, 0.15)
```

Font: **Inter** for everything. (Roboto is wrong; do not use it.)

Radius scale: `4 / 6 / 8 / 12px`. Cards are 12px. Buttons are 8px. Inputs and tags are 4px. Top sheets / modals are `12px 12px 0 0`. Avatars/chips are pill-shaped (`90px`).

Spacing scale: `4 / 8 / 12 / 16 / 24 / 32`. Don't invent other values.

Shadows (only three): card `0 1px 2px var(--color-shadow-card)`, button `0 2px 7px var(--color-shadow-btn)`, input `0 2px 2px rgba(0,0,0,0.12)`.

## Citizen-side screens

All citizen screens are mobile-first (default 360–400px viewport). Top bar is `#204F37`, 56px tall, with menu icon (24×24, white) on left and a bell icon (24×24, yellow `#FEC931`) on right.

### 1. Home / Dashboard (`/citizen`)
- Welcome card: `Hello, {{name}}` heading, "Stay updated with Nairobi services" subtext.
- **Quick Pay Card**: full-width, `#FFF4D6` bg, 12px radius, illustration on right, "Pay Bills" CTA (yellow button).
- **Complaints Card**: full-width, `#FFF4D6` bg, illustration on right, "File or Track" CTA.
- Both cards have 16px padding, 12px gap between.

### 2-7. Complaint Filing wizard (`/citizen/complaints/file/step/{1..6}`)
A strict 6-step linear wizard. Each step has:
- The shared mobile top bar.
- A second-tier "back strip" of `#E8F3EE` 48px tall with a leading arrow_left icon (24×24) and step title in Inter 16/24 medium.
- The step content.
- A bottom bar with `Next` (yellow CTA) and where allowed, a tertiary `Skip and Continue` (text-only, green text).

Step 1: Type Selection — vertical list of 8 categories (Streetlights, Garbage, Drains, Water, Roads, Parks, Public Health, Other). Each row: 24×24 material icon (`lightbulb`, `delete`, `opacity`, `plumbing`, `pets`, `pest_control`, `location_on`, `more_horiz`), label in Inter 16/24 semibold, chevron-right.

Step 2: Sub-type Selection — same row pattern, 6-12 items based on Step 1.

Step 3: Pin Location — placeholder map (gray rectangle 16:9). Map zoom controls bottom-right: a vertical stack of three rounded white cards (Top: zoom-in, Middle: my-location, Bottom: zoom-out), each 40×40 with a 0 1px 2px shadow. "Pin location" sticky bottom CTA.

Step 4: Pincode + Address — a card with: pincode input (4 OTP-style boxes, 56×56, 4px radius, `#191C1D` border 1px), street address textarea (multi-line, 96px tall), landmark input. Bottom bar with Next.

Step 5: Photo Upload — large dashed-border drop zone (full width minus 16px padding, 240px tall, 12px radius, `#E8F3EE` bg with `#204F37` 1px dashed border). "Add photos" green outline secondary button (`#204F37` text, `#204F37` 1px border, white bg, 8px radius, 40px tall) with `file_upload` icon. Show 3-photo carousel below when photos exist.

Step 6: Additional Details — single textarea (240px tall, full width, 4px radius). Submit CTA at bottom.

### 8. Auth / OTP Verification (`/citizen/login/otp`)
- Mobile top bar.
- "Verify your number" heading (Inter 24/32 semibold, `#191C1D`).
- Subtext: `We've sent a 4-digit code to +254 7XX XXXX XX`.
- 4 OTP input slots (56×56, 4px radius, `#191C1D` 1px border, Inter 24 semibold center text).
- **OTP Countdown Pill**: small pill bottom-right of OTP inputs, `#FFF4D6` bg, `#191C1D` 1px border, 90px radius, "Resend in 0:59" Inter 12/16 medium.
- Bottom Next CTA (yellow).

### 9. Complaint Submitted (`/citizen/complaints/file/success`)
- Mobile top bar.
- Centered green panel: `#2E7D32` bg, full width, 320px tall, white check_circle icon (48×48), "Complaint Submitted!" Inter 24/32 bold white, complaint number Inter 14/20 white at 80%.
- "Go back to Home" white outline button below the panel.

### 10. My Complaints (`/citizen/complaints`)
- Mobile top bar + back strip ("My Complaints").
- Vertical list of complaint cards. Each card: white bg, 12px radius, 16px padding, 12px gap. Top row: status tag pill (yellow `#FEC931` bg with `#204F37` 1px border, `#191C1D` text Inter 12/16 medium, 4px radius — call this `ComplaintTag`). Middle: complaint number Inter 16/24 semibold. Bottom: status label Inter 14/20 muted.

## Employee-side screens (extrapolated — no Figma reference)

Apply the same `nairobi-green` tokens. Default desktop (≥1024px). Sidebar uses the shell green `#204F37`, 240px wide, with white icon + label rows; active row has `#FEC931` 4px left border and `#FFF4D6` text.

Only build:

### A. Employee Login (`/employee/login`)
Centered card on a `#FAFAFA` page. Logo top, mobile + password inputs, yellow CTA.

### B. Inbox (`/employee/pgr/inbox`)
Sidebar + main. Main has a header strip with "Complaints Inbox" title, a row of 4 KPI tiles (`Total / Open / Overdue / Resolved`, each white card 12px radius, 16px padding, count in Inter 32 bold). Below, a search/filter bar (input + 3 filter chips). Then a complaints table: status tag (`ComplaintTag`), ID, type, ward, assignee, SLA pill (yellow if at risk, red if breached, green if comfortable), action button.

### C. Search (`/employee/pgr/search`)
Same shell as Inbox. Top: a single search input + ward dropdown + date range. Results render as the same complaint table.

### D. Complaint Detail (`/employee/pgr/complaint/:id`)
Two-column desktop: left = complaint info card (description, category, location pin), right = action card (current state, "Assign to..." dropdown, "Mark Resolved" yellow CTA, "Reject" green outline, "Forward" link). Below: workflow timeline (vertical with `#204F37` line + dots).

### E. Create on Behalf (`/employee/pgr/create`)
Mirror the citizen 6-step wizard but in a desktop two-column layout. Add a 7th step at the start: "Citizen Lookup" (mobile number search returning citizen profile or "create new").

## Component contract

Build (and only build) these:

- `<TopBar variant="citizen-mobile" | "employee-desktop">`
- `<BackStrip title>`
- `<Sidebar />` — employee
- `<KpiTile label count icon />`
- `<Button variant="primary" | "secondary-green-outline" | "tertiary-link" size="md" | "lg">`
- `<TextField variant="default" | "otp">`
- `<DropZone />`
- `<ComplaintTag status />` — the yellow-fill green-border tag
- `<SlaPill state="ok" | "atRisk" | "breached">`
- `<OtpCountdownPill seconds />`
- `<MapZoomControlStack />`
- `<ServiceCard title cta illustration />` — Quick Pay & Complaints cards on Home
- `<SuccessPanel title id />`
- `<WorkflowTimeline events />`
- `<ComplaintCard tag id status onClick />` — used in My Complaints + Inbox table rows

No `LandingPageCard`, no orange anywhere, no `#0B4B66` blue header, no Roboto.

## Hidden / out of scope

Skip entirely: HRMS, configurator, DSS dashboards, Workbench, sandbox, payment, utilities, engagement-employee. Don't add nav entries for them.

## Mock data

`src/data/complaints.ts` exports an array of ~15 complaints across the 8 categories in 2 wards (Westlands, Starehe), with statuses (Pending, Assigned, Resolved, Rejected). Use realistic Kenyan names and Nairobi locations.

## Acceptance

- Cmd+F for `#c84c0e`, `#0B4B66`, `Roboto` — should return zero hits.
- Lighthouse mobile score > 85 on Home.
- Every screen above is reachable from at least one nav entry or wizard step.
- Tailwind config maps the tokens above as `theme.extend.colors.*`. Do NOT extend `colors.primary` — define `colors.shell`, `colors.cta`, etc. so the names match the Nairobi semantic.

Ship a single deployed preview I can crawl. We'll mine the components from there.
