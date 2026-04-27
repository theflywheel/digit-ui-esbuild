import React from "react";
import {
  NairobiButton,
  NairobiTag,
  NairobiOtpCountdownPill,
} from "@egovernments/digit-ui-components";

/**
 * Nairobi atom showcase — dev-only.
 *
 * Renders every variant × size combination of the Nairobi atoms shipped
 * in Phase 2 of the citizen overhaul. Reachable at
 * `/<contextPath>/citizen/complaints/_showcase` (no auth required —
 * mounted as a plain Route in this module's `index.js`, not
 * PrivateRoute).
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
  </div>
);

export default NairobiShowcase;
