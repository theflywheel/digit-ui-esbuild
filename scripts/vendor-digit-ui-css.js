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
  { hex: "c84c0e", varName: "--color-primary-main", fallback: "#c84c0e" },
  { hex: "f18f5e", varName: "--color-primary-light", fallback: "#F18F5E" },
  { hex: "c8602b", varName: "--color-primary-dark", fallback: "#C8602B" },
  { hex: "feefe7", varName: "--color-digitv2-primary-bg", fallback: "#FEEFE7" },
];

const ROOT_BLOCK = `:root {
  --color-primary-light: #F18F5E;
  --color-primary-main: #c84c0e;
  --color-primary-dark: #C8602B;
  --color-digitv2-primary-bg: #FEEFE7;
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
