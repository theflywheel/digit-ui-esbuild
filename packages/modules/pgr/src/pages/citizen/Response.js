import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  NairobiTopBar,
  NairobiSuccessPanel,
  NairobiButton,
} from "@egovernments/digit-ui-components";

/**
 * Citizen Complaint Submitted / Reopened / Rated success page —
 * Phase 7 (R2-B) visual rewrite.
 *
 * Wraps the existing redux-driven response payload in canonical
 * Nairobi citizen chrome:
 *
 *   - <NairobiTopBar>          — fixed shell-green bar at the top.
 *   - <NairobiSuccessPanel>    — full-bleed green panel with the
 *                                action message + complaint number.
 *   - <NairobiButton>          — yellow "Go back to Home" CTA below
 *                                the panel, wrapped in the same
 *                                `<Link to="/citizen">` so router
 *                                navigation behavior is preserved.
 *
 * Data plumbing is preserved verbatim:
 *   - `useSelector((state) => state.pgr)` → resolves the response.
 *   - `complaints.response.ServiceWrappers[0]` → workflow.action +
 *     service.serviceRequestId, exactly as the legacy BannerPicker
 *     used them.
 *   - The action → message map (REOPEN / RATE / default) is kept
 *     identical to the legacy `GetActionMessage` helper.
 *
 * Routing behavior:
 *   - The "Go back to Home" link still targets
 *     `/${window?.contextPath}/citizen` so the bottom-of-page CTA
 *     ends up on the citizen home — same destination the legacy
 *     `<SubmitBar>` shipped with.
 *
 * Per DECISIONS.md the rewrite is presentational only; no API calls,
 * selectors or routes were changed.
 */
const getActionMessageKey = (action) => {
  switch (action) {
    case "REOPEN":
      return "CS_COMMON_COMPLAINT_REOPENED";
    case "RATE":
      return "CS_COMMON_THANK_YOU";
    default:
      return "CS_COMMON_COMPLAINT_SUBMITTED";
  }
};

const Response = (props) => {
  const { t } = useTranslation();
  const appState = useSelector((state) => state)["pgr"];
  const responseEnvelope = appState?.complaints?.response;
  const wrapper = responseEnvelope?.ServiceWrappers?.[0];

  let title;
  let subtitle;
  if (responseEnvelope?.responseInfo && wrapper) {
    title = t(getActionMessageKey(wrapper.workflow?.action));
    subtitle = wrapper.service?.serviceRequestId;
  } else {
    title = t("CS_COMMON_COMPLAINT_NOT_SUBMITTED");
    subtitle = null;
  }

  return (
    <div className="nairobi-success-screen">
      <NairobiTopBar unreadCount={0} />
      <main className="nairobi-success-screen__body">
        <div className="nairobi-success-screen__panel">
          <NairobiSuccessPanel title={title} subtitle={subtitle} />
        </div>
        <div className="nairobi-success-screen__home-action">
          <Link to={`/${window?.contextPath}/citizen`}>
            <NairobiButton variant="primary" size="md">
              {t("CORE_COMMON_GO_TO_HOME")}
            </NairobiButton>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Response;
