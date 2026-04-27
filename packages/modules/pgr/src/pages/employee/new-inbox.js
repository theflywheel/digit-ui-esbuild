// Nairobi-overhaul Round 2 (R2-C) — InboxV2 (search composer variant) wrapper.
//
// OQ #1 from EMPLOYEE-SCOPE.md asks whether legacy Inbox or InboxV2 should
// be the canonical Nairobi list/search surface. R2-C ships the rewrite for
// LEGACY INBOX (the route most Nairobi roles already land on through
// PGRCard) and gives InboxV2 a light wrapper so it doesn't look like a
// stale platform screen when reached directly.
//
// What changed:
//   - The page title is now wrapped in a Nairobi page-header strip,
//     matching the legacy Inbox rewrite.
//   - The MDMS-driven `InboxSearchComposer` is left intact: re-skinning the
//     composer's filter chips would require touching the platform-shared
//     digit-ui-react-components (out of scope for R2-C). EMPLOYEE-BLOCKERS
//     records the deferred work; the composer itself still loads and
//     functions.
//
// Constraints honoured:
//   - PGR API/payload shapes unchanged; we still feed `inboxConfigPGR()`
//     into `InboxSearchComposer` exactly as before.
//   - No new dependencies. No MDMS writes.
//   - Role-based access unchanged — composer-level visibility is gated by
//     the access-control sidebar / route registration upstream.
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { InboxSearchComposer, Loader } from "@egovernments/digit-ui-react-components";
import _ from "lodash";
import { useLocation } from "react-router-dom";
import inboxConfigPGR from "../inboxConfigPGR";

const InboxV2 = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const configs = inboxConfigPGR();
  const [pageConfig, setPageConfig] = useState(null);
  const tenantId = Digit.ULBService.getCurrentTenantId();

  const { isLoading, data: wardsAndLocalities } = Digit.Hooks.useLocation(tenantId, "Locality", {
    select: (data) => {
      const localities = [];
      data?.TenantBoundary[0]?.boundary.forEach((item) => {
        localities.push({
          code: item.code,
          name: item.name,
          i18nKey: `${tenantId?.replaceAll(".", "_").toUpperCase()}_ADMIN_${item?.code}`,
        });
      });
      return localities;
    },
  });

  const serviceDefs = Digit.Hooks.pgr.useServiceDefs(tenantId, "PGR");

  const updatedConfig = useMemo(
    () =>
      Digit.Utils.preProcessMDMSConfigInboxSearch(t, pageConfig, "sections.filter.uiConfig.fields", {
        updateDependent: [
          {
            key: "locality",
            value: wardsAndLocalities ? [...wardsAndLocalities] : [],
          },
          {
            key: "serviceCode",
            value: serviceDefs ? [...serviceDefs] : [],
          },
        ],
      }),
    [pageConfig, wardsAndLocalities]
  );

  useEffect(() => {
    setPageConfig(_.cloneDeep(configs));
  }, [location]);

  if (!pageConfig || isLoading) return <Loader />;

  return (
    <div className="nairobi-emp-inbox-v2">
      <header className="nairobi-emp-page-header">
        <div className="nairobi-emp-page-header__title-row">
          <h1 className="nairobi-emp-page-title">
            {t(updatedConfig?.label)}
            {location?.state?.count ? (
              <span className="inbox-count">{location.state.count}</span>
            ) : null}
          </h1>
        </div>
      </header>
      <div className="inbox-search-wrapper">
        <InboxSearchComposer configs={updatedConfig} />
      </div>
    </div>
  );
};

export default InboxV2;
