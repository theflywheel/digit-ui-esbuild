import { Loader } from "@egovernments/digit-ui-react-components";
import React, { Suspense, lazy, useState } from "react";
import { useRouteMatch } from "react-router-dom";
import PGRCard from "./components/PGRCard";
import { overrideHooks, updateCustomConfigs } from "./utils";
import { ProviderContext } from "./utils/context";
import BoundaryComponent from "./components/BoundaryComponent";
import TimelineWrapper from "./components/TimeLineWrapper";
import AssigneeComponent from "./components/AssigneeComponent";
import Response from "./components/Response";
import BreadCrumbs from "./components/BreadCrumbs";
import getRootReducer from "./redux/reducers";

// Page-level route targets are lazy-loaded so the citizen bundle doesn't pull
// in employee screens (and vice versa), and each screen ships as its own
// chunk. Kept static above: small helpers rendered inline, or exposed through
// the global ComponentRegistryService to consumers that may not sit under a
// Suspense boundary.
const EmployeeApp = lazy(() => import("./pages/employee"));
const CitizenApp = lazy(() => import("./pages/citizen"));
const PGRDetails = lazy(() => import("./pages/employee/PGRDetails"));
const PGRSearchInbox = lazy(() => import("./pages/employee/PGRInbox"));
const CreateComplaint = lazy(() => import("./pages/employee/CreateComplaint"));
const ComplaintsList = lazy(() =>
  import("./pages/citizen/ComplaintsList").then((m) => ({ default: m.ComplaintsList }))
);
const ComplaintDetailsPage = lazy(() => import("./pages/citizen/ComplaintDetails"));
const SelectRating = lazy(() => import("./pages/citizen/Rating/SelectRating"));
const ResponseCitizen = lazy(() => import("./pages/citizen/Response"));
const GeoLocations = lazy(() => import("./components/GeoLocations"));
const SelectAddress = lazy(() => import("./pages/citizen/Create/Steps/SelectAddress"));
const SelectImages = lazy(() => import("./pages/citizen/Create/Steps/SelectImages"));
const CreatePGRFlow = lazy(() => import("./pages/citizen/Create/FormExplorer"));


export const PGRReducers = getRootReducer;


export const PGRModule = ({ stateCode, userType, tenants }) => {
  const { path, url } = useRouteMatch();
  const tenantId = Digit.ULBService.getCurrentTenantId();

  const hierarchyType = window?.globalConfigs?.getConfig("HIERARCHY_TYPE") || "ADMIN";
  const moduleCode = ["pgr", `boundary-${hierarchyType?.toString().toLowerCase()}`];
  const modulePrefix = "rainmaker";
  const language = Digit.StoreData.getCurrentLanguage();
  const { isLoading, data: store } = Digit.Services.useStore({
    stateCode,
    moduleCode,
    language,
    modulePrefix,
  });
  let user = Digit?.SessionStorage.get("User");

  // Only initialize boundary hierarchy for employee users (not needed for citizens)
  const { isLoading: isPGRInitializing } = userType === "employee"
    ? Digit.Hooks.pgr.usePGRInitialization({ tenantId: tenantId })
    : { isLoading: false };

  Digit.SessionStorage.set("PGR_TENANTS", tenants);

  if (isLoading || isPGRInitializing) {
    return <Loader />;
  }

  return (
    <Suspense fallback={<Loader />}>
      {userType === "citizen" ? (
        <CitizenApp />
      ) : (
        <ProviderContext>
          <EmployeeApp path={path} stateCode={stateCode} userType={userType} tenants={tenants} />
        </ProviderContext>
      )}
    </Suspense>
  );
};

const PGRLinks = ({ matchPath }) => {
  const { t } = useTranslation();
  const [params, setParams, clearParams] = Digit.Hooks.useSessionStorage(PGR_CITIZEN_CREATE_COMPLAINT, {});

  useEffect(() => {
    clearParams();
  }, []);

  const links = [
    {
      link: `${matchPath}/create-complaint/complaint-type`,
      i18nKey: t("CS_COMMON_FILE_A_COMPLAINT"),
    },
    {
      link: `${matchPath}/complaints`,
      i18nKey: t(LOCALE.MY_COMPLAINTS),
    },
  ];

  return <CitizenHomeCard header={t("CS_COMMON_HOME_COMPLAINTS")} links={links} Icon={ComplaintIcon} />;
};

const componentsToRegister = {
  PGRModule,
  PGRLinks,
  PGRCard,
  PGRBoundaryComponent: BoundaryComponent,
  PGRComplaintDetails: PGRDetails,
  PGRTimeLineWrapper: TimelineWrapper,
  PGRAssigneeComponent: AssigneeComponent,
  PGRSearchInbox,
  PGRCreateComplaint: CreateComplaint,
  PGRResponse: Response,
  PGRBreadCrumbs: BreadCrumbs,
  PGRComplaintsList: ComplaintsList,
  PGRComplaintDetailsPage: ComplaintDetailsPage,
  PGRSelectRating: SelectRating,
  PGRResponseCitzen: ResponseCitizen,
  GeoLocations,
  SelectAddress,
  SelectImages,
  CreatePGRFlow: CreatePGRFlow,
};

export const initPGRComponents = () => {
  overrideHooks();
  updateCustomConfigs();
  Object.entries(componentsToRegister).forEach(([key, value]) => {
    Digit.ComponentRegistryService.setComponent(key, value);
  });
};
