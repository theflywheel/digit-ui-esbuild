import React, { useEffect, useState } from "react";
import { LocationSearch } from "@egovernments/digit-ui-react-components";
import { NairobiMapZoomControlStack } from "@egovernments/digit-ui-components";

/**
 * Step 3 — Pin location on map.
 *
 * Phase 6 / R2-A rewrite. The Google Maps renderer is the existing
 * <LocationSearch> atom — it owns the loader, defaultBounds, the place
 * autocomplete and the marker. We do NOT touch that atom. We just frame
 * it inside a Nairobi container and overlay a <NairobiMapZoomControlStack>
 * on the bottom-right per the Figma (research/screens.json — "Complaint
 * Filing / Step 3: Pin Location", Android - 91; component spec in
 * research/components.json — "Card / Map Zoom Control" stack of three
 * 40×40 white surfaces).
 *
 * ## Zoom-stack handlers — no-op for now
 *
 * The existing LocationSearch atom does not expose imperative zoom or
 * recenter handles to the parent (it instantiates the google.maps.Map
 * locally and never lifts the ref). The R2-A scope explicitly forbids
 * touching atom JS. The task spec accepts no-op my-location and leaves
 * room for the same on zoom: "Wire its handlers to the existing
 * zoom-in / zoom-out / my-location functions (or leave the my-location
 * button as a no-op if no handler exists)."
 *
 * We attach passive logging stubs so the buttons render and capture
 * focus / hover correctly. Real zoom wiring is deferred until a future
 * branch refactors LocationSearch to lift its map ref through a prop.
 *
 * ## Bottom CTA — moved into the shell
 *
 * The "Next" / "Pin location" CTA used to ship as <SubmitBar> inside
 * <LocationSearchCard>. It moves to the WizardShell's primaryAction
 * slot via bindPrimaryAction. The "Skip and Continue" link from the old
 * card moves to secondaryAction.
 */
const SelectGeolocation = ({ onSelect, onSkip, value, t, config, bindPrimaryAction, bindSecondaryAction }) => {
  // pincode lifted into local state (was a closure-scoped `let` in the
  // old version) so we can re-bind the shell CTA when it changes — the
  // shell's onClick captures the latest value via the deps array.
  const [pincode, setPincode] = useState("");
  const [position, setPosition] = useState(null);
  const cardText = config?.texts?.cardText;

  // Overall shell label override — D-003 already maps "map" → "CS_PIN_NEXT"
  // in stepLabels.js so we just read from config.texts.
  const submitBarLabel = config?.texts?.submitBarLabel || "CS_COMMON_NEXT";

  const handleChange = (val, location) => {
    setPincode(val);
    if (location) setPosition(location);
  };

  useEffect(() => {
    if (typeof bindPrimaryAction !== "function") return;
    bindPrimaryAction({
      label: t(submitBarLabel),
      onClick: () => onSelect({ pincode }),
      disabled: false,
    });
    return () => bindPrimaryAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincode, submitBarLabel, t]);

  useEffect(() => {
    if (typeof bindSecondaryAction !== "function") return;
    bindSecondaryAction({
      label: t("CS_COMMON_SKIP"),
      onClick: () => onSelect(),
    });
    return () => bindSecondaryAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  const handleZoomIn = () => {
    // No-op until LocationSearch lifts its map ref. Logged so the
    // button still has an attached handler for hover/active states.
    if (typeof console !== "undefined") console.debug("[NairobiMapZoom] zoom-in tapped — atom does not yet expose imperative zoom");
  };
  const handleZoomOut = () => {
    if (typeof console !== "undefined") console.debug("[NairobiMapZoom] zoom-out tapped — atom does not yet expose imperative zoom");
  };
  const handleMyLocation = () => {
    if (typeof console !== "undefined") console.debug("[NairobiMapZoom] my-location tapped — atom does not yet expose imperative recenter");
  };

  return (
    <div
      className="nairobi-create-step nairobi-create-step--pin"
      style={{ position: "relative" }}
    >
      {cardText && (
        <p
          style={{
            margin: "0 0 16px",
            color: "#777777",
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 400,
            fontSize: 14,
            lineHeight: "20px",
          }}
        >
          {t(cardText)}
        </p>
      )}
      <div
        style={{
          position: "relative",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid var(--color-tertiary-border, #EDEDED)",
        }}
      >
        <LocationSearch onChange={handleChange} position={position} />
        <div
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            zIndex: 2,
          }}
        >
          <NairobiMapZoomControlStack
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onMyLocation={handleMyLocation}
          />
        </div>
      </div>
    </div>
  );
};

export default SelectGeolocation;
