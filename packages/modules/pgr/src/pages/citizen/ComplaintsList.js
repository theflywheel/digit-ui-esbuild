import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useRouteMatch } from "react-router-dom";

import { Loader } from "@egovernments/digit-ui-react-components";
import {
  NairobiTopBar,
  NairobiBackStrip,
  NairobiComplaintCard,
} from "@egovernments/digit-ui-components";
import { LOCALE, LOCALIZATION_KEY } from "../../constants/Localization";

/**
 * Citizen "My Complaints" list — Phase 7 (R2-B) visual rewrite.
 *
 * Wraps the existing data hooks (Digit.UserService.getUser /
 * useComplaintsListByMobile / revalidate) in the canonical Nairobi
 * citizen chrome:
 *
 *   - <NairobiTopBar>          — fixed shell-green bar at the top.
 *   - <NairobiBackStrip>       — pale-green strip with "My Complaints".
 *   - <NairobiComplaintCard>   — vertical stack of clickable rows; each
 *                                row maps applicationStatus → status
 *                                tag variant + label, the previous
 *                                Complaint.js component is bypassed
 *                                rather than mutated so any legacy
 *                                consumers continue to render the older
 *                                surface unchanged.
 *
 * Data plumbing is preserved verbatim from the Bomet baseline:
 *   - `Digit.UserService.getUser()` → mobileNumber lookup chain.
 *   - `Digit.Utils.getMultiRootTenant()` / `Digit.SessionStorage` →
 *     tenant id resolution.
 *   - `Digit.Hooks.pgr.useComplaintsListByMobile(tenantId, mobileNumber)`
 *     — same hook, same arguments, same revalidate-on-mount.
 *
 * Per DECISIONS.md the rewrite is presentational only; no API calls,
 * no hook signatures, no router pushes were changed.
 */

// applicationStatus buckets straight from the legacy Complaint.js
// component — kept here verbatim so the closed/open distinction stays
// in lock-step with that component.
const CLOSED_STATUSES = [
  "RESOLVED",
  "REJECTED",
  "CLOSEDAFTERREJECTION",
  "CLOSEDAFTERRESOLUTION",
];

// Per-status mapping onto the published NairobiTag system-status palette
// (warning / info / success / error). Anything we don't know about
// falls through to "info" — same approach as the showcase row.
const STATUS_VARIANT = {
  PENDINGASSIGNMENT: "warning",
  PENDINGATLME: "warning",
  PENDINGFORASSIGNMENT: "warning",
  PENDINGFORREASSIGNMENT: "warning",
  PENDINGATCITIZEN: "warning",
  PENDINGFORHEARING: "warning",
  ASSIGNED: "info",
  REASSIGNREQUESTED: "info",
  RESOLVED: "success",
  CLOSEDAFTERRESOLUTION: "success",
  REJECTED: "error",
  CLOSEDAFTERREJECTION: "error",
};

const resolveStatusVariant = (applicationStatus) => {
  if (!applicationStatus) return "info";
  if (STATUS_VARIANT[applicationStatus]) return STATUS_VARIANT[applicationStatus];
  return CLOSED_STATUSES.includes(applicationStatus) ? "success" : "warning";
};

const renderEmpty = (t, key) => (
  <div className="nairobi-complaints-list__empty">
    {t(key)
      .split("\\n")
      .map((text, index) => (
        <p key={index}>{text}</p>
      ))}
  </div>
);

export const ComplaintsList = (props) => {
  const User = Digit.UserService.getUser();
  const mobileNumber =
    User.mobileNumber || User?.info?.mobileNumber || User?.info?.userInfo?.mobileNumber;
  const tenantId = Digit.Utils.getMultiRootTenant()
    ? Digit.ULBService.getStateId()
    : Digit.SessionStorage.get("CITIZEN.COMMON.HOME.CITY")?.code ||
      Digit.ULBService.getCurrentTenantId();
  const { t } = useTranslation();
  const { path } = useRouteMatch();
  const history = useHistory();
  let { isLoading, error, data, revalidate } = Digit.Hooks.pgr.useComplaintsListByMobile(
    tenantId,
    mobileNumber
  );

  useEffect(() => {
    revalidate();
  }, []);

  const handleBack = () => {
    history.goBack();
  };

  const headerTitle = t(LOCALE.MY_COMPLAINTS);

  const Chrome = ({ children }) => (
    <div className="nairobi-complaints-list">
      <NairobiTopBar title={headerTitle} unreadCount={0} />
      <NairobiBackStrip title={headerTitle} onBack={handleBack} />
      <main className="nairobi-complaints-list__body">{children}</main>
    </div>
  );

  if (isLoading) {
    return (
      <Chrome>
        <Loader />
      </Chrome>
    );
  }

  if (error) {
    return <Chrome>{renderEmpty(t, LOCALE.ERROR_LOADING_RESULTS)}</Chrome>;
  }

  const complaints = data?.ServiceWrappers || [];

  if (complaints.length === 0) {
    return <Chrome>{renderEmpty(t, LOCALE.NO_COMPLAINTS)}</Chrome>;
  }

  return (
    <Chrome>
      <ul className="nairobi-complaints-list__items" role="list">
        {complaints.map(({ service }, index) => {
          const { serviceCode, serviceRequestId, applicationStatus } = service;
          const isClosed = CLOSED_STATUSES.includes(applicationStatus);
          const statusLabel = (isClosed ? t("CS_COMMON_CLOSED") : t("CS_COMMON_OPEN")).toUpperCase();
          const statusVariant = resolveStatusVariant(applicationStatus);
          const categoryLabel = t(`SERVICEDEFS.${(serviceCode || "").toUpperCase()}`);
          const detailLabel = t(`${LOCALIZATION_KEY.CS_COMMON}_${applicationStatus}`);
          const dateText = Digit.DateUtils.ConvertTimestampToDate(
            service?.auditDetails?.createdTime
          );
          const onClick = () => history.push(`${path}/${serviceRequestId}`);

          return (
            <li key={serviceRequestId || index} className="nairobi-complaints-list__item">
              <NairobiComplaintCard
                id={serviceRequestId}
                statusLabel={statusLabel}
                statusVariant={statusVariant}
                categoryLabel={categoryLabel || detailLabel}
                dateText={dateText}
                onClick={onClick}
              />
            </li>
          );
        })}
      </ul>
    </Chrome>
  );
};
