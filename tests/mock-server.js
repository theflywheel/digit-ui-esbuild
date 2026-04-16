#!/usr/bin/env node

/**
 * Mock server for Playwright smoke tests.
 * Serves the built static files at /digit-ui/ and mocks DIGIT API endpoints.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 4173;
const BUILD_DIR = path.resolve(__dirname, "..", "build");

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".map": "application/json",
};

// --- Mock API responses ---

const MDMS_INIT_RESPONSE = {
  MdmsRes: {
    "common-masters": {
      StateInfo: [
        {
          code: "uitest",
          name: "UI Test State",
          hasLocalisation: false,
          languages: [{ label: "ENGLISH", value: "en_IN" }],
          logoUrl: "",
          bannerUrl: "",
          statelogo: "",
          logoUrlWhite: "",
          localizationModules: [],
        },
      ],
      Department: [{ code: "DEPT_1", name: "Administration", active: true }],
      Designation: [{ code: "DESIG_1", name: "Officer", active: true }],
      wfSlaConfig: [],
      uiHomePage: [],
    },
    tenant: {
      tenants: [
        {
          code: "uitest",
          name: "UI Test",
          logoId: "",
          city: { name: "Test City", code: "uitest" },
        },
        {
          code: "uitest.city",
          name: "Test City",
          logoId: "",
          city: { name: "Test City", code: "uitest.city" },
        },
      ],
      citymodule: [
        {
          code: "PGR",
          module: "PGR",
          active: true,
          order: 1,
          tenants: [{ code: "uitest.city" }],
        },
        {
          code: "HRMS",
          module: "HRMS",
          active: true,
          order: 2,
          tenants: [{ code: "uitest.city" }],
        },
        {
          code: "Utilities",
          module: "Utilities",
          active: true,
          order: 3,
          tenants: [{ code: "uitest.city" }],
        },
        {
          code: "Workbench",
          module: "Workbench",
          active: true,
          order: 4,
          tenants: [{ code: "uitest.city" }],
        },
      ],
      cities: [],
    },
    "DIGIT-UI": {
      ApiCachingSettings: [
        { serviceName: "mdmsInit", cacheTimeInSecs: 300, debounceTimeInMS: 500 },
        { serviceName: "mdmsCall", cacheTimeInSecs: 300, debounceTimeInMS: 500 },
        { serviceName: "localizationPersist", cacheTimeInSecs: 300, debounceTimeInMS: 500 },
      ],
    },
  },
};

const AUTH_RESPONSE = {
  access_token: "test-token-12345",
  token_type: "bearer",
  expires_in: 3600,
  scope: "read",
  UserRequest: {
    id: 1,
    uuid: "550e8400-e29b-41d4-a716-446655440000",
    userName: "ADMIN",
    name: "Test Admin",
    type: "EMPLOYEE",
    mobileNumber: "9999999999",
    emailId: "admin@test.org",
    tenantId: "uitest",
    active: true,
    roles: [
      { code: "EMPLOYEE", name: "Employee", tenantId: "uitest" },
      { code: "GRO", name: "Grievance Routing Officer", tenantId: "uitest" },
      { code: "PGR_LME", name: "Last Mile Employee", tenantId: "uitest" },
      { code: "HRMS_ADMIN", name: "HRMS Admin", tenantId: "uitest" },
    ],
  },
};

const LOCALIZATION_RESPONSE = {
  messages: [
    { code: "CORE_COMMON_USERNAME", message: "Username", locale: "en_IN", module: "rainmaker-common" },
    { code: "CORE_COMMON_PASSWORD", message: "Password", locale: "en_IN", module: "rainmaker-common" },
    { code: "CORE_COMMON_LOGIN", message: "Login", locale: "en_IN", module: "rainmaker-common" },
    { code: "CORE_COMMON_FORGOT_PASSWORD", message: "Forgot Password", locale: "en_IN", module: "rainmaker-common" },
    { code: "CORE_COMMON_HOME", message: "Home", locale: "en_IN", module: "rainmaker-common" },
    { code: "ACTION_TEST_COMPLAINTS", message: "Complaints", locale: "en_IN", module: "rainmaker-pgr" },
    { code: "CS_HEADER_COMPLAINT", message: "File a Complaint", locale: "en_IN", module: "rainmaker-pgr" },
  ],
};

const ACCESS_CONTROL_RESPONSE = {
  "actions-test": [
    {
      id: 1,
      name: "PGR",
      url: "/digit-ui/employee/pgr",
      displayName: "Complaints",
      orderNumber: 1,
      enabled: true,
      path: "PGR",
      navigationURL: "/digit-ui/employee/pgr",
      leftIcon: "dynamic:ComplaintsIcon",
    },
    {
      id: 2,
      name: "HRMS",
      url: "/digit-ui/employee/hrms",
      displayName: "HR Management",
      orderNumber: 2,
      enabled: true,
      path: "HRMS",
      navigationURL: "/digit-ui/employee/hrms",
      leftIcon: "dynamic:HRMSIcon",
    },
  ],
};

// PGR complaint data for inbox/details tests
const PGR_COMPLAINT = {
  service: {
    citizen: { name: "Test Citizen", mobileNumber: "8888888888" },
    id: "pgr-complaint-001",
    tenantId: "uitest.city",
    serviceCode: "GarbageNeedsToBeCleared",
    serviceRequestId: "PG-PGR-2026-04-0001",
    description: "Garbage not cleared since 3 days",
    accountId: "citizen-uuid-001",
    rating: 0,
    applicationStatus: "PENDINGATLME",
    source: "web",
    address: {
      tenantId: "uitest.city",
      doorNo: "42",
      landmark: "Near bus stop",
      city: "uitest.city",
      locality: { code: "LOCALITY1", name: "Ward 1" },
      geoLocation: { latitude: 0.0, longitude: 0.0 },
    },
    auditDetails: {
      createdBy: "citizen-uuid-001",
      createdTime: Date.now() - 86400000,
      lastModifiedBy: "citizen-uuid-001",
      lastModifiedTime: Date.now() - 86400000,
    },
  },
  workflow: {
    action: "APPLY",
    assignes: [],
    comments: [{ text: "Complaint filed via web" }],
  },
};

const PGR_SEARCH_RESPONSE = {
  ServiceWrappers: [PGR_COMPLAINT],
  totalCount: 1,
};

const PGR_SERVICEDEFS_RESPONSE = {
  ServiceDefs: [
    { serviceCode: "GarbageNeedsToBeCleared", name: "Garbage Needs To Be Cleared", active: true, order: 1 },
    { serviceCode: "NoStreetLight", name: "No Street Light", active: true, order: 2 },
    { serviceCode: "BrokenWaterPipeline", name: "Broken Water Pipeline", active: true, order: 3 },
  ],
};

const WORKFLOW_BUSINESS_SERVICE = {
  BusinessServices: [
    {
      tenantId: "uitest",
      businessService: "PGR",
      business: "pgr-services",
      businessServiceSla: 432000000,
      states: [
        { uuid: "s1", tenantId: "uitest", businessServiceId: "pgr", state: null, applicationStatus: null, docUploadRequired: false, isStartState: true, isTerminateState: false, isStateUpdatable: true, actions: [{ uuid: "a1", tenantId: "uitest", currentState: "s1", action: "APPLY", nextState: "s2", roles: ["CITIZEN", "CSR"] }] },
        { uuid: "s2", tenantId: "uitest", businessServiceId: "pgr", state: "PENDINGFORASSIGNMENT", applicationStatus: "PENDINGFORASSIGNMENT", docUploadRequired: false, isStartState: false, isTerminateState: false, isStateUpdatable: true, actions: [{ uuid: "a2", tenantId: "uitest", currentState: "s2", action: "ASSIGN", nextState: "s3", roles: ["GRO"] }] },
        { uuid: "s3", tenantId: "uitest", businessServiceId: "pgr", state: "PENDINGATLME", applicationStatus: "PENDINGATLME", docUploadRequired: false, isStartState: false, isTerminateState: false, isStateUpdatable: true, actions: [{ uuid: "a3", tenantId: "uitest", currentState: "s3", action: "RESOLVE", nextState: "s4", roles: ["PGR_LME"] }] },
        { uuid: "s4", tenantId: "uitest", businessServiceId: "pgr", state: "RESOLVED", applicationStatus: "RESOLVED", docUploadRequired: false, isStartState: false, isTerminateState: true, isStateUpdatable: false, actions: [] },
      ],
    },
  ],
};

const INBOX_RESPONSE = {
  items: [
    {
      businessObject: {
        service: PGR_COMPLAINT.service,
        workflow: PGR_COMPLAINT.workflow,
      },
      ProcessInstance: {
        id: "pi-001",
        tenantId: "uitest.city",
        businessService: "PGR",
        businessId: "PG-PGR-2026-04-0001",
        action: "APPLY",
        state: { uuid: "s2", state: "PENDINGFORASSIGNMENT", applicationStatus: "PENDINGFORASSIGNMENT" },
      },
    },
  ],
  totalCount: 1,
  statusMap: [{ statusid: "PENDINGFORASSIGNMENT", count: 1 }],
};

const HRMS_EMPLOYEES_RESPONSE = {
  Employees: [
    {
      id: "emp-001",
      uuid: "emp-uuid-001",
      code: "EMP-001",
      user: {
        id: 2,
        uuid: "emp-uuid-001",
        userName: "JDOE",
        name: "Jane Doe",
        mobileNumber: "7777777777",
        type: "EMPLOYEE",
        tenantId: "uitest.city",
        active: true,
        roles: [{ code: "PGR_LME", name: "Last Mile Employee", tenantId: "uitest.city" }],
      },
      tenantId: "uitest.city",
      employeeStatus: "EMPLOYED",
      employeeType: "PERMANENT",
      dateOfAppointment: Date.now() - 365 * 86400000,
      isActive: true,
      assignments: [{ department: "DEPT_1", designation: "DESIG_1", fromDate: Date.now() - 365 * 86400000, isCurrentAssignment: true }],
      jurisdictions: [{ hierarchy: "ADMIN", boundaryType: "City", boundary: "uitest.city" }],
    },
  ],
};

const EMPTY_JSON = {};

// --- Route handlers ---

function getRequestBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
  });
}

function serveStatic(req, res) {
  // Strip /digit-ui/ prefix
  let urlPath = req.url.split("?")[0];
  let filePath;

  if (urlPath.startsWith("/digit-ui/")) {
    filePath = path.join(BUILD_DIR, urlPath.replace("/digit-ui/", ""));
  } else if (urlPath === "/digit-ui" || urlPath === "/digit-ui/") {
    filePath = path.join(BUILD_DIR, "index.html");
  } else {
    return false;
  }

  // SPA fallback: serve index.html for paths that don't match a file
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(BUILD_DIR, "index.html");
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
    return true;
  } catch {
    return false;
  }
}

function jsonResponse(res, data, status = 200) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const urlPath = req.url.split("?")[0];

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, auth-token",
    });
    res.end();
    return;
  }

  // API routes
  if (urlPath === "/mdms-v2/v1/_search" && req.method === "POST") {
    return jsonResponse(res, MDMS_INIT_RESPONSE);
  }

  if (urlPath === "/localization/messages/v1/_search") {
    return jsonResponse(res, LOCALIZATION_RESPONSE);
  }

  if (urlPath === "/user/oauth/token" && req.method === "POST") {
    return jsonResponse(res, AUTH_RESPONSE);
  }

  if (urlPath === "/access/v1/actions/mdms/_get" && req.method === "POST") {
    return jsonResponse(res, ACCESS_CONTROL_RESPONSE);
  }

  if (urlPath === "/user/_search" && req.method === "POST") {
    return jsonResponse(res, { user: [AUTH_RESPONSE.UserRequest] });
  }

  if (
    urlPath === "/egov-location/location/v11/boundarys/_search" &&
    req.method === "POST"
  ) {
    return jsonResponse(res, {
      TenantBoundary: [
        {
          hierarchyType: { code: "ADMIN", name: "ADMIN" },
          boundary: {
            id: "1",
            boundaryNum: 1,
            name: "uitest",
            localname: "UI Test",
            longitude: null,
            latitude: null,
            label: "City",
            code: "uitest",
            children: [],
          },
        },
      ],
    });
  }

  if (urlPath === "/boundary-service/boundary-relationships/_search" && req.method === "POST") {
    return jsonResponse(res, {
      TenantBoundary: [{
        tenantId: "uitest.city",
        hierarchyType: { code: "ADMIN", name: "ADMIN" },
        boundary: [{
          id: "1", code: "uitest.city", boundaryType: "City", children: [
            { id: "2", code: "LOCALITY1", boundaryType: "Locality", children: [], name: "Ward 1" },
          ], name: "Test City",
        }],
      }],
    });
  }

  if (urlPath === "/tenant-management/tenant/config/_search") {
    return jsonResponse(res, { tenantConfigs: null });
  }

  if (urlPath === "/egov-workflow-v2/egov-wf/businessservice/_search") {
    return jsonResponse(res, WORKFLOW_BUSINESS_SERVICE);
  }

  if (urlPath === "/filestore/v1/files/url") {
    return jsonResponse(res, { fileStoreIds: [] });
  }

  if (urlPath === "/user-otp/v1/_send" && req.method === "POST") {
    return jsonResponse(res, { otp: { UUID: "test" } });
  }

  if (urlPath === "/egov-hrms/employees/_search") {
    return jsonResponse(res, HRMS_EMPLOYEES_RESPONSE);
  }

  if (urlPath === "/pgr-services/v2/request/_search") {
    return jsonResponse(res, PGR_SEARCH_RESPONSE);
  }

  if (urlPath === "/pgr-services/v2/request/_count") {
    return jsonResponse(res, { count: 1 });
  }

  if (urlPath === "/egov-workflow-v2/egov-wf/process/_search") {
    return jsonResponse(res, {
      ProcessInstances: [{
        id: "pi-001",
        tenantId: "uitest.city",
        businessService: "PGR",
        businessId: "PG-PGR-2026-04-0001",
        action: "APPLY",
        state: { uuid: "s2", state: "PENDINGFORASSIGNMENT", applicationStatus: "PENDINGFORASSIGNMENT" },
        assignes: null,
        comment: "Complaint filed",
        auditDetails: { createdBy: "citizen-uuid-001", createdTime: Date.now() - 86400000, lastModifiedBy: "citizen-uuid-001", lastModifiedTime: Date.now() - 86400000 },
      }],
    });
  }

  if (urlPath === "/inbox/v2/_search" || urlPath === "/works-inbox-service/v2/_search") {
    return jsonResponse(res, INBOX_RESPONSE);
  }

  if (urlPath === "/mdms-v2/v2/_search" && req.method === "POST") {
    return jsonResponse(res, { mdms: [] });
  }

  if (urlPath === "/egov-hrms/employees/_count") {
    return jsonResponse(res, { count: 1 });
  }

  // Static file serving for /digit-ui/*
  if (urlPath.startsWith("/digit-ui")) {
    if (serveStatic(req, res)) return;
  }

  // Catch-all for unhandled API calls - return empty success
  if (req.method === "POST") {
    await getRequestBody(req);
    return jsonResponse(res, EMPTY_JSON);
  }

  // 404
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`Mock server running at http://localhost:${PORT}`);
  console.log(`Serving build from: ${BUILD_DIR}`);
});
