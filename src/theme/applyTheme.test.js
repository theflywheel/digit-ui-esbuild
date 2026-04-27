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

test("Nairobi tokens: bundled default.json validates and emits the new vars", () => {
  // Phase 1 of the Nairobi overhaul adds shell-tint, cta-tint,
  // disabled-content, tertiary-border, muted-bg, and tag-status.* to
  // the bundled default theme. Guards against schema regressions and
  // ensures the flatten() pipeline keeps emitting them.
  const { props, restore } = stubDocument();
  try {
    const applyTheme = freshApply();
    applyTheme(require("./default.json"));
    assert.equal(props["--color-shell-tint"], "#E8F3EE");
    assert.equal(props["--color-cta-tint"], "#FEC93133");
    assert.equal(props["--color-card-bg"], "#FFF4D6");
    assert.equal(props["--color-disabled-content"], "#BDCAC3");
    assert.equal(props["--color-tertiary-border"], "#EDEDED");
    assert.equal(props["--color-muted-bg"], "#F3F4F6");
    assert.equal(props["--color-tag-status-warning-bg"], "#FEF3C7");
    assert.equal(props["--color-tag-status-warning-border"], "#FAE29F");
    assert.equal(props["--color-tag-status-warning-label"], "#92400E");
    assert.equal(props["--color-tag-status-info-bg"], "#F3E8FF");
    assert.equal(props["--color-tag-status-info-label"], "#6B21A8");
    assert.equal(props["--color-tag-status-success-bg"], "#DCFCE7");
    assert.equal(props["--color-tag-status-success-label"], "#166534");
    // Legacy DIGIT defaults must still flow through unchanged.
    assert.equal(props["--color-primary-main"], "#c84c0e");
    assert.equal(props["--color-digitv2-header-sidenav"], "#0B4B66");
  } finally { restore(); }
});

test("8-digit hex with alpha (e.g. #FEC93133): accepted by schema, emitted as-is", () => {
  // Pattern was relaxed to allow 8-digit hex so we can express
  // semitransparent tints (cta-tint = yellow at 20% alpha = #FEC93133)
  // without dragging rgba() into the schema.
  const { props, restore } = stubDocument();
  try {
    const applyTheme = freshApply();
    applyTheme({
      version: "1",
      colors: { "cta-tint": "#FEC93133" },
    });
    assert.equal(props["--color-cta-tint"], "#FEC93133");
  } finally { restore(); }
});
