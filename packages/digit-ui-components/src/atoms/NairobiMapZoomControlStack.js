import React from "react";
import PropTypes from "prop-types";

/**
 * Nairobi map zoom control stack — Phase 6 wizard step 3 (pin location).
 *
 * Spec source:
 *   - docs/nairobi-overhaul/research/components.json (`Card / Map Zoom
 *     Control / Top|Middle|Bottom` molecules — three stacked 40×40
 *     white surfaces with shared 0 1px 2px shadow).
 *   - docs/nairobi-overhaul/LOVABLE-PROMPT.md → `<MapZoomControlStack>`
 *     contract.
 *
 * Vertical stack of three rounded white cards (zoom-in, my-location,
 * zoom-out). 12px radius is applied to the outer corners only — the
 * middle segment is square so the three buttons read as one stack.
 *
 * No real map coupling. Each prop is a tap handler — leaflet / mapbox
 * wiring lives in the consuming organism.
 */
const ZoomInIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor" />
  </svg>
);
const ZoomOutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    <path d="M19 13H5v-2h14v2z" fill="currentColor" />
  </svg>
);
const MyLocationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    <path
      d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.99 8.99 0 0 0 13 3.06V1h-2v2.06A8.99 8.99 0 0 0 3.06 11H1v2h2.06A8.99 8.99 0 0 0 11 20.94V23h2v-2.06A8.99 8.99 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"
      fill="currentColor"
    />
  </svg>
);

const NairobiMapZoomControlStack = ({
  onZoomIn,
  onZoomOut,
  onMyLocation,
  className = "",
  ...rest
}) => {
  const cls = ["nairobi-map-zoom-stack", className].filter(Boolean).join(" ");
  return (
    <div className={cls} role="group" aria-label="Map zoom controls" {...rest}>
      <button
        type="button"
        className="nairobi-map-zoom-stack__btn nairobi-map-zoom-stack__btn--top"
        onClick={onZoomIn}
        aria-label="Zoom in"
      >
        <ZoomInIcon />
      </button>
      <button
        type="button"
        className="nairobi-map-zoom-stack__btn nairobi-map-zoom-stack__btn--middle"
        onClick={onMyLocation}
        aria-label="My location"
      >
        <MyLocationIcon />
      </button>
      <button
        type="button"
        className="nairobi-map-zoom-stack__btn nairobi-map-zoom-stack__btn--bottom"
        onClick={onZoomOut}
        aria-label="Zoom out"
      >
        <ZoomOutIcon />
      </button>
    </div>
  );
};

NairobiMapZoomControlStack.propTypes = {
  onZoomIn: PropTypes.func,
  onZoomOut: PropTypes.func,
  onMyLocation: PropTypes.func,
  className: PropTypes.string,
};

export default NairobiMapZoomControlStack;
