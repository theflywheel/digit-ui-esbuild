import React, { useEffect, useMemo, useState } from "react";

/**
 * Step 1 — Choose Complaint Type.
 *
 * Phase 6 / R2-A rewrite. Replaces the old <TypeSelectCard> radio-button
 * pattern with a vertical list of clickable rows per the Figma
 * (research/screens.json — "Complaint Filing / Step 1: Type Selection",
 * Android - 83). Each row: 24×24 leading material-style icon, Inter
 * 16/24 semibold label, trailing chevron-right. Rows have a 56px min
 * height, a hover surface, and a 1px divider between them.
 *
 * The submit button no longer ships inside the step body. Instead, the
 * step pushes a `{ label, onClick, disabled }` descriptor up to the
 * <NairobiWizardShell> via `bindPrimaryAction` (see Create/index.js
 * "Phase 6 / R2-A primaryAction plumbing" comment). The submit label
 * itself comes from `stepLabels.js` via `getSubmitLabel("complaint-type")`
 * which the parent already injects into `config.texts.submitBarLabel`.
 *
 * Auto-advance — historically TypeSelectCard required the user to tap
 * the radio AND then tap "Next". The Figma shows row-tapping as the
 * primary affordance, so this rewrite triggers `onSelect` immediately
 * on row click. The shell's primary CTA is kept around as a fallback
 * for keyboard users who advance with Enter on a focused row.
 *
 * PGR business logic preserved exactly: the menu still comes from
 * `Digit.Hooks.pgr.useComplaintTypes`, the selection payload is still
 * `{ complaintType: { key, name } }`, and the "Others" branching in
 * Create/index.js's `goNext` keeps working unchanged.
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

// Heuristic icon mapping. PGR menu items only carry { key, name } — no
// icon metadata yet — so we keyword-match on the lowercased key. Falls
// back to a generic "report" icon. The icon name comments mirror
// material symbols so a future MDMS sync of icon names is a one-line
// lift.
const renderTypeIcon = (item) => {
  const haystack = `${item?.key || ""} ${item?.name || ""}`.toLowerCase();
  // lightbulb — streetlight / lights
  if (/light|lamp|lumin/.test(haystack)) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M9 21h6v-2H9v2zm3-19a7 7 0 0 0-4 12.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26A7 7 0 0 0 12 2z"
          fill="currentColor"
        />
      </svg>
    );
  }
  // delete — garbage / waste
  if (/garbage|waste|trash|refuse|litter|debris|dump/.test(haystack)) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
          fill="currentColor"
        />
      </svg>
    );
  }
  // water_drop — drains / water / sewer / sewage
  if (/drain|water|sewer|sewage|leak|flood|pipe/.test(haystack)) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3.1l-1.06 1.06A11.55 11.55 0 0 0 4 13a8 8 0 0 0 16 0c0-3.66-2.36-6.84-6.94-8.84L12 3.1z"
          fill="currentColor"
        />
      </svg>
    );
  }
  // road — pothole / road / pavement
  if (/road|pothole|pavement|street(?!light)|tarmac/.test(haystack)) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M18.4 5H5.6L2 22h7.5l1-7h3l1 7H22L18.4 5zm-7.4 8h-1.4l.6-4h.8v4zm3 0h-1v-4h.8l.6 4z"
          fill="currentColor"
        />
      </svg>
    );
  }
  // park — trees / parks / vegetation
  if (/park|tree|vegetation|garden|green/.test(haystack)) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M17 12h2L12 2 5.05 12H7l-3.6 5h7.1v4h3v-4h7.1L17 12z"
          fill="currentColor"
        />
      </svg>
    );
  }
  // local_police — public safety
  if (/safety|crime|police|security/.test(haystack)) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"
          fill="currentColor"
        />
      </svg>
    );
  }
  // pets — animals / dogs
  if (/animal|dog|cattle|stray/.test(haystack)) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="4.5" cy="9.5" r="2.5" fill="currentColor" />
        <circle cx="9" cy="5.5" r="2.5" fill="currentColor" />
        <circle cx="15" cy="5.5" r="2.5" fill="currentColor" />
        <circle cx="19.5" cy="9.5" r="2.5" fill="currentColor" />
        <path
          d="M17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09a3.21 3.21 0 0 0-1.56 0c-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02 1.02 2.03 2.33 2.32.73.15 3.06-.44 5.54-.44h.18c2.48 0 4.81.58 5.54.44 1.31-.29 2.04-1.31 2.33-2.32.31-2.04-1.3-3.49-2.62-4.79z"
          fill="currentColor"
        />
      </svg>
    );
  }
  // construction — building / construction
  if (/construction|building|wall|illegal/.test(haystack)) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M13.78 15.3l3.97-3.97a3.5 3.5 0 0 1 4.95 4.95l-3.97 3.97-4.95-4.95zM2.3 17.36l8.49-8.49 4.95 4.95-8.49 8.49-4.95-4.95zM4.71 2.71l3.54 3.54-3.54 3.54-3.54-3.54L4.71 2.71z"
          fill="currentColor"
        />
      </svg>
    );
  }
  // help_outline — Others / fallback
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26A1.98 1.98 0 0 0 14 9a2 2 0 1 0-4 0H8a4 4 0 0 1 8 0c0 .88-.36 1.68-.93 2.25z"
        fill="currentColor"
      />
    </svg>
  );
};

const SelectComplaintType = ({ t, config, onSelect, value, bindPrimaryAction }) => {
  const [complaintType, setComplaintType] = useState(() => {
    const { complaintType } = value;
    return complaintType ? complaintType : {};
  });

  const stateId = Digit.Utils.getMultiRootTenant() ? Digit.ULBService.getStateId() : Digit.ULBService.getCurrentTenantId();
  const menu = Digit.Hooks.pgr.useComplaintTypes({ stateCode: stateId });

  const submitBarLabel = config?.texts?.submitBarLabel || "CS_COMMON_NEXT";
  const cardText = config?.texts?.cardText;

  const isSelected = useMemo(() => Object.keys(complaintType || {}).length > 0, [complaintType]);

  const goNext = (selection) => {
    onSelect({ complaintType: selection || complaintType });
  };

  // Push the shell CTA descriptor whenever selection state changes.
  // Keyboard users without a row-tap commit can still advance via the
  // bottom CTA; row click already auto-advances.
  useEffect(() => {
    if (typeof bindPrimaryAction !== "function") return;
    bindPrimaryAction({
      label: t(submitBarLabel),
      onClick: () => goNext(),
      disabled: !isSelected,
    });
    return () => bindPrimaryAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelected, complaintType, submitBarLabel, t]);

  const handleRowClick = (item) => {
    setComplaintType(item);
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
    <div className="nairobi-create-step nairobi-create-step--type">
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
          const active = complaintType?.key === item.key;
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
                  width: 24,
                  height: 24,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-primary-main, #204F37)",
                  flex: "0 0 auto",
                }}
              >
                {renderTypeIcon(item)}
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

export default SelectComplaintType;
