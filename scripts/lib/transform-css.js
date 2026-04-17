// scripts/lib/transform-css.js

// Pure CSS-variable substitution. Given upstream CSS source, a list of tokens
// (each mapping a hex literal to a CSS variable name + fallback), and a string
// to prepend, return the transformed CSS plus a per-token replacement count.
//
// Exported as a pure function so it can be unit-tested without network or fs.

function transformCss(source, tokens, rootBlock) {
  // Normalize 3-digit hex shorthands (e.g., #eee, #fff) to their 6-digit form
  // so a single regex per token suffices. Negative lookahead prevents matching
  // the middle of longer hex colors (e.g., the ea in #c84c0ea0).
  let out = source.replace(
    /#([0-9a-f])([0-9a-f])([0-9a-f])(?![0-9a-f])/gi,
    "#$1$1$2$2$3$3"
  );
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
