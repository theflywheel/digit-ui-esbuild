import React from 'react';
import ReactDOM from 'react-dom';
import { initLibraries } from "@egovernments/digit-ui-libraries";
import "./index.css";
import App from './App';
import { applyTheme } from "./theme/applyTheme";
import defaultTheme from "./theme/default.json";
import { Colors } from "@egovernments/digit-ui-components";

// Mirror an MDMS theme into the JS Colors constant imported by digit-ui-components
// atoms (LandingPageCard, MenuCard, Tab, SideNav, Hamburger, Tag, UploadWidget, ...).
// Those components read primary[1] / primary[2] / primary.bg as inline svg fills at
// render time and never see CSS vars, so the runtime --color-* override misses them.
// Mutating the shared object keeps them aligned with whatever applyTheme just wrote.
const mirrorColorsConstant = (config) => {
  const colors = config?.colors;
  if (!colors || !Colors?.lightTheme) return;
  const p = Colors.lightTheme.primary;
  if (p) {
    if (colors.primary?.main) p[1] = colors.primary.main;
    if (colors.primary?.dark) p[2] = colors.primary.dark;
    if (colors.primary?.light) p.bg = colors.primary.light;
  }
  const a = Colors.lightTheme.alert;
  if (a) {
    if (colors.error) a.error = colors.error;
    if (colors.success) a.success = colors.success;
    if (colors["info-dark"]) a.info = colors["info-dark"];
    if (colors["warning-dark"]) a.warning = colors["warning-dark"];
  }
};

const applyThemeAndMirror = (config) => {
  applyTheme(config);
  mirrorColorsConstant(config);
};

// Apply the bundled default theme synchronously before render.
// MDMS-driven per-tenant theme is applied later in StoreService.digitInitData()
// via window.Digit.applyTheme(); defaults remain applied on failure.
applyThemeAndMirror(defaultTheme);

// Expose for integration tests in dev builds; esbuild's NODE_ENV define makes
// this a no-op (and dead-code-eliminated) in production bundles.
if (process.env.NODE_ENV !== "production") {
  window.__applyTheme = applyThemeAndMirror;
}

initLibraries();

window.Digit.Customizations = { PGR: {}};
window.Digit.applyTheme = applyThemeAndMirror;

const DEFAULT_LOCALE = "en_IN";

const parseValue = (value) => {
  try { return JSON.parse(value); } catch (e) { return value; }
};

const getFromStorage = (key) => {
  const value = window.localStorage.getItem(key);
  return value && value !== "undefined" ? parseValue(value) : null;
};

const getFromInfo = (info) => {
  if (!info) return null;
  if (typeof info === "string") return getFromInfo(parseValue(info));
  return info?.tenantId || info?.tenantid || info?.userInfo?.tenantId || null;
};

const normalizeLocale = () => {
  window.localStorage.setItem("locale", DEFAULT_LOCALE);
  window.localStorage.setItem("selectedLanguage", DEFAULT_LOCALE);
  window.localStorage.setItem("i18nextLng", DEFAULT_LOCALE);
  if (window?.Digit?.StoreData?.setCurrentLanguage) {
    window.Digit.StoreData.setCurrentLanguage(DEFAULT_LOCALE);
  }
};

const isKeycloakAuth = () =>
  window?.globalConfigs?.getConfig("AUTH_PROVIDER") === "keycloak";

async function bootstrap() {
  {
    const user = window.Digit.SessionStorage.get("User");
    if (!user || !user.access_token || !user.info) {
      const token = getFromStorage("token");
      const citizenToken = getFromStorage("Citizen.token");
      const citizenInfo = getFromStorage("Citizen.user-info");
      const stateCode = window?.globalConfigs?.getConfig("STATE_LEVEL_TENANT_ID");
      const citizenTenantId = getFromStorage("Citizen.tenant-id") || getFromInfo(citizenInfo) || stateCode;
      const employeeToken = getFromStorage("Employee.token");
      const employeeInfo = getFromStorage("Employee.user-info");
      const employeeTenantId = getFromStorage("Employee.tenant-id") || getFromInfo(employeeInfo) || stateCode;
      const userType = token === citizenToken ? "citizen" : "employee";

      window.Digit.SessionStorage.set("user_type", userType);
      window.Digit.SessionStorage.set("userType", userType);
      const getUserDetails = (access_token, info) => ({ token: access_token, access_token, info });
      const userDetails = userType === "citizen"
        ? getUserDetails(citizenToken, citizenInfo)
        : getUserDetails(employeeToken, employeeInfo);
      window.Digit.SessionStorage.set("User", userDetails);
      window.Digit.SessionStorage.set("Citizen.tenantId", citizenTenantId);
      window.Digit.SessionStorage.set("Employee.tenantId", employeeTenantId);
      if (citizenTenantId) window.localStorage.setItem("Citizen.tenant-id", citizenTenantId);
      if (employeeTenantId) window.localStorage.setItem("Employee.tenant-id", employeeTenantId);
    }
  }

  normalizeLocale();
  const stateCode = window?.globalConfigs?.getConfig("STATE_LEVEL_TENANT_ID");
  const sessionEmployeeTenant = window.Digit.SessionStorage.get("Employee.tenantId");
  const sessionCitizenTenant = window.Digit.SessionStorage.get("Citizen.tenantId");
  if (!sessionEmployeeTenant) {
    const fallback = getFromStorage("Employee.tenant-id") || getFromInfo(window.Digit.SessionStorage.get("User")?.info) || stateCode;
    if (fallback) {
      window.Digit.SessionStorage.set("Employee.tenantId", fallback);
      window.localStorage.setItem("Employee.tenant-id", fallback);
    }
  }
  if (!sessionCitizenTenant) {
    const fallback = getFromStorage("Citizen.tenant-id") || getFromInfo(window.Digit.SessionStorage.get("User")?.info) || stateCode;
    if (fallback) {
      window.Digit.SessionStorage.set("Citizen.tenantId", fallback);
      window.localStorage.setItem("Citizen.tenant-id", fallback);
    }
  }

  console.log("[bootstrap] About to call ReactDOM.render()");
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('root')
  );
}

bootstrap();
