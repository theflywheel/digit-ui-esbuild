import React, { forwardRef } from "react";
import PropTypes from "prop-types";

/**
 * Canonical Nairobi citizen button.
 *
 * Style spec captured from the Figma `btn` COMPONENT_SET (page 80555:2039,
 * id 80560:2123). See docs/nairobi-overhaul/research/component-variants.json
 * for the full source.
 *
 *   primary    — yellow CTA (#FEC931 bg, #000 label, Inter 500). Default.
 *   secondary  — white outline on dark surfaces (Inter 600, white).
 *   tertiary   — light-grey outline on white surfaces (Inter 600, black).
 *   muted      — grey-bg low-emphasis action (Inter 400, #353535 on #F3F4F6).
 *
 * Sizes (height): sm 40px, md 48px (canonical), lg 56px.
 *
 * Disabled state replaces the variant's appearance with the Figma
 * `btn-inactive` styling (sage grey border + label, transparent fill).
 *
 * Hover / pressed / focus states are synthesised — the canvas only
 * published style variants, not interaction states. See DECISIONS.md
 * D-007 and the `syntheticInteractionStates` block in
 * docs/nairobi-overhaul/research/component-variants.json for the basis.
 */
const NairobiButton = forwardRef(function NairobiButton(
  {
    variant = "primary",
    size = "md",
    iconBefore = null,
    iconAfter = null,
    disabled = false,
    type = "button",
    className = "",
    children,
    ...rest
  },
  ref
) {
  const cls = [
    "nairobi-btn",
    `nairobi-btn--${variant}`,
    `nairobi-btn--${size}`,
    disabled ? "nairobi-btn--disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button ref={ref} type={type} className={cls} disabled={disabled} {...rest}>
      {iconBefore && (
        <span className="nairobi-btn__icon nairobi-btn__icon--before" aria-hidden="true">
          {iconBefore}
        </span>
      )}
      {children != null && <span className="nairobi-btn__label">{children}</span>}
      {iconAfter && (
        <span className="nairobi-btn__icon nairobi-btn__icon--after" aria-hidden="true">
          {iconAfter}
        </span>
      )}
    </button>
  );
});

NairobiButton.propTypes = {
  variant: PropTypes.oneOf(["primary", "secondary", "tertiary", "muted"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  iconBefore: PropTypes.node,
  iconAfter: PropTypes.node,
  disabled: PropTypes.bool,
  type: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default NairobiButton;
