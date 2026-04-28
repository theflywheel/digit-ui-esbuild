const { test } = require("node:test");
const assert = require("node:assert/strict");

function stubDocument() {
  const props = {};
  global.document = {
    documentElement: {
      style: {
        setProperty(name, value) { props[name] = value; },
      },
    },
  };
  const origWarn = console.warn;
  const origLog = console.log;
  console.warn = () => {};
  console.log = () => {};
  return { props, restore: () => { console.warn = origWarn; console.log = origLog; } };
}

function freshApply() {
  delete require.cache[require.resolve("./applyTheme.js")];
  return require("./applyTheme.js").applyTheme;
}

test("valid config: writes all flattened variables", () => {
  const { props, restore } = stubDocument();
  try {
    const applyTheme = freshApply();
    applyTheme({
      version: "1",
      colors: {
        primary: { main: "#ff0000", light: "#ff8080", dark: "#800000" },
        secondary: "#00ff00",
      },
    });
    assert.equal(props["--color-primary-main"], "#ff0000");
    assert.equal(props["--color-primary-light"], "#ff8080");
    assert.equal(props["--color-primary-dark"], "#800000");
    assert.equal(props["--color-secondary"], "#00ff00");
  } finally { restore(); }
});

test("missing colors key: valid config shape, no-op", () => {
  const { props, restore } = stubDocument();
  try {
    const applyTheme = freshApply();
    applyTheme({ version: "1" });
    assert.deepEqual(props, {});
  } finally { restore(); }
});

test("invalid value shape (not a hex): no-op", () => {
  const { props, restore } = stubDocument();
  try {
    const applyTheme = freshApply();
    applyTheme({ version: "1", colors: { primary: { main: "not-a-color" } } });
    assert.deepEqual(props, {});
  } finally { restore(); }
});

test("MDMS-shaped config with code field: applies colors, ignores extra properties", () => {
  const { props, restore } = stubDocument();
  try {
    const applyTheme = freshApply();
    applyTheme({
      version: "1",
      code: "kenya-green",
      name: "Kenya Green",
      tenantId: "ke",
      auditDetails: { createdBy: "admin", lastModifiedBy: "admin" },
      colors: {
        primary: { main: "#006B3F", dark: "#004D2C" },
        secondary: "#BB0000",
      },
    });
    assert.equal(props["--color-primary-main"], "#006B3F");
    assert.equal(props["--color-primary-dark"], "#004D2C");
    assert.equal(props["--color-secondary"], "#BB0000");
  } finally { restore(); }
});

test("null / undefined / non-object config: no-op", () => {
  const { props, restore } = stubDocument();
  try {
    const applyTheme = freshApply();
    applyTheme(null);
    applyTheme(undefined);
    applyTheme(42);
    applyTheme("theme");
    applyTheme([1, 2]);
    assert.deepEqual(props, {});
  } finally { restore(); }
});

// ── v2 semantic expansion ───────────────────────────────────────────────────

test("v2: `brand` fans out to --color-primary-main", () => {
  const { props, restore } = stubDocument();
  try {
    const applyTheme = freshApply();
    applyTheme({ version: "2", colors: { brand: "#FEC931" } });
    assert.equal(props["--color-primary-main"], "#FEC931");
  } finally { restore(); }
});

test("v2: `brand-on` fans out to primary-dark, primary-accent, link-*, text-heading", () => {
  const { props, restore } = stubDocument();
  try {
    const applyTheme = freshApply();
    applyTheme({ version: "2", colors: { brand: "#FEC931", "brand-on": "#204F37" } });
    assert.equal(props["--color-primary-dark"], "#204F37");
    assert.equal(props["--color-primary-accent"], "#204F37");
    assert.equal(props["--color-link-normal"], "#204F37");
    assert.equal(props["--color-link-hover"], "#204F37");
    assert.equal(props["--color-text-heading"], "#204F37");
  } finally { restore(); }
});

test("v2: `surface-header` covers both --color-secondary and --color-digitv2-header-sidenav", () => {
  const { props, restore } = stubDocument();
  try {
    const applyTheme = freshApply();
    applyTheme({ version: "2", colors: { brand: "#FEC931", "surface-header": "#1D2433" } });
    assert.equal(props["--color-secondary"], "#1D2433");
    assert.equal(props["--color-digitv2-header-sidenav"], "#1D2433");
  } finally { restore(); }
});

test("v2: `text-disabled` collapses both `grey.disabled` and `digitv2.text-color-disabled`", () => {
  const { props, restore } = stubDocument();
  try {
    const applyTheme = freshApply();
    applyTheme({ version: "2", colors: { brand: "#FEC931", "text-disabled": "#B1B4B6" } });
    assert.equal(props["--color-grey-disabled"], "#B1B4B6");
    assert.equal(props["--color-digitv2-text-color-disabled"], "#B1B4B6");
  } finally { restore(); }
});

test("v2: `border` collapses both border and input-border", () => {
  const { props, restore } = stubDocument();
  try {
    const applyTheme = freshApply();
    applyTheme({ version: "2", colors: { brand: "#FEC931", border: "#D6D5D4" } });
    assert.equal(props["--color-border"], "#D6D5D4");
    assert.equal(props["--color-input-border"], "#D6D5D4");
  } finally { restore(); }
});

test("v2: `error` writes both --color-error and --color-error-dark (semantics collapse)", () => {
  const { props, restore } = stubDocument();
  try {
    const applyTheme = freshApply();
    applyTheme({ version: "2", colors: { brand: "#FEC931", error: "#E02D3A" } });
    assert.equal(props["--color-error"], "#E02D3A");
    assert.equal(props["--color-error-dark"], "#E02D3A");
  } finally { restore(); }
});

test("v2: `chart-palette` array fans out to chart-1..5", () => {
  const { props, restore } = stubDocument();
  try {
    const applyTheme = freshApply();
    applyTheme({
      version: "2",
      colors: {
        brand: "#FEC931",
        "chart-palette": ["#204F37", "#FEC931", "#2A5084", "#E02D3C", "#128F21"],
      },
    });
    assert.equal(props["--color-digitv2-chart-1"], "#204F37");
    assert.equal(props["--color-digitv2-chart-2"], "#FEC931");
    assert.equal(props["--color-digitv2-chart-3"], "#2A5084");
    assert.equal(props["--color-digitv2-chart-4"], "#E02D3C");
    assert.equal(props["--color-digitv2-chart-5"], "#128F21");
  } finally { restore(); }
});

test("v1 record (no `brand` key): legacy flatten only, no semantic expansion side-effects", () => {
  // The kenya-green MDMS record currently sets `colors.error` (v1 single key)
  // without setting `colors.brand`. Without the v2 opt-in gate, this would be
  // re-interpreted as v2 `error` and overwrite `--color-error-dark`. We want
  // legacy records to behave EXACTLY as before — no surprise side effects.
  const { props, restore } = stubDocument();
  try {
    const applyTheme = freshApply();
    applyTheme({
      version: "1",
      colors: { error: "#E02D3A", primary: { main: "#FEC931" } },
    });
    assert.equal(props["--color-error"], "#E02D3A");
    assert.equal(props["--color-primary-main"], "#FEC931");
    // Crucially: error-dark is NOT touched (no v2 opt-in).
    assert.equal(props["--color-error-dark"], undefined);
    // brand/brand-on/etc. CSS vars also not written (no expansion).
    assert.equal(props["--color-primary-dark"], undefined);
    assert.equal(props["--color-primary-accent"], undefined);
  } finally { restore(); }
});

test("v2 wins on overlap with v1: same record can carry both shapes", () => {
  const { props, restore } = stubDocument();
  try {
    const applyTheme = freshApply();
    applyTheme({
      version: "2",
      colors: {
        // v1-shaped fallback for backwards compat:
        primary: { main: "#000000" },
        // v2 wins:
        brand: "#FEC931",
      },
    });
    // Pass 1 wrote --color-primary-main = #000000, then Pass 2 overwrote
    // with the v2 brand value. v2 always wins on overlap.
    assert.equal(props["--color-primary-main"], "#FEC931");
  } finally { restore(); }
});
