import React, { Suspense } from "react";
import { initLibraries } from "@egovernments/digit-ui-libraries";
import { UICustomizations } from "./Customisations/UICustomizations";
import { initUtilitiesComponents } from "@egovernments/digit-ui-module-utilities";
import { initPGRComponents, PGRReducers, } from "@egovernments/digit-ui-module-pgr";
import { Loader } from "@egovernments/digit-ui-components";
import { initWorkbenchComponents } from "@egovernments/digit-ui-module-workbench";
import { initHRMSComponents } from "@egovernments/digit-ui-module-hrms";

window.contextPath = window?.globalConfigs?.getConfig("CONTEXT_PATH");

// Lazy load DigitUI
const DigitUI = React.lazy(() =>
  import("@egovernments/digit-ui-module-core").then((mod) => ({
    default: mod.DigitUI,
  }))
);

const enabledModules = [
  "Utilities",
  "PGR",
  "Workbench",
  "HRMS",
];

initLibraries().then(() => {
  initDigitUI();
});

const moduleReducers = (initData) => ({
  initData,
  pgr: PGRReducers(initData)
});

const initDigitUI = () => {
  window.Digit.ComponentRegistryService.setupRegistry({});
  window.Digit.Customizations = {
    commonUiConfig: UICustomizations,
  };

  initUtilitiesComponents();
  initPGRComponents();
  initWorkbenchComponents();
  initHRMSComponents();
};

function App() {
  window.contextPath = window?.globalConfigs?.getConfig("CONTEXT_PATH");
  const stateCode =
    window.globalConfigs?.getConfig("BOOTSTRAP_TENANT_ID") ||
    window.globalConfigs?.getConfig("STATE_LEVEL_TENANT_ID") ||
    process.env.REACT_APP_STATE_LEVEL_TENANT_ID ||
    "pg";
  if (!stateCode) {
    return <h1>stateCode is not defined</h1>;
  }
  return (
    <Suspense fallback={<Loader page={true} variant={"PageLoader"} />}>
      <DigitUI
        stateCode={stateCode}
        enabledModules={enabledModules}
        moduleReducers={moduleReducers}
        defaultLanding="employee"
        allowedUserTypes={["employee", "citizen"]}
      />
    </Suspense>
  );
}

export default App;
