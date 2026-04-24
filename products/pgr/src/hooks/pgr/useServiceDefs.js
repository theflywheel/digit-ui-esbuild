import { useTranslation } from "react-i18next";

const { useState, useEffect } = require("react");

const useServiceDefs = (tenantId, moduleCode) => {
  const [localMenu, setLocalMenu] = useState([]);
  const SessionStorage = Digit.SessionStorage;

  useEffect(() => {
    (async () => {
      const serviceDefs = await Digit.MDMSService.getServiceDefs(tenantId, moduleCode);
      SessionStorage.set("serviceDefs", serviceDefs);

      // `menuPathName` mirrors the key convention already used by the
      // citizen FormExplorer (`SERVICEDEFS.<MENUPATH_UPPER>`) and is
      // what the employee Create Complaint form's `SelectComplaintType`
      // dropdown reads via `optionsKey`. Without it, the Dropdown runs
      // `t(undefined)` and renders blank rows.
      const serviceDefsWithKeys = serviceDefs.map((def) => ({
        ...def,
        i18nKey: "SERVICEDEFS." + def.serviceCode.toUpperCase() + `.${def.department}`,
        code: `${def.serviceCode}.${def.department}`,
        menuPathName: def.menuPath ? `SERVICEDEFS.${def.menuPath.toUpperCase()}` : undefined,
      }));
      setLocalMenu(serviceDefsWithKeys);
    })();
  }, [tenantId, moduleCode]);

  return localMenu;
};

export default useServiceDefs;