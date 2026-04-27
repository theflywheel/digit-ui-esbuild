import React from "react";
import PropTypes from "prop-types";

/**
 * Nairobi workflow timeline — employee Complaint Detail.
 *
 * Spec source:
 *   - docs/nairobi-overhaul/LOVABLE-PROMPT.md → `<WorkflowTimeline>`
 *     contract (vertical line `#204F37` + dots; completed filled,
 *     pending outline only).
 *
 * Renders an ordered list of events. Each event row pairs a 16px dot
 * with a label (Inter 16/24) and timestamp (Inter 12/16 muted). The
 * vertical 2px line and dot fills both pull from --color-shell-main so
 * MDMS-driven theming flows through; literal #204F37 is the fallback.
 *
 * No data-fetch coupling. Caller passes a flat events array — the
 * component does not derive completion from a workflow process state.
 */
const NairobiWorkflowTimeline = ({
  events = [],
  className = "",
  ...rest
}) => {
  const cls = ["nairobi-workflow-timeline", className].filter(Boolean).join(" ");
  return (
    <ol className={cls} {...rest}>
      {events.map((evt, idx) => {
        const isCompleted = !!evt.completed;
        const dotCls = [
          "nairobi-workflow-timeline__dot",
          isCompleted
            ? "nairobi-workflow-timeline__dot--completed"
            : "nairobi-workflow-timeline__dot--pending",
        ].join(" ");
        return (
          <li
            key={idx}
            className="nairobi-workflow-timeline__row"
          >
            <span className={dotCls} aria-hidden="true" />
            <div className="nairobi-workflow-timeline__content">
              {evt.label != null && (
                <span className="nairobi-workflow-timeline__label">
                  {evt.label}
                </span>
              )}
              {evt.timestamp != null && (
                <span className="nairobi-workflow-timeline__timestamp">
                  {evt.timestamp}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

NairobiWorkflowTimeline.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.node,
      timestamp: PropTypes.node,
      completed: PropTypes.bool,
    })
  ),
  className: PropTypes.string,
};

export default NairobiWorkflowTimeline;
