// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * Intercept external CDN calls to avoid network dependencies in CI.
 * Stubs XLSX and Keycloak globals, blocks fonts and images.
 */
async function mockExternalResources(page) {
  // Stub XLSX CDN
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

  // Stub Keycloak CDN
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

  // Return empty CSS for CDN stylesheets
  await page.route("**/unpkg.com/**/*.css", (route) =>
    route.fulfill({ contentType: "text/css", body: "" })
  );

  // Block Google fonts
  await page.route("**/fonts.googleapis.com/**", (route) => route.abort());
  await page.route("**/fonts.gstatic.com/**", (route) => route.abort());

  // Block external images (favicons, logos)
  await page.route("**/s3.ap-south-1.amazonaws.com/**", (route) =>
    route.fulfill({ contentType: "image/png", body: Buffer.alloc(0) })
  );
  await page.route("**/egov-dev-assets.s3.**", (route) =>
    route.fulfill({ contentType: "image/png", body: Buffer.alloc(0) })
  );
}

test.describe("DIGIT UI Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    await mockExternalResources(page);
  });

  test("app loads and renders login page", async ({ page }) => {
    await page.goto("/digit-ui/employee");

    // The app should eventually show the login page (may redirect via React Router)
    // Wait for any form element or the login page to be present
    await page.waitForSelector("form, input, [class*='login'], [class*='Login']", {
      timeout: 30000,
    });

    // Verify the page has rendered something (not blank)
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(0);
  });

  test("login page has username and password fields", async ({ page }) => {
    await page.goto("/digit-ui/employee/user/login");

    // Wait for the form to render
    await page.waitForSelector("form, [class*='FormComposer'], [class*='login']", {
      timeout: 30000,
    });

    // Look for input fields - the login form should have at least 2 inputs
    const inputs = page.locator("input");
    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("employee dashboard renders after authentication", async ({ page }) => {
    // Set up authenticated session via localStorage (same as what login does)
    await page.goto("/digit-ui/employee/user/login");
    await page.waitForSelector("form", { timeout: 30000 });

    // Inject auth session directly — same keys the Login component writes
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
          { code: "GRO", name: "GRO", tenantId: "uitest" },
        ],
      };
      const token = "test-token-12345";
      localStorage.setItem("token", token);
      localStorage.setItem("Employee.token", token);
      localStorage.setItem("Employee.tenant-id", "uitest");
      localStorage.setItem("tenant-id", "uitest");
      localStorage.setItem("user-info", JSON.stringify(userInfo));
      localStorage.setItem("Employee.user-info", JSON.stringify(userInfo));
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

    // Navigate to employee home — should render instead of redirecting back to login
    await page.goto("/digit-ui/employee");

    // Wait for any post-login content (sidebar, heading, or module content)
    await page.waitForSelector(
      '[class*="sidebar"], [class*="Sidebar"], [class*="header"], [class*="home"], #root > *',
      { timeout: 15000 }
    );

    // Verify we're not back on the login page
    const url = page.url();
    expect(url).not.toContain("/user/login");

    // The page should render some content
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("build includes all expected output files", async () => {
    const fs = require("fs");
    const path = require("path");
    const buildDir = path.resolve(__dirname, "..", "build");

    const requiredFiles = ["index.html", "index.js", "index.css", "globalConfigs.js"];

    for (const file of requiredFiles) {
      const filePath = path.join(buildDir, file);
      expect(fs.existsSync(filePath), `${file} should exist in build/`).toBe(true);

      const stat = fs.statSync(filePath);
      expect(stat.size, `${file} should not be empty`).toBeGreaterThan(0);
    }
  });

  test("index.html references the built bundle", async () => {
    const fs = require("fs");
    const path = require("path");
    const html = fs.readFileSync(
      path.resolve(__dirname, "..", "build", "index.html"),
      "utf-8"
    );

    // Should have a script tag pointing to the JS bundle
    expect(html).toContain('<script src="/digit-ui/index.js"');

    // Should have a link tag for CSS
    expect(html).toContain('href="/digit-ui/index.css"');

    // Should have the root div
    expect(html).toContain('id="root"');
  });

  test("no JavaScript errors on initial load", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/digit-ui/employee");

    // Wait for the app to initialize
    await page.waitForSelector("form, input, [class*='login'], #root > *", {
      timeout: 30000,
    });

    // Allow known harmless errors (e.g., keycloak rejection, network errors for unhandled APIs)
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("keycloak") &&
        !e.includes("not configured") &&
        !e.includes("Network") &&
        !e.includes("AbortError") &&
        !e.includes("Failed to fetch") &&
        !e.includes("cacheTimeInSecs") // upstream MDMS cache code with empty settings
    );

    expect(
      criticalErrors,
      `Unexpected JS errors: ${criticalErrors.join("\n")}`
    ).toHaveLength(0);
  });
});
