// Separate Playwright config for the theme integration test. Unlike the repo's
// main playwright.config.js, this one does NOT spin up a mock server — it
// assumes the esbuild dev server is already running on POC_BASE_URL
// (default http://127.0.0.1:19080/digit-ui/).
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: ".",
  testMatch: "theme.spec.js",
  timeout: 60000,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
