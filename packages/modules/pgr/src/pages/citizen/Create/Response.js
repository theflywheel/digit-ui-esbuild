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
 * Create flow's terminal Response page — Phase 7 (R2-B) visual rewrite.
 *
 * After `Create/index.js` posts the complaint via
 * `dispatch(createComplaint(...))`, the wizard pushes
 * `${match.path}/response` which renders THIS component (sister to
 * the citizen-level `pages/citizen/Response.js`). Both share the
 * same redux-driven payload shape, so we use the same Nairobi chrome
 * pattern here:
 *
 *   - <NairobiTopBar>          — fixed shell-green bar at the top.
 *   - <NairobiSuccessPanel>    — message + complaint number.
 *   - <NairobiButton primary>  — "Go back to Home", linked to the
 *                                citizen index — same destination as
 *                                the legacy SubmitBar.
 *
 * Action → message resolution is preserved verbatim from the legacy
 * `GetActionMessage` helper. No selector signatures, dispatch calls
 * or routes were changed (cosmetic-only per DECISIONS.md).
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
