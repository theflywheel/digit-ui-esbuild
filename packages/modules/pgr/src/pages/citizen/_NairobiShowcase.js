import React from "react";
import {
  NairobiButton,
  NairobiTag,
  NairobiOtpCountdownPill,
  NairobiTopBar,
  NairobiBackStrip,
  NairobiSuccessPanel,
  NairobiComplaintCard,
  NairobiDropZone,
  NairobiMapZoomControlStack,
  NairobiKpiTile,
  NairobiSlaPill,
  NairobiWorkflowTimeline,
} from "@egovernments/digit-ui-components";

/**
 * Nairobi atom showcase — dev-only.
 *
 * Renders every variant × size combination of the Nairobi atoms shipped
 * in Phase 2 of the citizen overhaul. Reachable at
 * `/<contextPath>/citizen/pgr/_showcase` (no auth required — mounted
 * as a plain Route in this module's `index.js`, not PrivateRoute).
 *
 * The mount path is `/citizen/pgr` because PGR is mounted at
 * `/citizen/${moduleCode.toLowerCase()}` (core `pages/citizen/index.js:82`)
 * and the module declares `moduleCode = "PGR"` (`pgr/src/Module.js:28`).
 *
 * The page is a flat scroll of labelled blocks. Each block uses the
 * shell green `var(--color-shell-main)` for headings so the canvas
 * picks up tenant-applied `applyTheme` overrides; if you're seeing
 * the legacy DIGIT teal `#0B4B66` in the headings, MDMS hasn't fed
 * the kenya-green ThemeConfig in yet.
 *
 * Filename starts with `_` to flag this as a dev surface; remove the
 * route registration once Phase 4-7 land and we no longer need an
 * isolated atom playground.
 */
const Section = ({ title, children }) => (
  <section
    style={{
      padding: "16px 16px 24px",
      borderBottom: "1px solid var(--color-divider, #D6D5D4)",
    }}
  >
    <h2
      style={{
        margin: "0 0 12px",
        fontFamily: "Inter, sans-serif",
        fontSize: 18,
        fontWeight: 600,
        color: "var(--color-shell-main, var(--color-digitv2-header-sidenav, #204F37))",
      }}
    >
      {title}
    </h2>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
      {children}
    </div>
  </section>
);

const Note = ({ children }) => (
  <p
    style={{
      width: "100%",
      margin: "0 0 12px",
      fontFamily: "Inter, sans-serif",
      fontSize: 13,
      color: "var(--color-text-muted, #787878)",
    }}
  >
    {children}
  </p>
);

const NairobiShowcase = () => (
  <div style={{ paddingTop: 56 }}>
    <NairobiTopBar
      title="Atom showcase"
      unreadCount={3}
      onMenuClick={() => alert("menu clicked")}
      onBellClick={() => alert("bell clicked")}
    />
    <div
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "16px 0",
        fontFamily: "Inter, sans-serif",
        backgroundColor: "var(--color-paper, #FFFFFF)",
      }}
    >
    <header style={{ padding: "8px 16px 16px" }}>
      <h1
        style={{
          margin: 0,
          fontFamily: "Inter, sans-serif",
          fontSize: 24,
          fontWeight: 700,
          color: "var(--color-shell-main, var(--color-digitv2-header-sidenav, #204F37))",
        }}
      >
        Nairobi atom showcase
      </h1>
      <p
        style={{
          margin: "4px 0 0",
          fontFamily: "Inter, sans-serif",
          fontSize: 14,
          color: "var(--color-text-muted, #787878)",
        }}
      >
        Phase 2 atoms rendered in every variant. Verify against
        docs/nairobi-overhaul/research/component-variants.json.
      </p>
    </header>

    <Section title="NairobiButton — primary, all sizes">
      <NairobiButton variant="primary" size="sm">Small</NairobiButton>
      <NairobiButton variant="primary" size="md">Medium</NairobiButton>
      <NairobiButton variant="primary" size="lg">Large</NairobiButton>
      <NairobiButton variant="primary" size="md" disabled>Disabled</NairobiButton>
    </Section>

    <Section title="NairobiButton — variants (md)">
      <NairobiButton variant="primary">Primary</NairobiButton>
      <div
        style={{
          padding: 12,
          background: "var(--color-shell-main, var(--color-digitv2-header-sidenav, #204F37))",
          borderRadius: 8,
        }}
      >
        <NairobiButton variant="secondary">Secondary on dark</NairobiButton>
      </div>
      <NairobiButton variant="tertiary">Tertiary</NairobiButton>
      <NairobiButton variant="muted">Muted</NairobiButton>
      <NairobiButton variant="primary" disabled>Disabled (any variant)</NairobiButton>
    </Section>

    <Section title="NairobiTag — system status (pill)">
      <NairobiTag variant="warning">Pending</NairobiTag>
      <NairobiTag variant="info">In review</NairobiTag>
      <NairobiTag variant="success">Resolved</NairobiTag>
      <NairobiTag variant="error">Rejected</NairobiTag>
    </Section>

    <Section title="NairobiTag — complaint-type (compact)">
      <Note>
        Different shape and density from the system-status tags — yellow
        fill with green border, 4px radius.
      </Note>
      <NairobiTag variant="complaint-type">Streetlight</NairobiTag>
      <NairobiTag variant="complaint-type">Garbage</NairobiTag>
      <NairobiTag variant="complaint-type">Drainage</NairobiTag>
    </Section>

    <Section title="NairobiOtpCountdownPill — cosmetic only">
      <Note>
        Counts down client-side from initialSeconds. At zero, switches to
        a Resend link. Click Resend to reset. No backend coupling
        (DECISIONS.md D-002).
      </Note>
      <NairobiOtpCountdownPill initialSeconds={60} />
      <NairobiOtpCountdownPill initialSeconds={5} />
    </Section>

    <Section title="NairobiTopBar (chrome) — rendered above this page">
      <Note>
        The fixed top bar at the top of this page IS the NairobiTopBar
        instance — it's rendered once at the root of this showcase. Try
        clicking the menu icon (alerts a noop handler) and the bell
        (also noop). The red dot is the unreadCount badge with value 3.
      </Note>
    </Section>

    <Section title="NairobiBackStrip — embedded examples">
      <Note>
        Pale-green strip used directly under the TopBar on every wizard
        step. Click the arrow to fire the back handler.
      </Note>
      <div style={{ width: "100%", border: "1px solid var(--color-divider, #D6D5D4)", borderRadius: 8, overflow: "hidden" }}>
        <NairobiBackStrip title="File a Complaint" onBack={() => alert("back: File a Complaint")} />
      </div>
      <div style={{ width: "100%", border: "1px solid var(--color-divider, #D6D5D4)", borderRadius: 8, overflow: "hidden" }}>
        <NairobiBackStrip title="Step 4 — Address" onBack={() => alert("back: Step 4")} />
      </div>
    </Section>

    <Section title="NairobiSuccessPanel — citizen Success page">
      <Note>
        Full-width green panel used after a complaint is filed. White
        check icon + headline + 80%-opacity subtitle. Background paints
        in --color-shell-main; falls back to literal #204F37.
      </Note>
      <div style={{ width: "100%" }}>
        <NairobiSuccessPanel
          title="Complaint filed"
          subtitle="Reference: CMP-2026-00421. We'll text you when an officer is assigned."
        />
      </div>
    </Section>

    <Section title="NairobiComplaintCard — list rows">
      <Note>
        White card with status tag, complaint id, category and date.
        The whole card is a button — click any row to fire onClick.
      </Note>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        <NairobiComplaintCard
          id="CMP-2026-00421"
          statusLabel="Pending"
          statusVariant="warning"
          categoryLabel="Streetlight not working"
          dateText="2 hours ago"
          onClick={() => alert("complaint CMP-2026-00421")}
        />
        <NairobiComplaintCard
          id="CMP-2026-00408"
          statusLabel="In review"
          statusVariant="info"
          categoryLabel="Garbage overflow"
          dateText="Yesterday"
          onClick={() => alert("complaint CMP-2026-00408")}
        />
        <NairobiComplaintCard
          id="CMP-2026-00397"
          statusLabel="Resolved"
          statusVariant="success"
          categoryLabel="Drainage"
          dateText="Mar 12, 2026"
          onClick={() => alert("complaint CMP-2026-00397")}
        />
        <NairobiComplaintCard
          id="CMP-2026-00388"
          statusLabel="Rejected"
          statusVariant="error"
          categoryLabel="Other"
          dateText="Feb 28, 2026"
          onClick={() => alert("complaint CMP-2026-00388")}
        />
      </div>
    </Section>

    <Section title="NairobiDropZone — wizard step 5 (photos)">
      <Note>
        Pale-green surface with dashed shell-main border. Tap or use
        keyboard (Enter / Space) to open the file picker. onSelect
        receives the FileList.
      </Note>
      <div style={{ width: "100%" }}>
        <NairobiDropZone
          accept="image/*"
          multiple
          onSelect={(files) =>
            alert(`selected ${files ? files.length : 0} file(s)`)
          }
          helperText="PNG or JPG up to 5MB"
        />
      </div>
      <div style={{ width: "100%" }}>
        <NairobiDropZone disabled helperText="Disabled state" />
      </div>
    </Section>

    <Section title="NairobiMapZoomControlStack — wizard step 3 overlay">
      <Note>
        Three stacked 40×40 white surfaces with shared shadow. Floats
        over a map in the wizard's pin-location step. Each button fires
        its own handler.
      </Note>
      <NairobiMapZoomControlStack
        onZoomIn={() => alert("zoom in")}
        onMyLocation={() => alert("my location")}
        onZoomOut={() => alert("zoom out")}
      />
    </Section>

    <Section title="NairobiKpiTile — employee Inbox header">
      <Note>
        Four-tile row above the complaints table. White card, 12px
        radius, 16px padding. Inter 700/32 count over Inter 400/14
        muted label.
      </Note>
      <NairobiKpiTile label="Total" count={120} />
      <NairobiKpiTile label="Open" count={42} />
      <NairobiKpiTile label="Overdue" count={8} />
      <NairobiKpiTile label="Resolved" count={70} />
    </Section>

    <Section title="NairobiSlaPill — employee table cell">
      <Note>
        Three SLA states. ok / atRisk pull from the published tag
        tokens; breached is synthesised from --color-error per
        DECISIONS.md D-007.
      </Note>
      <NairobiSlaPill state="ok" label="2d 4h" />
      <NairobiSlaPill state="atRisk" label="6h left" />
      <NairobiSlaPill state="breached" label="OVERDUE" />
    </Section>

    <Section title="NairobiWorkflowTimeline — employee Complaint Detail">
      <Note>
        Vertical line with 16px dots. Completed dots are filled in
        shell-main; pending are outline only.
      </Note>
      <div style={{ width: "100%", maxWidth: 480 }}>
        <NairobiWorkflowTimeline
          events={[
            { label: "Complaint filed", timestamp: "Apr 24, 09:12", completed: true },
            { label: "Assigned to officer", timestamp: "Apr 24, 11:48", completed: true },
            { label: "Field inspection", timestamp: "Apr 25, 14:30", completed: true },
            { label: "Awaiting resolution", timestamp: "Pending", completed: false },
            { label: "Closed", timestamp: "Pending", completed: false },
          ]}
        />
      </div>
    </Section>
    </div>
  </div>
);

export default NairobiShowcase;
