// Nairobi-overhaul Round 2 (R2-C) — employee Inbox rewrite.
//
// Layout: header strip ("Complaints Inbox" + 4 KPI tiles) above a search/filter
// bar that wraps the existing PGR `SearchComplaint` + `Filter`. The complaint
// table renders one row per record with NairobiTag (status), NairobiSlaPill
// (SLA state synthesised from existing `sla` days-remaining number), and a
// NairobiButton "View" CTA that links to ComplaintDetails.
//
// Constraints honoured per docs/nairobi-overhaul/TASKS.md R2-C:
//   - PGR API/payload shapes unchanged (we still call Digit.Hooks.pgr.useInboxData
//     and Digit.PGRService.count with the same searchParams contract).
//   - Mobile fallback (MobileInbox) untouched.
//   - Role-based access unchanged — the table is rendered for every role that
//     could already see this inbox; PGRCard still gates which roles even reach
//     the route.
//   - No new dependencies.
//
// SLA state is mapped from the integer `sla` field already returned by
// useInboxData: <= 0 → breached (red); 1–2 → atRisk (yellow); > 2 → ok (green).
// This mirrors the existing red/green semantics in the legacy DesktopInbox
// (`sla < 0 ? error : success`) but adds the explicit yellow at-risk band.
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Loader } from "@egovernments/digit-ui-react-components";
import {
  NairobiButton,
  NairobiKpiTile,
  NairobiSlaPill,
  NairobiTag,
} from "@egovernments/digit-ui-components";

import MobileInbox from "../../components/MobileInbox";
import SearchComplaint from "../../components/inbox/search";
import Filter from "../../components/inbox/Filter";
import { LOCALE } from "../../constants/Localization";

const slaState = (slaDays) => {
  if (slaDays === null || slaDays === undefined || Number.isNaN(slaDays)) return "ok";
  if (slaDays <= 0) return "breached";
  if (slaDays <= 2) return "atRisk";
  return "ok";
};

const formatSlaLabel = (slaDays, t) => {
  if (slaDays === null || slaDays === undefined) return t("CS_NA") || "—";
  if (slaDays <= 0) return t("WF_INBOX_SLA_OVERDUE") || `${slaDays}d`;
  return `${slaDays}d`;
};

const statusTagVariant = (status) => {
  // Resolved / closed → success; rejected → error; everything else → complaint-type
  // (yellow fill + green border, the citizen tag idiom from LOVABLE-PROMPT.md).
  if (!status) return "complaint-type";
  const s = String(status).toUpperCase();
  if (s.includes("RESOLVE") || s.includes("CLOSE")) return "success";
  if (s.includes("REJECT")) return "error";
  return "complaint-type";
};

const getLocalityCodeForMultiTenant = (locality) => {
  if (!locality) return locality;
  if (typeof locality === "string") return locality.includes("_") ? locality : `ADMIN_${locality}`;
  if (locality.code) return locality.code.includes("_") ? locality : `ADMIN_${locality.code}`;
  return locality;
};

const NairobiInboxTable = ({ data, t }) => (
  <div className="nairobi-emp-table-wrap">
    <table className="nairobi-emp-table" role="table">
      <thead>
        <tr>
          <th scope="col">{t("CS_COMMON_COMPLAINT_NO")}</th>
          <th scope="col">{t("CS_ADDCOMPLAINT_COMPLAINT_SUB_TYPE")}</th>
          <th scope="col">{t("WF_INBOX_HEADER_LOCALITY")}</th>
          <th scope="col">{t("CS_COMPLAINT_DETAILS_CURRENT_STATUS")}</th>
          <th scope="col">{t("WF_INBOX_HEADER_CURRENT_OWNER")}</th>
          <th scope="col">{t("WF_INBOX_HEADER_SLA_DAYS_REMAINING")}</th>
          <th scope="col" aria-label="actions" />
        </tr>
      </thead>
      <tbody>
        {data.map((row) => {
          const detailHref = `/${window?.contextPath}/employee/pgr/complaint/details/${row.serviceRequestId}`;
          const statusKey = `CS_COMMON_${row.status}`;
          const subTypeKey = `SERVICEDEFS.${(row.complaintSubType || "").toUpperCase()}`;
          const localityCode = Digit.Utils.getMultiRootTenant()
            ? getLocalityCodeForMultiTenant(row.locality)
            : Digit.Utils.locale.getLocalityCode(row.locality, row.tenantId);
          return (
            <tr key={row.serviceRequestId} className="nairobi-emp-row">
              <td>
                <Link to={detailHref} className="nairobi-emp-row__link">
                  {row.serviceRequestId}
                </Link>
              </td>
              <td>{t(subTypeKey)}</td>
              <td>{t(localityCode)}</td>
              <td>
                <NairobiTag variant={statusTagVariant(row.status)}>
                  {t(statusKey)}
                </NairobiTag>
              </td>
              <td>{row.taskOwner || "—"}</td>
              <td>
                <NairobiSlaPill
                  state={slaState(row.sla)}
                  label={formatSlaLabel(row.sla, t)}
                />
              </td>
              <td>
                <Link to={detailHref} className="nairobi-emp-row__cta">
                  <NairobiButton variant="primary" size="sm">
                    {t("CS_COMMON_VIEW") || t("CS_COMMON_INBOX") || "View"}
                  </NairobiButton>
                </Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const computeKpis = (data) => {
  const total = data?.length || 0;
  let open = 0;
  let overdue = 0;
  let resolved = 0;
  data?.forEach((row) => {
    const s = String(row.status || "").toUpperCase();
    const isResolved = s.includes("RESOLVE") || s.includes("CLOSE");
    if (isResolved) resolved += 1;
    else open += 1;
    if (typeof row.sla === "number" && row.sla <= 0 && !isResolved) overdue += 1;
  });
  return { total, open, overdue, resolved };
};

const Inbox = () => {
  const { t } = useTranslation();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { uuid } = Digit.UserService.getUser().info;
  const [pageOffset, setPageOffset] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchParams, setSearchParams] = useState({
    filters: { wfFilters: { assignee: [{ code: uuid }] } },
    search: "",
    sort: {},
  });

  useEffect(() => {
    (async () => {
      const applicationStatus = searchParams?.filters?.pgrfilters?.applicationStatus
        ?.map((e) => e.code)
        .join(",");
      const response = await Digit.PGRService.count(
        tenantId,
        applicationStatus?.length > 0 ? { applicationStatus } : {}
      );
      if (response?.count) {
        setTotalRecords(response.count);
      }
    })();
  }, [searchParams]);

  const handleFilterChange = (filterParam) => {
    setSearchParams({ ...searchParams, filters: filterParam });
  };

  const onSearch = (params = "") => {
    setSearchParams({ ...searchParams, search: params });
  };

  const fetchNextPage = () => setPageOffset((p) => p + pageSize);
  const fetchPrevPage = () => setPageOffset((p) => Math.max(0, p - pageSize));

  const { data: complaints, isLoading } = Digit.Hooks.pgr.useInboxData({
    ...searchParams,
    offset: pageOffset,
    limit: pageSize,
  });

  const isMobile = Digit.Utils.browser.isMobile();
  const kpis = useMemo(() => computeKpis(complaints || []), [complaints]);

  if (complaints === null || complaints === undefined) {
    return <Loader />;
  }

  if (isMobile) {
    return (
      <MobileInbox
        data={complaints}
        isLoading={isLoading}
        onFilterChange={handleFilterChange}
        onSearch={onSearch}
        searchParams={searchParams}
      />
    );
  }

  const currentPage = Math.floor(pageOffset / pageSize);
  const lastPage = Math.max(0, Math.ceil(totalRecords / pageSize) - 1);
  const showPager = totalRecords > pageSize;

  return (
    <div className="nairobi-emp-inbox">
      <header className="nairobi-emp-page-header">
        <div className="nairobi-emp-page-header__title-row">
          <h1 className="nairobi-emp-page-title">{t("CS_COMMON_INBOX")}</h1>
        </div>
        <div className="nairobi-emp-kpi-row">
          <NairobiKpiTile label={t("CS_INBOX_KPI_TOTAL") || "Total"} count={kpis.total} />
          <NairobiKpiTile label={t("CS_INBOX_KPI_OPEN") || "Open"} count={kpis.open} />
          <NairobiKpiTile label={t("CS_INBOX_KPI_OVERDUE") || "Overdue"} count={kpis.overdue} />
          <NairobiKpiTile label={t("CS_INBOX_KPI_RESOLVED") || "Resolved"} count={kpis.resolved} />
        </div>
      </header>

      <section className="nairobi-emp-search-strip">
        <SearchComplaint onSearch={onSearch} type="desktop" searchParams={searchParams} />
        <Filter
          complaints={complaints}
          onFilterChange={handleFilterChange}
          type="desktop"
          searchParams={searchParams}
        />
      </section>

      <section className="nairobi-emp-results">
        {isLoading ? (
          <Loader />
        ) : complaints && complaints.length === 0 ? (
          <div className="nairobi-emp-empty">
            {t(LOCALE.NO_COMPLAINTS_EMPLOYEE)
              .split("\\n")
              .map((line, i) => (
                <p key={i}>{line}</p>
              ))}
          </div>
        ) : (
          <>
            <NairobiInboxTable data={complaints} t={t} />
            {showPager && (
              <div className="nairobi-emp-pager">
                <NairobiButton
                  variant="tertiary"
                  size="sm"
                  onClick={fetchPrevPage}
                  disabled={currentPage <= 0}
                >
                  {t("CS_COMMON_PREVIOUS") || "Previous"}
                </NairobiButton>
                <span className="nairobi-emp-pager__info">
                  {`${currentPage + 1} / ${lastPage + 1}`}
                </span>
                <NairobiButton
                  variant="tertiary"
                  size="sm"
                  onClick={fetchNextPage}
                  disabled={currentPage >= lastPage}
                >
                  {t("CS_COMMON_NEXT") || "Next"}
                </NairobiButton>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Inbox;
