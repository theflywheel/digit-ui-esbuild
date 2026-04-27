import React, { useEffect, useState } from "react";

/**
 * Step 6 — Additional details (final step before submit).
 *
 * Phase 6 / R2-A rewrite. Drops the FormStep wrapper and renders a
 * single full-width Nairobi-styled <textarea> per the Figma
 * (research/screens.json — "Complaint Filing / Step 6: Additional
 * Details", Android - 97). 240px tall, 4px radius, Inter 14/20.
 *
 * The Submit button moves into the WizardShell's primaryAction slot.
 * The label comes from `getSubmitLabel("additional-details")` which
 * the parent has already computed and pushed into config.texts.submitBarLabel
 * — it resolves to "CS_SUBMIT" per stepLabels.js.
 *
 * Business logic preserved exactly: payload is still
 * `{ details: <string> }`. Submit triggers the parent's wrapperSubmit
 * via `nextStep === null` in defaultConfig.js — that path is unchanged.
 *
 * `inputs` from defaultConfig still describes a single textarea named
 * "details"; we read it for the label only and ignore the rest of the
 * input descriptor (no react-hook-form needed for a single uncontrolled
 * textarea).
 */
const SelectDetails = ({ t, config, onSelect, value, bindPrimaryAction }) => {
  const [details, setDetails] = useState(() => {
    const { details } = value;
    return details ? details : "";
  });

  const submitBarLabel = config?.texts?.submitBarLabel || "CS_COMMON_NEXT";
  const labelKey = config?.inputs?.[0]?.label;

  const handleSubmit = () => {
    onSelect({ details });
  };

  useEffect(() => {
    if (typeof bindPrimaryAction !== "function") return;
    bindPrimaryAction({
      label: t(submitBarLabel),
      onClick: handleSubmit,
      disabled: false,
    });
    return () => bindPrimaryAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details, submitBarLabel, t]);

  return (
    <div className="nairobi-create-step nairobi-create-step--details">
      {labelKey && (
        <label
          htmlFor="nairobi-additional-details"
          style={{
            display: "block",
            margin: "0 0 8px",
            color: "#353535",
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 500,
            fontSize: 14,
            lineHeight: "20px",
          }}
        >
          {t(labelKey)}
        </label>
      )}
      <textarea
        id="nairobi-additional-details"
        name="details"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        maxLength={1024}
        style={{
          display: "block",
          width: "100%",
          height: 240,
          minHeight: 240,
          boxSizing: "border-box",
          padding: 12,
          borderRadius: 4,
          border: "1px solid var(--color-tertiary-border, #EDEDED)",
          background: "var(--color-paper, #FFFFFF)",
          color: "#000000",
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 400,
          fontSize: 14,
          lineHeight: "20px",
          resize: "vertical",
          outlineColor: "var(--color-primary-main, #204F37)",
        }}
      />
    </div>
  );
};

export default SelectDetails;
