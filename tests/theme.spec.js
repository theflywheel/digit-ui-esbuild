// Integration test: confirm applyTheme() drives CSS custom properties at
// runtime across multiple token groups.
//
// 1. Load the app.
// 2. Snapshot with default theme (orange #c84c0e).
// 3. Call window.__applyTheme (exposed by dev builds) with an alternate theme
//    config that exercises primary + link + digitv2 surfaces.
// 4. Snapshot again.
// 5. Assert individual CSS variables flipped and that the two images are not
//    identical (theme swap is visible).

const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.POC_BASE_URL || "http://127.0.0.1:19080/digit-ui/";
const OUT_DIR = path.resolve(__dirname, "..", "test-results", "theme");

test("applyTheme runtime swap flips primary, link, and digitv2 surfaces", async ({ page }) => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Don't wait for network idle — backend APIs may not be running.
  // Just wait for the root element and initial paint.
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForSelector("#root", { timeout: 10000 });
  // Give React + vendor CSS a moment to paint.
  await page.waitForTimeout(2000);

  // Read the resolved --color-primary-main from :root. This should be the
  // DIGIT orange set either by the :root block in the vendor CSS or by
  // applyTheme() writing the same value from default.json.
  const before = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--color-primary-main").trim()
  );
  console.log(`before override: --color-primary-main = "${before}"`);

  const hasHook = await page.evaluate(() => typeof window.__applyTheme === "function");
  if (!hasHook) {
    throw new Error(
      "window.__applyTheme missing — this test requires a DEV build. " +
      "Production bundles strip the hook via esbuild's NODE_ENV define."
    );
  }

  const beforePng = await page.screenshot({ path: path.join(OUT_DIR, "before.png"), fullPage: false });

  // Override via the real applyTheme() so the test exercises the loader,
  // not just CSS custom properties. Asserts that primary + link + digitv2
  // surfaces all respond to a runtime theme swap.
  const alt = {
    version: "1",
    colors: {
      primary: { light: "#a78bfa", main: "#7c3aed", dark: "#5b21b6" },
      link: { normal: "#16a34a", hover: "#15803d" },
      digitv2: { "primary-bg": "#ede9fe" },
    },
  };
  await page.evaluate((cfg) => window.__applyTheme(cfg), alt);
  await page.waitForFunction(
    (expected) =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--color-primary-main").trim() === expected,
    "#7c3aed",
    { timeout: 5000 }
  );

  // Check multiple vars shifted, not just the one token the POC asserted.
  const vars = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return {
      primaryMain: cs.getPropertyValue("--color-primary-main").trim(),
      primaryLight: cs.getPropertyValue("--color-primary-light").trim(),
      primaryDark: cs.getPropertyValue("--color-primary-dark").trim(),
      linkNormal: cs.getPropertyValue("--color-link-normal").trim(),
      digitv2PrimaryBg: cs.getPropertyValue("--color-digitv2-primary-bg").trim(),
    };
  });
  console.log(`after override:`, vars);
  const afterPng = await page.screenshot({ path: path.join(OUT_DIR, "after.png"), fullPage: false });

  // Hard assertions.
  expect(before).toMatch(/c84c0e/i);
  expect(vars.primaryMain).toBe("#7c3aed");
  expect(vars.primaryLight).toBe("#a78bfa");
  expect(vars.primaryDark).toBe("#5b21b6");
  expect(vars.linkNormal).toBe("#16a34a");
  expect(vars.digitv2PrimaryBg).toBe("#ede9fe");
  // Pixel-diff: runtime override must visibly change rendering.
  expect(Buffer.compare(beforePng, afterPng)).not.toBe(0);
});
