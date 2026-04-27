import React from "react";
import PropTypes from "prop-types";

/**
 * Nairobi KPI tile — employee Inbox header strip.
 *
 * Spec source:
 *   - docs/nairobi-overhaul/research/component-variants.json (`card`
 *     COMPONENT_SET, `card-medium` variant — white fill, #D9D9D9 border,
 *     Inter 600/32 count, Inter 400/16 label).
 *   - docs/nairobi-overhaul/LOVABLE-PROMPT.md → `<KpiTile>` contract.
 *
 * White card, 12px radius, 16px padding. Optional 24×24 icon top-right.
 * Use as the four-tile row above the complaints table:
 *
 *     <NairobiKpiTile label="Total" count={120} />
 *     <NairobiKpiTile label="Open" count={42} />
 *
 * No interactive states — this is a read-only display surface.
 */
const NairobiKpiTile = ({
  label,
  count,
  iconNode = null,
  className = "",
  ...rest
}) => {
  const cls = ["nairobi-kpi-tile", className].filter(Boolean).join(" ");
  return (
    <div className={cls} {...rest}>
      {iconNode && (
        <span className="nairobi-kpi-tile__icon" aria-hidden="true">
          {iconNode}
        </span>
      )}
      <span className="nairobi-kpi-tile__count">{count}</span>
      {label != null && (
        <span className="nairobi-kpi-tile__label">{label}</span>
      )}
    </div>
  );
};

NairobiKpiTile.propTypes = {
  label: PropTypes.node,
  count: PropTypes.node,
  iconNode: PropTypes.node,
  className: PropTypes.string,
};

export default NairobiKpiTile;
