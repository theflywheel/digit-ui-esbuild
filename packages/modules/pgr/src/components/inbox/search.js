// Nairobi-overhaul Round 2 (R2-C) — employee Search input rewrite.
//
// This module is consumed by:
//   - DesktopInbox (legacy path, still imported elsewhere) — type="desktop"
//   - The new Nairobi Inbox page header strip — type="desktop"
//   - The mobile inbox search drawer — type="mobile"
//
// Constraints honoured:
//   - Public API (`onSearch`, `onClose`, `type`, `searchParams`) unchanged.
//   - Validation regexes unchanged (mobileNumber 10-digit IN pattern preserved
//     so we do not regress mobile-search behaviour for any currently deployed
//     tenant — even though Nairobi uses Kenyan mobile, the digit-ui shipping
//     bundle is multi-tenant).
//   - No new dependencies; reuses NairobiButton from the citizen branch atoms
//     (now merged into this branch).
//
// Layout: card-like white panel with two text inputs side-by-side and a
// yellow Search NairobiButton on the right. "Clear" sits as a tertiary link
// underneath. The mobile variant keeps the existing close-icon header and
// uses the shared NairobiButton for the bottom action.
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { CloseSvg } from "@egovernments/digit-ui-react-components";
import { NairobiButton } from "@egovernments/digit-ui-components";

const SearchComplaint = ({ onSearch, type, onClose, searchParams }) => {
  const [complaintNo, setComplaintNo] = useState(searchParams?.search?.serviceRequestId || "");
  const [mobileNo, setMobileNo] = useState(searchParams?.search?.mobileNumber || "");
  const { register, errors, handleSubmit, reset } = useForm();
  const { t } = useTranslation();

  const onSubmitInput = (data) => {
    if (Object.keys(errors).filter((i) => errors[i]).length) return;
    if (data.serviceRequestId !== "") {
      onSearch({ serviceRequestId: data.serviceRequestId });
    } else if (data.mobileNumber !== "") {
      onSearch({ mobileNumber: data.mobileNumber });
    } else {
      onSearch({});
    }
    if (type === "mobile" && typeof onClose === "function") {
      onClose();
    }
  };

  const clearSearch = () => {
    reset();
    onSearch({});
    setComplaintNo("");
    setMobileNo("");
  };

  const hasError = Object.keys(errors).filter((i) => errors[i]).length > 0;

  return (
    <form
      className={`nairobi-emp-search nairobi-emp-search--${type || "desktop"}`}
      onSubmit={handleSubmit(onSubmitInput)}
      noValidate
    >
      {type === "mobile" && (
        <div className="nairobi-emp-search__mobile-header">
          <h2>{t("CS_COMMON_SEARCH_BY")}:</h2>
          <button
            type="button"
            className="nairobi-emp-search__close"
            onClick={onClose}
            aria-label={t("CS_COMMON_CLOSE") || "Close"}
          >
            <CloseSvg />
          </button>
        </div>
      )}

      <div className="nairobi-emp-search__row">
        <label className="nairobi-emp-search__field">
          <span className="nairobi-emp-search__label">
            {t("CS_COMMON_COMPLAINT_NO")}.
          </span>
          <input
            className="nairobi-emp-search__input"
            type="text"
            name="serviceRequestId"
            value={complaintNo}
            onChange={(e) => setComplaintNo(e.target.value)}
            ref={register({ pattern: /(?!^$)([^\s])/ })}
          />
        </label>

        <label className="nairobi-emp-search__field">
          <span className="nairobi-emp-search__label">
            {t("CS_COMMON_MOBILE_NO")}.
          </span>
          <input
            className="nairobi-emp-search__input"
            type="text"
            name="mobileNumber"
            value={mobileNo}
            onChange={(e) => setMobileNo(e.target.value)}
            ref={register({ pattern: /^[6-9]\d{9}$/ })}
          />
        </label>

        {type === "desktop" && (
          <div className="nairobi-emp-search__action">
            <NairobiButton
              type="submit"
              variant="primary"
              size="sm"
              disabled={hasError}
            >
              {t("ES_COMMON_SEARCH")}
            </NairobiButton>
          </div>
        )}
      </div>

      {type === "desktop" && (
        <div className="nairobi-emp-search__clear-row">
          <button
            type="button"
            className="nairobi-emp-search__clear"
            onClick={clearSearch}
          >
            {t("ES_COMMON_CLEAR_SEARCH")}
          </button>
        </div>
      )}

      {type === "mobile" && (
        <div className="nairobi-emp-search__mobile-actions">
          <NairobiButton type="submit" variant="primary" size="md">
            {t("ES_COMMON_SEARCH")}
          </NairobiButton>
        </div>
      )}
    </form>
  );
};

export default SearchComplaint;
