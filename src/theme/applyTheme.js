// Theme loader. Validates a config against schema.json, then writes CSS custom
// properties on document.documentElement so MDMS-driven per-tenant themes
// cascade through every var(--color-*) reference in the vendored CSS.
//
// Two input shapes are supported:
//
//   v1 (legacy, used by existing kenya-green MDMS record): nested groups,
//   e.g. `{ colors: { primary: { main, dark, ... }, text: { ... }, ... } }`.
//   Each leaf is flattened to `--color-<path-joined-by-dashes>`.
//
//   v2 (semantic, target shape for trimmed configurator form): flat keys with
//   semantic names — e.g. `{ colors: { brand, "brand-on", "surface-header",
//   ... } }`. Each key expands to *one or more* CSS variables that the existing
//   CSS already consumes. v2 lets a tenant be themed with ~12 inputs instead
//   of 35+. See SEMANTIC_EXPANSION below for the mapping.
//
// Both shapes can co-exist in the same record (useful during migration); v2
// keys are applied last and win on overlap.

const Ajv = require("ajv");
const schema = require("./schema.json");

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

// v2 semantic token → list of CSS variables to write.
// Where two CSS vars have the same role (e.g. both "disabled" greys, or
// border + input-border), they collapse onto one input. The expansion is
// chosen so the live UI looks Figma-faithful with as few inputs as possible.
const SEMANTIC_EXPANSION = {
  brand: ["--color-primary-main"],
  "brand-on": [
    "--color-primary-dark",
    "--color-primary-accent",
    "--color-link-normal",
    "--color-link-hover",
    "--color-text-heading",
  ],
  "surface-header": [
    "--color-secondary",
    "--color-digitv2-header-sidenav",
  ],
  "surface-page": ["--color-grey-light"],
  "text-primary": ["--color-text-primary"],
  "text-secondary": ["--color-text-secondary", "--color-text-muted"],
  "text-disabled": [
    "--color-grey-disabled",
    "--color-digitv2-text-color-disabled",
  ],
  border: ["--color-border", "--color-input-border"],
  error: ["--color-error", "--color-error-dark"],
  success: ["--color-success"],
  info: ["--color-digitv2-alert-info", "--color-info-dark"],
  warning: ["--color-warning-dark"],
  "selected-bg": [
    "--color-primary-selected-bg",
    "--color-digitv2-primary-bg",
  ],
};

function flatten(obj, prefix, out) {
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const next = prefix ? `${prefix}-${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      flatten(value, next, out);
    } else if (typeof value === "string") {
      out[`--color-${next}`] = value;
    }
  }
}

function applyTheme(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    console.warn("[theme] config must be an object, skipping apply");
    return;
  }
  if (!validate(config)) {
    console.warn("[theme] invalid config, skipping apply", validate.errors);
    return;
  }
  if (!config.colors) return;

  const root = document.documentElement;
  const vars = {};

  // Pass 1: legacy flatten — every nested or top-level string under `colors`
  // becomes its own --color-* variable. Flat semantic keys (brand, brand-on…)
  // would write `--color-brand` / `--color-brand-on` / etc. here, which the
  // CSS doesn't consume but is harmless.
  flatten(config.colors, "", vars);

  // Pass 2: semantic expansion — only opt-in. Triggered by the presence of
  // `colors.brand` (a v2 marker no legacy record has). When active, every
  // semantic key fans out to all CSS vars that role really controls,
  // overriding whatever Pass 1 wrote. Legacy v1 records (which don't set
  // `brand`) skip this pass entirely so their behavior is preserved bit-for-bit.
  const v2Active = typeof config.colors.brand === "string";
  if (v2Active) {
    for (const [token, cssVars] of Object.entries(SEMANTIC_EXPANSION)) {
      const value = config.colors[token];
      if (typeof value === "string") {
        for (const name of cssVars) vars[name] = value;
      }
    }
    // Chart palette as a 5-element array (single input → 5 CSS vars).
    const palette = config.colors["chart-palette"];
    if (Array.isArray(palette)) {
      palette.slice(0, 5).forEach((hex, i) => {
        if (typeof hex === "string") vars[`--color-digitv2-chart-${i + 1}`] = hex;
      });
    }
  }

  for (const name of Object.keys(vars)) {
    root.style.setProperty(name, vars[name]);
  }
  console.log(`[theme] applied ${Object.keys(vars).length} variables`);
}

module.exports = { applyTheme };
