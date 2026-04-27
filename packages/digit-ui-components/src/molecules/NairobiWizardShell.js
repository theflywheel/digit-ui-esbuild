import React from "react";
import PropTypes from "prop-types";
import NairobiTopBar from "../atoms/NairobiTopBar";
import NairobiBackStrip from "../atoms/NairobiBackStrip";
import NairobiButton from "../atoms/NairobiButton";

/**
 * Canonical Nairobi wizard shell — phase 5 molecule.
 *
 * Composes the chrome that wraps every step of the citizen Create
 * (PGR file-a-complaint) wizard, plus any other multi-step Nairobi
 * citizen flow (e.g. CSR Create-on-Behalf in Round 2):
 *
 *   - <NairobiTopBar>          — fixed 56px shell-green bar at the top.
 *   - <NairobiBackStrip>       — pale-green back strip directly under
 *                                the top bar (only when `onBack` is set).
 *   - body slot                — children rendered inside a max-width
 *                                container so the wizard is mobile-first
 *                                but stays comfortable on desktop.
 *   - bottom CTA bar           — fixed bottom, white surface, top divider,
 *                                primary NairobiButton on the right and
 *                                an optional secondary action to its left.
 *
 * Spec source: docs/nairobi-overhaul/EXECUTION-PLAN.md §Phase 5,
 * docs/nairobi-overhaul/research/screens.json (Android 102/106/110/111)
 * and the Phase 3 chrome atoms it composes (NairobiTopBar.js,
 * NairobiBackStrip.js).
 *
 * ## Bottom-bar integration choice (recorded for Phase 6 / R2-A)
 *
 * Each citizen Create step renders its own form + submit button today
 * (TypeSelectCard, FormStep, etc. — see
 * packages/modules/pgr/src/pages/citizen/Create/Steps/*). Hijacking
 * those forms to dispatch from a shell-owned button via refs or a
 * synthetic submit event would break their built-in validation
 * pathways (`disabled` derived from form state, async map readiness,
 * file-upload progress). Phase 5's task scope explicitly allows
 * deferring that integration: "If integration is messier than
 * expected, fall back to letting each step provide its own bottom
 * bar VIA the WizardShell's `bottomBar` slot prop (so the shell
 * renders chrome only and the step decides the action). Document
 * whichever you chose in the file's comment."
 *
 * **We chose the chrome-only path.** The shell exposes BOTH primary /
 * secondary action props AND a permissive children slot. When neither
 * `primaryAction` nor `secondaryAction` is provided, no bottom bar is
 * rendered and the step's own submit button shows through (unchanged
 * behavior). When Phase 6 rewrites individual steps, those rewrites
 * will populate `primaryAction` and drop their per-step submit bar in
 * the same commit. That migration is per-step rather than wholesale.
 *
 * ## Tokens
 *
 * Bottom bar surface uses --color-paper (#FFFFFF), top divider uses
 * --color-divider (#D6D5D4). Body padding-bottom is reserved so fixed
 * bar never occludes scrollable content. Padding-top reserves the 56px
 * top bar height.
 */
const NairobiWizardShell = ({
  topBarTitle = null,
  stepTitle = null,
  onMenuClick,
  onBellClick,
  unreadCount = 0,
  onBack = null,
  primaryAction = null,
  secondaryAction = null,
  className = "",
  bodyClassName = "",
  children,
}) => {
  const cls = ["nairobi-wizard-shell", className].filter(Boolean).join(" ");
  const showBackStrip = typeof onBack === "function" && stepTitle;
  const hasBottomBar = !!(primaryAction || secondaryAction);

  return (
    <div className={cls}>
      <NairobiTopBar
        title={topBarTitle}
        onMenuClick={onMenuClick}
        onBellClick={onBellClick}
        unreadCount={unreadCount}
      />

      {showBackStrip && (
        <NairobiBackStrip title={stepTitle} onBack={onBack} />
      )}

      <main
        className={["nairobi-wizard-shell__body", bodyClassName]
          .filter(Boolean)
          .join(" ")}
        data-has-bottom-bar={hasBottomBar ? "true" : "false"}
      >
        <div className="nairobi-wizard-shell__body-inner">{children}</div>
      </main>

      {hasBottomBar && (
        <div className="nairobi-wizard-shell__bottom-bar" role="region" aria-label="Step actions">
          <div className="nairobi-wizard-shell__bottom-bar-inner">
            {secondaryAction && (
              <NairobiButton
                variant="tertiary"
                size="md"
                onClick={secondaryAction.onClick}
                disabled={!!secondaryAction.disabled}
                type={secondaryAction.type || "button"}
                className="nairobi-wizard-shell__secondary"
              >
                {secondaryAction.label}
              </NairobiButton>
            )}
            {primaryAction && (
              <NairobiButton
                variant="primary"
                size="md"
                onClick={primaryAction.onClick}
                disabled={!!primaryAction.disabled}
                type={primaryAction.type || "button"}
                className="nairobi-wizard-shell__primary"
              >
                {primaryAction.label}
              </NairobiButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const actionShape = PropTypes.shape({
  label: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  type: PropTypes.string,
});

NairobiWizardShell.propTypes = {
  topBarTitle: PropTypes.node,
  stepTitle: PropTypes.string,
  onMenuClick: PropTypes.func,
  onBellClick: PropTypes.func,
  unreadCount: PropTypes.number,
  onBack: PropTypes.func,
  primaryAction: actionShape,
  secondaryAction: actionShape,
  className: PropTypes.string,
  bodyClassName: PropTypes.string,
  children: PropTypes.node,
};

export default NairobiWizardShell;
