import React from "react";
import PropTypes from "prop-types";

/**
 * Canonical Nairobi back-navigation strip.
 *
 * Spec captured from the Figma `Back Navigation Bar` component referenced
 * in screens.json (Android 106/110/111) and recommendations.newComponents
 * ("NairobiStepNavigation - Light green #E8F3EE 'Back' bar component").
 *
 *   - 48px tall, full-bleed, sits directly under the NairobiTopBar.
 *   - Pale green background (#E8F3EE) — resolves via --color-shell-tint.
 *   - Leading arrow_left (24×24) + label, both painted in shell green
 *     (--color-shell-main).
 *   - Label is Inter 16/24/medium per the screens.json typography note.
 *
 * `onBack` fires when the strip is clicked. When omitted, falls back to
 * `window.history.back()` so the strip behaves usefully even without
 * a router context. (We avoid pulling react-router-dom directly into
 * this atom to keep digit-ui-components dependency-clean — consumers
 * that want router-aware navigation should pass `onBack` themselves.)
 *
 * Existing DIGIT BackButton / BackLink atoms stay untouched; this atom
 * is opt-in for citizen surfaces, per Phase 3 of the overhaul plan.
 */
const ArrowLeftGlyph = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M15 6l-6 6 6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const NairobiBackStrip = ({ title, onBack, className = "", ...rest }) => {
  const cls = ["nairobi-back-strip", className].filter(Boolean).join(" ");

  const handleClick = (e) => {
    if (typeof onBack === "function") {
      onBack(e);
      return;
    }
    if (typeof window !== "undefined" && window.history) {
      window.history.back();
    }
  };

  return (
    <button
      type="button"
      className={cls}
      onClick={handleClick}
      aria-label={`Go back from ${title}`}
      {...rest}
    >
      <span className="nairobi-back-strip__icon" aria-hidden="true">
        <ArrowLeftGlyph />
      </span>
      <span className="nairobi-back-strip__label">{title}</span>
    </button>
  );
};

NairobiBackStrip.propTypes = {
  title: PropTypes.string.isRequired,
  onBack: PropTypes.func,
  className: PropTypes.string,
};

export default NairobiBackStrip;
