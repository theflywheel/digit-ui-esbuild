import React from "react";
import PropTypes from "prop-types";
import NairobiButton from "../atoms/NairobiButton";

/**
 * Canonical Nairobi citizen service card — phase 4 molecule.
 *
 * Spec composed from:
 *   - docs/nairobi-overhaul/research/screens.json — "Citizen / Home
 *     (Dashboard)" lists the surface as "Quick Pay Card" + "Complaints
 *     Card". Padding 16, layout vertical stack.
 *   - docs/nairobi-overhaul/research/component-variants.json — the
 *     `card` COMPONENT_SET, variant `card-large`: title Inter 600/24,
 *     description Inter 400/18. Phase 4 lands the surface on
 *     `--color-card-bg` (#FFF4D6) per Figma + EXECUTION-PLAN.md §Phase 4.
 *
 * Visual contract:
 *   - 12px radius, 24px padding, 16px gap, full width.
 *   - Background: var(--color-card-bg, #FFF4D6).
 *   - Title in #191C1D (Inter 600/24).
 *   - Description in muted ink (Inter 400/18).
 *   - CTA at bottom — a <NairobiButton variant="primary" size="md">.
 *   - Optional `illustration` slot. When passed, the body becomes a
 *     2-column grid (text left, illustration right). When absent the
 *     stack stays single-column.
 *
 * No interaction state of its own beyond the inner button. The card is
 * not clickable as a whole — the CTA is the explicit action target so
 * a11y focus and label belong to the button.
 */
const NairobiServiceCard = ({
  title,
  description,
  ctaLabel,
  onClick,
  illustration,
  className = "",
}) => {
  const cls = [
    "nairobi-service-card",
    illustration ? "nairobi-service-card--with-illustration" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={cls}>
      <div className="nairobi-service-card__body">
        <div className="nairobi-service-card__text">
          <h3 className="nairobi-service-card__title">{title}</h3>
          {description && (
            <p className="nairobi-service-card__description">{description}</p>
          )}
          <div className="nairobi-service-card__cta">
            <NairobiButton variant="primary" size="md" onClick={onClick}>
              {ctaLabel}
            </NairobiButton>
          </div>
        </div>
        {illustration && (
          <div className="nairobi-service-card__illustration" aria-hidden="true">
            {illustration}
          </div>
        )}
      </div>
    </section>
  );
};

NairobiServiceCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  ctaLabel: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  illustration: PropTypes.node,
  className: PropTypes.string,
};

export default NairobiServiceCard;
