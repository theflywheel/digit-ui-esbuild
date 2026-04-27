import React, { useRef } from "react";
import PropTypes from "prop-types";

/**
 * Nairobi drop zone — Phase 6 wizard step 5 (photos).
 *
 * Spec source:
 *   - docs/nairobi-overhaul/LOVABLE-PROMPT.md → `<DropZone>` contract.
 *   - docs/nairobi-overhaul/research/component-variants.json (shell-tint
 *     surface palette + dashed shell-main outline).
 *
 * Tap-target wrapper around a hidden file input. 240px tall pale-green
 * surface with a dashed kenya-green border, file_upload icon and copy
 * centered. `onSelect` receives the FileList from the input.
 *
 * No upload progress / preview — that's organism territory and lives in
 * the Phase 6 step 5 wrapper.
 */
const DefaultUploadIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"
      fill="currentColor"
    />
  </svg>
);

const NairobiDropZone = ({
  onSelect,
  accept,
  multiple = true,
  helperText = "PNG or JPG up to 5MB",
  disabled = false,
  ctaLabel = "Add photos",
  className = "",
  ...rest
}) => {
  const inputRef = useRef(null);

  const handleClick = () => {
    if (disabled) return;
    if (inputRef.current) inputRef.current.click();
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const handleChange = (e) => {
    if (typeof onSelect === "function") {
      onSelect(e.target.files);
    }
  };

  const cls = [
    "nairobi-drop-zone",
    disabled ? "nairobi-drop-zone--disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cls}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      <span className="nairobi-drop-zone__icon" aria-hidden="true">
        <DefaultUploadIcon />
      </span>
      <span className="nairobi-drop-zone__cta">{ctaLabel}</span>
      {helperText != null && (
        <span className="nairobi-drop-zone__helper">{helperText}</span>
      )}
      <input
        ref={inputRef}
        type="file"
        className="nairobi-drop-zone__input"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleChange}
        tabIndex={-1}
      />
    </div>
  );
};

NairobiDropZone.propTypes = {
  onSelect: PropTypes.func,
  accept: PropTypes.string,
  multiple: PropTypes.bool,
  helperText: PropTypes.node,
  disabled: PropTypes.bool,
  ctaLabel: PropTypes.node,
  className: PropTypes.string,
};

export default NairobiDropZone;
