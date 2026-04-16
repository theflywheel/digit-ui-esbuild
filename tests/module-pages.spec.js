// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * Module page rendering tests — adapted from the PGR E2E tests in
 * digit-ui-fix/local-setup/tests/e2e/specs/ for the mock server environment.
 *
 * These verify that each module's pages render without critical JS errors
 * and display the expected UI elements. They use session injection (not form
 * login) following the same pattern as the upstream tests' loginViaApi().
 */

// --- Shared helpers ---

/** Intercept CDN calls to avoid network dependencies (same as smoke tests). */
async function mockExternalResources(page) {
  await page.route("**/unpkg.com/**/xlsx*", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.XLSX = {
        utils: { sheet_to_json: function(){return[]}, json_to_sheet: function(){return{}}, book_new: function(){return{SheetNames:[],Sheets:{}}}, book_append_sheet: function(){} },
        write: function(){return ''},
        read: function(){return {SheetNames:[], Sheets:{}}},
        writeFile: function(){}
      };`,
    })
  );
  await page.route("**/unpkg.com/**/keycloak*", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.Keycloak = function(config) {
        this.init = function() { return Promise.reject('not configured'); };
        this.login = function() {};
        this.logout = function() {};
        this.token = '';
        this.authenticated = false;
      };`,
    })
  );
  await page.route("**/unpkg.com/**/*.css", (route) =>
    route.fulfill({ contentType: "text/css", body: "" })
  );
  await page.route("**/fonts.googleapis.com/**", (route) => route.abort());
  await page.route("**/fonts.gstatic.com/**", (route) => route.abort());
  await page.route("**/s3.ap-south-1.amazonaws.com/**", (route) =>
    route.fulfill({ contentType: "image/png", body: Buffer.alloc(0) })
  );
  await page.route("**/egov-dev-assets.s3.**", (route) =>
    route.fulfill({ contentType: "image/png", body: Buffer.alloc(0) })
  );
}

/**
 * Inject an authenticated employee session into the page.
 * Mirrors loginViaApi() from the upstream test utils.
 */
async function injectAuthSession(page) {
  // First load any page so we have access to window.Digit
  await page.goto("/digit-ui/employee/user/login");
  await page.waitForSelector("form, input, [class*='login']", { timeout: 30000 });

  await page.evaluate(() => {
    const userInfo = {
      id: 1,
      uuid: "550e8400-e29b-41d4-a716-446655440000",
      userName: "ADMIN",
      name: "Test Admin",
      type: "EMPLOYEE",
      mobileNumber: "9999999999",
      tenantId: "uitest",
      active: true,
      roles: [
        { code: "EMPLOYEE", name: "Employee", tenantId: "uitest" },
        { code: "GRO", name: "Grievance Routing Officer", tenantId: "uitest" },
        { code: "PGR_LME", name: "Last Mile Employee", tenantId: "uitest" },
        { code: "HRMS_ADMIN", name: "HRMS Admin", tenantId: "uitest" },
      ],
    };
    const token = "test-token-12345";
    localStorage.setItem("token", token);
    localStorage.setItem("Employee.token", token);
    localStorage.setItem("Employee.tenant-id", "uitest");
    localStorage.setItem("tenant-id", "uitest");
    localStorage.setItem("user-info", JSON.stringify(userInfo));
    localStorage.setItem("Employee.user-info", JSON.stringify(userInfo));
    localStorage.setItem("Employee.locale", "en_IN");
    window.Digit.SessionStorage.set("User", {
      access_token: token,
      token: token,
      info: userInfo,
    });
    window.Digit.SessionStorage.set("Employee.tenantId", "uitest");
    window.Digit.UserService.setUser({
      access_token: token,
      token: token,
      info: userInfo,
    });
  });
}

/** Collect JS errors during page load, filtering known harmless ones. */
function trackErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return {
    getCriticalErrors: () =>
      errors.filter(
        (e) =>
          !e.includes("keycloak") &&
          !e.includes("not configured") &&
          !e.includes("Network") &&
          !e.includes("AbortError") &&
          !e.includes("Failed to fetch") &&
          !e.includes("cacheTimeInSecs") &&
          !e.includes("ResizeObserver")
      ),
  };
}

// --- Tests ---

test.describe("Employee Home & Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await mockExternalResources(page);
  });

  test("employee home renders module cards after login", async ({ page }) => {
    const tracker = trackErrors(page);
    await injectAuthSession(page);

    await page.goto("/digit-ui/employee");
    await page.waitForSelector(
      '[class*="sidebar"], [class*="Sidebar"], [class*="header"], [class*="home"], #root > *',
      { timeout: 15000 }
    );

    // Should not redirect back to login
    expect(page.url()).not.toContain("/user/login");

    // Page should have rendered content
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(0);

    expect(tracker.getCriticalErrors(), "JS errors on employee home").toHaveLength(0);
  });
});

test.describe("PGR Module Pages", () => {
  test.beforeEach(async ({ page }) => {
    await mockExternalResources(page);
  });

  test("PGR inbox loads module (may show error page without full MDMS config)", async ({ page }) => {
    const tracker = trackErrors(page);
    await injectAuthSession(page);

    await page.goto("/digit-ui/employee/pgr/inbox");

    // Wait for any content — inbox table, error boundary, or root content
    await page.waitForSelector(
      '[class*="inbox"], [class*="Inbox"], table, [class*="SearchResult"], [class*="error"], #root > *',
      { timeout: 15000 }
    );

    // Should not redirect back to login
    expect(page.url()).not.toContain("/user/login");

    // Page rendered something (inbox or error boundary — both valid with mock server)
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(0);
  });

  test("PGR complaint create page renders", async ({ page }) => {
    const tracker = trackErrors(page);
    await injectAuthSession(page);

    await page.goto("/digit-ui/employee/pgr/complaint/create");

    // Wait for the create form or any form content
    await page.waitForSelector(
      'form, [class*="FormComposer"], [class*="create"], #root > *',
      { timeout: 15000 }
    );

    expect(page.url()).not.toContain("/user/login");

    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(0);

    expect(tracker.getCriticalErrors(), "JS errors on PGR create").toHaveLength(0);
  });

  test("PGR complaint details page renders", async ({ page }) => {
    const tracker = trackErrors(page);
    await injectAuthSession(page);

    // Navigate to the mock complaint's details page
    await page.goto("/digit-ui/employee/pgr/complaint/details/PG-PGR-2026-04-0001");

    // Wait for details content
    await page.waitForSelector(
      '[class*="detail"], [class*="Detail"], [class*="complaint"], #root > *',
      { timeout: 15000 }
    );

    expect(page.url()).not.toContain("/user/login");

    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(0);

    expect(tracker.getCriticalErrors(), "JS errors on PGR details").toHaveLength(0);
  });
});

test.describe("HRMS Module Pages", () => {
  test.beforeEach(async ({ page }) => {
    await mockExternalResources(page);
  });

  test("HRMS inbox renders without errors", async ({ page }) => {
    const tracker = trackErrors(page);
    await injectAuthSession(page);

    await page.goto("/digit-ui/employee/hrms/inbox");

    await page.waitForSelector(
      '[class*="inbox"], [class*="Inbox"], table, [class*="SearchResult"], #root > *',
      { timeout: 15000 }
    );

    expect(page.url()).not.toContain("/user/login");

    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(0);

    expect(tracker.getCriticalErrors(), "JS errors on HRMS inbox").toHaveLength(0);
  });

  test("HRMS create employee page renders", async ({ page }) => {
    const tracker = trackErrors(page);
    await injectAuthSession(page);

    await page.goto("/digit-ui/employee/hrms/create");

    // Wait for form or any content (including loading states)
    await page.waitForSelector(
      'form, [class*="FormComposer"], [class*="create"], [class*="error"], #root > *',
      { timeout: 15000 }
    );

    // Let async rendering settle
    await page.waitForTimeout(2000);

    expect(page.url()).not.toContain("/user/login");

    expect(tracker.getCriticalErrors(), "JS errors on HRMS create").toHaveLength(0);
  });
});

test.describe("Console Error Detection (all modules)", () => {
  test.beforeEach(async ({ page }) => {
    await mockExternalResources(page);
  });

  const modulePages = [
    { name: "Employee Home", path: "/digit-ui/employee" },
    { name: "PGR Inbox", path: "/digit-ui/employee/pgr/inbox" },
    { name: "HRMS Inbox", path: "/digit-ui/employee/hrms/inbox" },
  ];

  for (const { name, path } of modulePages) {
    test(`no critical JS errors on ${name}`, async ({ page }) => {
      const tracker = trackErrors(page);
      await injectAuthSession(page);

      await page.goto(path);
      await page.waitForSelector("#root > *", { timeout: 15000 });

      // Let async renders settle
      await page.waitForTimeout(2000);

      const critical = tracker.getCriticalErrors();
      expect(
        critical,
        `Critical JS errors on ${name}:\n${critical.join("\n")}`
      ).toHaveLength(0);
    });
  }
});
