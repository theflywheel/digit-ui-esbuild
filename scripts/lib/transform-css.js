// scripts/lib/transform-css.js

// Pure CSS-variable substitution. Given upstream CSS source, a list of tokens
// (each mapping a hex literal to a CSS variable name + fallback), and a string
// to prepend, return the transformed CSS plus a per-token replacement count.
//
// Exported as a pure function so it can be unit-tested without network or fs.

function transformCss(source, tokens, rootBlock) {
  let out = source;
  const counts = {};
  for (const t of tokens) {
    // Negative lookahead avoids matching longer hex colors like #c84c0ea0.
    const re = new RegExp(`#${t.hex}(?![0-9a-f])`, "gi");
    let n = 0;
    out = out.replace(re, () => {
      n++;
      return `var(${t.varName}, ${t.fallback})`;
    });
    counts[t.varName] = n;
  }
  return { css: (rootBlock || "") + out, counts };
}

module.exports = { transformCss };
