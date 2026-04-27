import React from "react";
import PropTypes from "prop-types";

/**
 * Canonical Nairobi citizen mobile top bar.
 *
 * Spec captured from the Figma `Header / Citizen / Mobile` frame and
 * cross-referenced with `Menu Tab` + `screens.json` (Android 102/106/111):
 *
 *   - 56px tall, full-bleed, position fixed at top.
 *   - Background: shell green (#204F37 from kenya-green ThemeConfig).
 *     Resolves through --color-shell-main, falls back through the legacy
 *     --color-digitv2-header-sidenav, then a literal hex.
 *   - Hamburger (24×24, white) on the left; bell (24×24, yellow #FEC931)
 *     on the right; optional title slot in the center.
 *   - Bell shows a small red badge when `unreadCount > 0`.
 *
 * Existing DIGIT TopBar / Header are untouched — this atom is opt-in,
 * intended for citizen surfaces only. Bomet still consumes the original.
 *
 * Per DECISIONS.md D-007, hover/pressed/focus on the icon buttons are
 * synthesised from the existing palette (cta-tint overlay) since Figma
 * didn't publish state variants.
 */
const MenuGlyph = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M3 6h18M3 12h18M3 18h18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const BellGlyph = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2Z" />
  </svg>
);

const NairobiTopBar = ({
  onMenuClick,
  onBellClick,
  unreadCount = 0,
  title = null,
  className = "",
  ...rest
}) => {
  const cls = ["nairobi-topbar", className].filter(Boolean).join(" ");
  const showBadge = typeof unreadCount === "number" && unreadCount > 0;
  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <header className={cls} role="banner" {...rest}>
      <button
        type="button"
        className="nairobi-topbar__icon-btn nairobi-topbar__menu"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <MenuGlyph />
      </button>

      {title != null && (
        <span className="nairobi-topbar__title">{title}</span>
      )}

      <button
        type="button"
        className="nairobi-topbar__icon-btn nairobi-topbar__bell"
        onClick={onBellClick}
        aria-label={
          showBadge
            ? `Notifications, ${badgeLabel} unread`
            : "Notifications"
        }
      >
        <BellGlyph />
        {showBadge && (
          <span className="nairobi-topbar__badge" aria-hidden="true">
            {badgeLabel}
          </span>
        )}
      </button>
    </header>
  );
};

NairobiTopBar.propTypes = {
  onMenuClick: PropTypes.func,
  onBellClick: PropTypes.func,
  unreadCount: PropTypes.number,
  title: PropTypes.node,
  className: PropTypes.string,
};

export default NairobiTopBar;
