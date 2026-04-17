// @ts-check
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.js",
  testIgnore: ["**/theme.spec.js"],
  timeout: 60000,
  retries: 1,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:4173",
    headless: true,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  webServer: {
    command: "node tests/mock-server.js",
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
  },
});
