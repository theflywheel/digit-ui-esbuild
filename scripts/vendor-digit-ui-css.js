// POC: fetch the published @egovernments/digit-ui-css from unpkg, substitute
// themeable color hex values with var(--color-*, fallback), prepend :root
// defaults, write public/vendor/digit-ui-css.css. The esbuild dev server
// serves that file at /digit-ui/vendor/digit-ui-css.css, and public/index.html
// loads it in place of the CDN URL.
//
// Rerun after bumping the upstream version below.
//
//   node scripts/vendor-digit-ui-css.js

const fs = require("fs");
const path = require("path");
const https = require("https");
const { transformCss } = require("./lib/transform-css");

const UPSTREAM_VERSION = "1.8.37";
const UPSTREAM_URL = `https://unpkg.com/@egovernments/digit-ui-css@${UPSTREAM_VERSION}/dist/index.css`;
const VENDOR_DIR = path.resolve(__dirname, "..", "public", "vendor");
const ORIGINAL = path.join(VENDOR_DIR, "digit-ui-css.original.css");
const OUTPUT = path.join(VENDOR_DIR, "digit-ui-css.css");

// Tokens to expose as CSS custom properties. Hex values are lowercase so the
// regex can be case-insensitive without worrying about both cases. Fallback is
// the original upstream value so selectors that somehow bypass the var
// indirection still render close to the shipped palette.
const TOKENS = [
  // primary palette
  { hex: "c84c0e", varName: "--color-primary-main", fallback: "#c84c0e" },
  { hex: "f18f5e", varName: "--color-primary-light", fallback: "#F18F5E" },
  { hex: "c8602b", varName: "--color-primary-dark", fallback: "#C8602B" },
  // secondary
  { hex: "22394d", varName: "--color-secondary", fallback: "#22394D" },
  // text
  { hex: "0b0c0c", varName: "--color-text-primary", fallback: "#0B0C0C" },
  { hex: "505a5f", varName: "--color-text-secondary", fallback: "#505A5F" },
  // link
  { hex: "1d70b8", varName: "--color-link-normal", fallback: "#1D70B8" },
  { hex: "003078", varName: "--color-link-hover", fallback: "#003078" },
  // borders
  { hex: "d6d5d4", varName: "--color-border", fallback: "#D6D5D4" },
  { hex: "464646", varName: "--color-input-border", fallback: "#464646" },
  // status
  { hex: "d4351c", varName: "--color-error", fallback: "#D4351C" },
  { hex: "00703c", varName: "--color-success", fallback: "#00703C" },
  // grey scale
  { hex: "9e9e9e", varName: "--color-grey-dark", fallback: "#9E9E9E" },
  { hex: "eeeeee", varName: "--color-grey-mid", fallback: "#EEEEEE" },
  { hex: "fafafa", varName: "--color-grey-light", fallback: "#FAFAFA" },
  { hex: "e3e3e3", varName: "--color-grey-bg", fallback: "#E3E3E3" },
  // digitv2.lightTheme
  { hex: "b1b4b6", varName: "--color-digitv2-text-color-disabled", fallback: "#B1B4B6" },
  { hex: "0b4b66", varName: "--color-digitv2-header-sidenav", fallback: "#0B4B66" },
  { hex: "feefe7", varName: "--color-digitv2-primary-bg", fallback: "#FEEFE7" },
  // digitv2.alert (error & success already mapped above)
  { hex: "efc7c1", varName: "--color-digitv2-alert-error-bg", fallback: "#EFC7C1" },
  { hex: "bad6c9", varName: "--color-digitv2-alert-success-bg", fallback: "#BAD6C9" },
  { hex: "3498db", varName: "--color-digitv2-alert-info", fallback: "#3498DB" },
  { hex: "c7e0f1", varName: "--color-digitv2-alert-info-bg", fallback: "#C7E0F1" },
  // digitv2.chart
  { hex: "048bd0", varName: "--color-digitv2-chart-1", fallback: "#048BD0" },
  { hex: "fbc02d", varName: "--color-digitv2-chart-2", fallback: "#FBC02D" },
  { hex: "8e29bf", varName: "--color-digitv2-chart-3", fallback: "#8E29BF" },
  { hex: "ea8a3b", varName: "--color-digitv2-chart-4", fallback: "#EA8A3B" },
  { hex: "0babde", varName: "--color-digitv2-chart-5", fallback: "#0BABDE" },
];

const ROOT_BLOCK = `:root {
  /* primary */
  --color-primary-light: #F18F5E;
  --color-primary-main: #c84c0e;
  --color-primary-dark: #C8602B;
  /* secondary */
  --color-secondary: #22394D;
  /* text */
  --color-text-primary: #0B0C0C;
  --color-text-secondary: #505A5F;
  /* link */
  --color-link-normal: #1D70B8;
  --color-link-hover: #003078;
  /* borders */
  --color-border: #D6D5D4;
  --color-input-border: #464646;
  /* status */
  --color-error: #D4351C;
  --color-success: #00703C;
  /* grey */
  --color-grey-dark: #9E9E9E;
  --color-grey-mid: #EEEEEE;
  --color-grey-light: #FAFAFA;
  --color-grey-bg: #E3E3E3;
  /* digitv2.lightTheme */
  --color-digitv2-text-color-disabled: #B1B4B6;
  --color-digitv2-header-sidenav: #0B4B66;
  --color-digitv2-primary-bg: #FEEFE7;
  /* digitv2.alert */
  --color-digitv2-alert-error-bg: #EFC7C1;
  --color-digitv2-alert-success-bg: #BAD6C9;
  --color-digitv2-alert-info: #3498DB;
  --color-digitv2-alert-info-bg: #C7E0F1;
  /* digitv2.chart */
  --color-digitv2-chart-1: #048BD0;
  --color-digitv2-chart-2: #FBC02D;
  --color-digitv2-chart-3: #8E29BF;
  --color-digitv2-chart-4: #EA8A3B;
  --color-digitv2-chart-5: #0BABDE;
}
`;

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          resolve(fetchText(res.headers.location));
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve(body));
      })
      .on("error", reject);
  });
}

async function main() {
  fs.mkdirSync(VENDOR_DIR, { recursive: true });

  console.log(`fetching ${UPSTREAM_URL}`);
  const original = await fetchText(UPSTREAM_URL);
  fs.writeFileSync(ORIGINAL, original);

  const { css, counts } = transformCss(original, TOKENS, ROOT_BLOCK);
  for (const [name, n] of Object.entries(counts)) {
    console.log(`  ${name}: ${n} replacements`);
  }
  fs.writeFileSync(OUTPUT, css);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`wrote ${OUTPUT} (${total} total replacements)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
