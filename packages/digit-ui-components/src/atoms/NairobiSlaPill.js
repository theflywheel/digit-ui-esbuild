import React from "react";
import PropTypes from "prop-types";

/**
 * Nairobi SLA pill — employee Inbox table row.
 *
 * Spec source:
 *   - docs/nairobi-overhaul/research/component-variants.json (`tags`
 *     COMPONENT_SET — system status palettes ok / atRisk).
 *   - docs/nairobi-overhaul/LOVABLE-PROMPT.md → `<SlaPill>` contract.
 *
 * 90px-radius pill, Inter 600/12. Three states map to the published
 * tag tokens, plus a synthesised destructive variant from --color-error
 * (DECISIONS.md D-007 — the canvas didn't publish a destructive tag):
 *
 *   ok        → success bg + label
 *   atRisk    → warning bg + label
 *   breached  → rgba(224,45,60,0.10) bg + #E02D3C label
 *
 * `label` is the time-string ("2d 4h", "OVERDUE", etc.). The component
 * doesn't compute SLA — that's data-layer.
 */
const NairobiSlaPill = ({
  state = "ok",
  label,
  className = "",
  ...rest
}) => {
  const cls = [
    "nairobi-sla-pill",
    `nairobi-sla-pill--${state}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={cls} {...rest}>
      <span className="nairobi-sla-pill__label">{label}</span>
    </span>
  );
};

NairobiSlaPill.propTypes = {
  state: PropTypes.oneOf(["ok", "atRisk", "breached"]),
  label: PropTypes.node,
  className: PropTypes.string,
};

export default NairobiSlaPill;
