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

test("window.Digit.applyTheme bridge is available after init", async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForSelector("#root", { timeout: 10000 });
  await page.waitForTimeout(2000);

  const hasBridge = await page.evaluate(() => typeof window?.Digit?.applyTheme === "function");
  expect(hasBridge).toBe(true);

  // Apply a theme via the bridge and verify it takes effect.
  await page.evaluate(() => {
    window.Digit.applyTheme({
      version: "1",
      code: "bridge-test",
      colors: { primary: { main: "#006B3F" } },
    });
  });
  const val = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--color-primary-main").trim()
  );
  expect(val).toBe("#006B3F");
});

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
      primary: { light: "#a78bfa", main: "#7c3aed", dark: "#5b21b6", accent: "#c026d3", "selected-bg": "#faf5ff" },
      text: { heading: "#1e1b4b", muted: "#6d28d9" },
      link: { normal: "#16a34a", hover: "#15803d" },
      "error-dark": "#991b1b",
      "info-dark": "#1e40af",
      "warning-dark": "#854d0e",
      grey: { disabled: "#d1d5db", lighter: "#f1f5f9" },
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

  // Check multiple vars shifted across all three phases of the audit.
  const vars = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return {
      // Phase 1 (TASK-021 baseline + multi-source vendor)
      primaryMain: cs.getPropertyValue("--color-primary-main").trim(),
      primaryLight: cs.getPropertyValue("--color-primary-light").trim(),
      primaryDark: cs.getPropertyValue("--color-primary-dark").trim(),
      linkNormal: cs.getPropertyValue("--color-link-normal").trim(),
      digitv2PrimaryBg: cs.getPropertyValue("--color-digitv2-primary-bg").trim(),
      // Phase 2 additions
      textHeading: cs.getPropertyValue("--color-text-heading").trim(),
      textMuted: cs.getPropertyValue("--color-text-muted").trim(),
      errorDark: cs.getPropertyValue("--color-error-dark").trim(),
      greyDisabled: cs.getPropertyValue("--color-grey-disabled").trim(),
      // Phase 3 additions
      primaryAccent: cs.getPropertyValue("--color-primary-accent").trim(),
      primarySelectedBg: cs.getPropertyValue("--color-primary-selected-bg").trim(),
      greyLighter: cs.getPropertyValue("--color-grey-lighter").trim(),
      infoDark: cs.getPropertyValue("--color-info-dark").trim(),
      warningDark: cs.getPropertyValue("--color-warning-dark").trim(),
    };
  });
  console.log(`after override:`, vars);
  const afterPng = await page.screenshot({ path: path.join(OUT_DIR, "after.png"), fullPage: false });

  // Hard assertions — originals from Phase 1 …
  expect(before).toMatch(/c84c0e/i);
  expect(vars.primaryMain).toBe("#7c3aed");
  expect(vars.primaryLight).toBe("#a78bfa");
  expect(vars.primaryDark).toBe("#5b21b6");
  expect(vars.linkNormal).toBe("#16a34a");
  expect(vars.digitv2PrimaryBg).toBe("#ede9fe");
  // … Phase-2 additions …
  expect(vars.textHeading).toBe("#1e1b4b");
  expect(vars.textMuted).toBe("#6d28d9");
  expect(vars.errorDark).toBe("#991b1b");
  expect(vars.greyDisabled).toBe("#d1d5db");
  // … Phase-3 additions.
  expect(vars.primaryAccent).toBe("#c026d3");
  expect(vars.primarySelectedBg).toBe("#faf5ff");
  expect(vars.greyLighter).toBe("#f1f5f9");
  expect(vars.infoDark).toBe("#1e40af");
  expect(vars.warningDark).toBe("#854d0e");
  // Pixel-diff: runtime override must visibly change rendering.
  expect(Buffer.compare(beforePng, afterPng)).not.toBe(0);
});
