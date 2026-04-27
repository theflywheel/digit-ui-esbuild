import React from "react";
import PropTypes from "prop-types";
import NairobiTag from "./NairobiTag";

/**
 * Nairobi complaint card — Phase 7 citizen My Complaints + employee Inbox row.
 *
 * Spec source:
 *   - docs/nairobi-overhaul/research/findings/components.json
 *     (citizen ComplaintCard surface).
 *   - docs/nairobi-overhaul/research/component-variants.json (`card` set
 *     for the white surface treatment).
 *   - docs/nairobi-overhaul/LOVABLE-PROMPT.md → `<ComplaintCard>` contract.
 *
 * Renders as a button (the whole row is clickable), with three rows:
 *   - status tag pill at the top
 *   - complaint id + category label in the middle
 *   - dateText in the muted bottom row
 *
 * Status variant maps directly onto the published NairobiTag system-
 * status palette. Hover lifts the card slightly via box-shadow — this
 * mirrors the synthetic-state assumption from DECISIONS.md D-007 since
 * the canvas didn't publish a card hover state.
 */
const NairobiComplaintCard = ({
  id,
  statusLabel,
  statusVariant = "info",
  categoryLabel,
  dateText,
  onClick,
  className = "",
  ...rest
}) => {
  const cls = ["nairobi-complaint-card", className].filter(Boolean).join(" ");
  return (
    <button
      type="button"
      className={cls}
      onClick={onClick}
      {...rest}
    >
      {statusLabel != null && (
        <span className="nairobi-complaint-card__status">
          <NairobiTag variant={statusVariant}>{statusLabel}</NairobiTag>
        </span>
      )}
      <span className="nairobi-complaint-card__body">
        {id != null && (
          <span className="nairobi-complaint-card__id">{id}</span>
        )}
        {categoryLabel != null && (
          <span className="nairobi-complaint-card__category">
            {categoryLabel}
          </span>
        )}
      </span>
      {dateText != null && (
        <span className="nairobi-complaint-card__date">{dateText}</span>
      )}
    </button>
  );
};

NairobiComplaintCard.propTypes = {
  id: PropTypes.node,
  statusLabel: PropTypes.node,
  statusVariant: PropTypes.oneOf(["warning", "success", "error", "info"]),
  categoryLabel: PropTypes.node,
  dateText: PropTypes.node,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export default NairobiComplaintCard;
