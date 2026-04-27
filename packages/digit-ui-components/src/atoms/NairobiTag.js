import React from "react";
import PropTypes from "prop-types";

/**
 * Nairobi tag.
 *
 *   warning / info / success — system-status palettes captured from the
 *   Figma `tags` COMPONENT_SET (page 80555:2039, id 80579:4147). Pill
 *   shape, 54px radius.
 *
 *   error — synthesised from --color-error (kenya-green ThemeConfig
 *   ships #E02D3C) at 10% / 30% alpha. The canvas didn't publish a
 *   destructive tag.
 *
 *   complaint-type — the citizen list/detail tag from
 *   docs/nairobi-overhaul/research/findings/components.json. Different
 *   shape (4px radius, smaller font), yellow fill with green border.
 */
const NairobiTag = ({
  variant = "info",
  iconBefore = null,
  className = "",
  children,
  ...rest
}) => {
  const cls = ["nairobi-tag", `nairobi-tag--${variant}`, className]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={cls} {...rest}>
      {iconBefore && (
        <span className="nairobi-tag__icon" aria-hidden="true">
          {iconBefore}
        </span>
      )}
      <span className="nairobi-tag__label">{children}</span>
    </span>
  );
};

NairobiTag.propTypes = {
  variant: PropTypes.oneOf([
    "warning",
    "info",
    "success",
    "error",
    "complaint-type",
  ]),
  iconBefore: PropTypes.node,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default NairobiTag;
