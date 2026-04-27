import React from "react";
import PropTypes from "prop-types";

/**
 * Nairobi success panel — Phase 7 citizen Success page.
 *
 * Spec source:
 *   - docs/nairobi-overhaul/research/components.json (`Status Result Card`).
 *   - docs/nairobi-overhaul/LOVABLE-PROMPT.md → `<SuccessPanel>` contract.
 *
 * Full-width green panel (320px tall) used after a complaint is filed.
 * White centered headline + subtitle stacked under a 48×48 check icon.
 * Background paints in `--color-shell-main` (kenya-green #204F37) — the
 * Figma actually uses #2E7D32 here; we wire to the shell-main token so
 * MDMS-driven theming flows through, with the literal #2E7D32 as a
 * reasonable fallback.
 *
 * `iconNode` overrides the default check_circle SVG. No interaction
 * states — this is a static result surface.
 */
const DefaultCheckIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
      fill="#FFFFFF"
    />
  </svg>
);

const NairobiSuccessPanel = ({
  title,
  subtitle,
  iconNode = null,
  className = "",
  ...rest
}) => {
  const cls = ["nairobi-success-panel", className].filter(Boolean).join(" ");
  return (
    <div className={cls} role="status" {...rest}>
      <div className="nairobi-success-panel__icon" aria-hidden="true">
        {iconNode || <DefaultCheckIcon />}
      </div>
      {title != null && (
        <h2 className="nairobi-success-panel__title">{title}</h2>
      )}
      {subtitle != null && (
        <p className="nairobi-success-panel__subtitle">{subtitle}</p>
      )}
    </div>
  );
};

NairobiSuccessPanel.propTypes = {
  title: PropTypes.node,
  subtitle: PropTypes.node,
  iconNode: PropTypes.node,
  className: PropTypes.string,
};

export default NairobiSuccessPanel;
