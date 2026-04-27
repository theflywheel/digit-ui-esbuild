# Nairobi Citizen Theme — Tokens (exec summary)

Parsed 3,411 frame blocks from `themes/01_nairobi.css`: 33 colours, 31 typography permutations, 10 radii, 26 spacings, 4 shadows, 6 icon sizes.

## Top 5 surprises

1. **Forest green dominates, not yellow.** `#204F37` (196 hits) outscores CTA yellow `#FEC931` (85). The brand reads green-first; yellow is the accent.
2. **CTA yellow has a 20%-alpha companion.** `#FEC931@0.20` (26 hits) is a real selected-state wash, not an accident — promote to `surface.cta-tint`.
3. **Three body-text greys, none of them DIGIT's `#0B0C0C`.** `#191C1D` (body, 28), `#787878` (helper, 60), `#363636` (form labels, 12). DIGIT's text-primary only appears 7x, in a legacy style block.
4. **Inter, not Roboto.** 216 Inter hits vs 29 stale Roboto vs 7 SF Pro Text. The Roboto blocks are unreskinned DIGIT defaults; sizes/weights match Inter exactly.
5. **Pale forest tint is a token.** `#E8F3EE` (25 hits) backs `Back`/secondary CTAs. DIGIT has no equivalent — secondaries default to neutral grey, killing Nairobi's two-tone look.

## Top 5 destructive renames

1. **`primary.main` → `brand.cta` rebind to `#FEC931`.** Delete `#C84C0E` from palette.
2. **`header-sidenav` / `primary[2]` → `brand.forest` (`#204F37`).** `#0B4B66` teal must die.
3. **Swap Roboto for Inter** in `@font-face`, Tailwind `fontFamily.sans`, SCSS `$body-font`. Sizes already match.
4. **Default radius `4px` → `8px`; add `12px` card variant.** Reserve `4px` for inputs/tags.
5. **Add `surface.brand-tint` (`#E8F3EE`) and `surface.cta-tint`; delete Material elevation cascade.** Cards use one flat shadow `0 1px 2px rgba(0,0,0,0.16)`; buttons `0 2px 7px rgba(0,0,0,0.15)`.
