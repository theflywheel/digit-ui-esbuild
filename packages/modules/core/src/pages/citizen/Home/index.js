import { Loader } from "@egovernments/digit-ui-react-components";
import { NairobiServiceCard } from "@egovernments/digit-ui-components";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";

/**
 * Nairobi citizen Home — phase 4 of the citizen overhaul.
 *
 * Spec source:
 *   - docs/nairobi-overhaul/research/screens.json — "Citizen / Home
 *     (Dashboard)" composition: Header (rendered by parent),
 *     welcome section, Quick Pay Card, Complaints Card.
 *   - docs/nairobi-overhaul/EXECUTION-PLAN.md §Phase 4.
 *   - docs/nairobi-overhaul/DECISIONS.md D-005 — citizen-side
 *     LandingPageCard consumption is removed in this phase. The file
 *     stays exported for employee/DSS surfaces.
 *
 * The earlier banner / CardBasedOptions grid is replaced with the two
 * NairobiServiceCard surfaces — Pay Bills and File or Track Complaints.
 * The early-redirect logic for `select-language`, MDMS `redirectURL`,
 * and the `sanitation-ui` / `sandbox-ui` route is preserved unchanged
 * so existing tenants keep their landing behaviour.
 */
const Home = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const tenantId = Digit.Utils.getMultiRootTenant()
    ? Digit.ULBService.getStateId()
    : Digit.ULBService.getCitizenCurrentTenant();
  const { data: { uiHomePage } = {}, isLoading } = Digit.Hooks.useStore.getInitData();

  const redirectURL = uiHomePage?.redirectURL;

  useEffect(() => {
    if (!tenantId) {
      history.push(`/${window?.contextPath}/citizen/select-language`);
    } else if (redirectURL) {
      history.push(`/${window?.contextPath}/citizen/${redirectURL}`);
    } else if (
      window?.location?.href?.includes?.("sanitation-ui") ||
      window?.location?.href?.includes?.("sandbox-ui")
    ) {
      history.push(`/${window?.contextPath}/citizen/all-services`);
    }
  }, [tenantId, redirectURL, history]);

  // i18n keys land in MDMS localization later; the fallback strings are
  // the Figma copy from research/screens.json so the surface still reads
  // sensibly before the keys ship.
  const t2 = (key, fallback) => {
    const v = t(key);
    return v === key ? fallback : v;
  };

  const welcomeHeading = t2("CS_HOME_WELCOME", "Hello");
  const welcomeSubtext = t2(
    "CS_HOME_SUBTEXT",
    "Stay updated with Nairobi services"
  );

  const payTitle = t2("CS_HOME_PAY_TITLE", "Pay Bills");
  const payDescription = t2(
    "CS_HOME_PAY_DESCRIPTION",
    "Pay water, garbage and other bills"
  );
  const payCta = t2("CS_HOME_PAY_CTA", "Pay Now");

  const complaintsTitle = t2(
    "CS_HOME_COMPLAINTS_TITLE",
    "File or Track Complaints"
  );
  const complaintsDescription = t2(
    "CS_HOME_COMPLAINTS_DESCRIPTION",
    "Report issues and track complaint status"
  );
  const complaintsCta = t2("CS_HOME_COMPLAINTS_CTA", "File a Complaint");

  const goToPay = () => {
    // The closest "pay landing" today is the all-services tile grid
    // (used by the static sidebar's pay entry and the sanitation/sandbox
    // tenants). When a dedicated /citizen/payment landing ships, swap
    // this push.
    history.push(`/${window?.contextPath}/citizen/all-services`);
  };

  const goToFileComplaint = () => {
    // PGR module mounts at `/${contextPath}/citizen/pgr` (lowercased
    // module code from packages/modules/core/src/pages/citizen/index.js).
    // Step 1 of the Create wizard is the complaint-type picker.
    history.push(
      `/${window?.contextPath}/citizen/pgr/create-complaint/complaint-type`
    );
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="HomePageContainer">
      <div className="HomePageWrapper nairobi-home">
        <header className="nairobi-home__welcome">
          <h1 className="nairobi-home__welcome-title">{welcomeHeading}</h1>
          <p className="nairobi-home__welcome-subtext">{welcomeSubtext}</p>
        </header>

        <div className="nairobi-home__cards">
          <NairobiServiceCard
            title={payTitle}
            description={payDescription}
            ctaLabel={payCta}
            onClick={goToPay}
          />
          <NairobiServiceCard
            title={complaintsTitle}
            description={complaintsDescription}
            ctaLabel={complaintsCta}
            onClick={goToFileComplaint}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
