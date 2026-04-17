// scripts/lib/transform-css.test.js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { transformCss } = require("./transform-css");

const TOKENS = [
  { hex: "c84c0e", varName: "--color-primary-main", fallback: "#c84c0e" },
  { hex: "f18f5e", varName: "--color-primary-light", fallback: "#F18F5E" },
];

test("replaces hex literals with var() references", () => {
  const src = ".a { color: #c84c0e; } .b { color: #F18F5E; }";
  const { css } = transformCss(src, TOKENS, "");
  assert.match(css, /color: var\(--color-primary-main, #c84c0e\)/);
  assert.match(css, /color: var\(--color-primary-light, #F18F5E\)/);
});

test("is case-insensitive on the hex match", () => {
  const { counts } = transformCss("#C84C0E #c84c0e", TOKENS, "");
  assert.equal(counts["--color-primary-main"], 2);
});

test("does not match longer hex colors (#c84c0ea0 stays as-is)", () => {
  const src = ".x { color: #c84c0ea0; } .y { color: #c84c0e; }";
  const { css, counts } = transformCss(src, TOKENS, "");
  assert.equal(counts["--color-primary-main"], 1);
  assert.match(css, /color: #c84c0ea0/);
  assert.match(css, /color: var\(--color-primary-main, #c84c0e\)/);
});

test("prepends the root block verbatim", () => {
  const root = ":root { --color-primary-main: #c84c0e; }\n";
  const { css } = transformCss(".a {}", TOKENS, root);
  assert.ok(css.startsWith(root));
});

test("returns zero count for tokens whose hex does not appear", () => {
  const src = ".a { color: blue; }";
  const { counts } = transformCss(src, TOKENS, "");
  assert.equal(counts["--color-primary-main"], 0);
  assert.equal(counts["--color-primary-light"], 0);
});
