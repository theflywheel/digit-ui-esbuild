import React, { useEffect, useMemo, useState } from "react";

/**
 * Step 2 — Choose Complaint Sub-type.
 *
 * Same vertical-row pattern as Step 1 (SelectComplaintType.js) — Figma
 * "Complaint Filing / Step 2: Sub-type Selection" (Android - 86) re-uses
 * the row pattern from Step 1, just with sub-categories of the chosen
 * type. We keep the icons smaller (20px) here because sub-type names
 * tend to be more abstract and the keyword heuristic less reliable, so
 * a small leading bullet-style icon reads better than a strong material
 * symbol that doesn't match the label.
 *
 * The shell CTA wiring mirrors Step 1: row tap auto-advances via
 * onSelect, and we still push a `{ label, onClick, disabled }` descriptor
 * up via bindPrimaryAction so the shell's bottom CTA is in sync for
 * keyboard users.
 *
 * Business logic preserved exactly: menu still comes from
 * `Digit.Hooks.pgr.useComplaintSubType`, payload is still
 * `{ subType: { key, name } }`.
 */

const ChevronRightIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Compact dot leading-glyph for sub-types — neutral fallback that
// doesn't try to second-guess the label.
const SubTypeDot = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="4" fill="currentColor" />
  </svg>
);

const SelectSubType = ({ t, config, onSelect, value, bindPrimaryAction }) => {
  const [subType, setSubType] = useState(() => {
    const { subType } = value;
    return subType ? subType : {};
  });
  const { complaintType } = value;
  const menu = Digit.Hooks.pgr.useComplaintSubType(complaintType, t);

  const submitBarLabel = config?.texts?.submitBarLabel || "CS_COMMON_NEXT";
  const cardText = config?.texts?.cardText;

  const isSelected = useMemo(() => Object.keys(subType || {}).length > 0, [subType]);

  const goNext = (selection) => {
    onSelect({ subType: selection || subType });
  };

  useEffect(() => {
    if (typeof bindPrimaryAction !== "function") return;
    bindPrimaryAction({
      label: t(submitBarLabel),
      onClick: () => goNext(),
      disabled: !isSelected,
    });
    return () => bindPrimaryAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelected, subType, submitBarLabel, t]);

  const handleRowClick = (item) => {
    setSubType(item);
    goNext(item);
  };

  const handleRowKey = (e, item) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleRowClick(item);
    }
  };

  if (!menu) return null;

  return (
    <div className="nairobi-create-step nairobi-create-step--subtype">
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
      <ul
        role="list"
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          background: "var(--color-paper, #FFFFFF)",
          border: "1px solid var(--color-tertiary-border, #EDEDED)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {menu.map((item, idx) => {
          const active = subType?.key === item.key;
          return (
            <li
              key={item.key || idx}
              role="button"
              tabIndex={0}
              aria-pressed={active}
              onClick={() => handleRowClick(item)}
              onKeyDown={(e) => handleRowKey(e, item)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "16px",
                minHeight: 56,
                cursor: "pointer",
                borderTop: idx === 0 ? "none" : "1px solid var(--color-tertiary-border, #EDEDED)",
                background: active ? "var(--color-shell-tint, #E8F3EE)" : "transparent",
                color: "#000000",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = "var(--color-grey-light, #FAFAFA)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 20,
                  height: 20,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-primary-main, #204F37)",
                  flex: "0 0 auto",
                }}
              >
                <SubTypeDot />
              </span>
              <span
                style={{
                  flex: 1,
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontWeight: 600,
                  fontSize: 16,
                  lineHeight: "24px",
                }}
              >
                {item.name}
              </span>
              <span
                aria-hidden="true"
                style={{
                  color: "#777777",
                  display: "inline-flex",
                  alignItems: "center",
                  flex: "0 0 auto",
                }}
              >
                <ChevronRightIcon />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SelectSubType;
