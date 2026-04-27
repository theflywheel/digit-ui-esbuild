# Nairobi Employee Layout Audit

This audit identifies layout anti-patterns in the employee surfaces of `digit-ui-esbuild` to be resolved during the Nairobi overhaul.

## Top 10 Highest-Impact Layout Fixes

| Rank | File:Line | Pattern | Impact | Fix |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `index.scss:29` | **Z-index Soup** (`9999`) | Breaks modal/overlay stacking context across the SPA. | Move to a centralized z-index scale (e.g., 10-100). |
| 2 | `workbench.scss:934` | **Asymmetric Padding** | `45px 45px 20px 20px` creates unbalanced, non-standard card layouts. | Converge to standard Nairobi spacing (e.g., `24px` or `1.5rem`). |
| 3 | `inbox.scss:502` | **Useless Whitespace** | `margin-top: 55px !important` pushes content below the fold on smaller screens. | Remove hardcoded margins; use standard flex-gap or consistent spacing. |
| 4 | `workbench.scss:L147-L200` | **Deep Nesting** (8 levels) | Makes CSS maintenance impossible and causes specificity wars. | Flatten selectors; use BEM or utility classes for internal elements. |
| 5 | `index.scss:52` | **Float-based Layout** | `float: right` for topbar items is fragile and lacks alignment control. | Replace with `flex` and `justify-content: flex-end`. |
| 6 | `index.scss:56` | **Stale Theme Tokens** | `theme(colors.primary.main)` is baked in; doesn't support the new token system. | Replace with CSS variables like `var(--color-primary)`. |
| 7 | `inbox.scss:384` | **Hardcoded Widths** | `max-width: 300px !important` prevents fluid resizing on tablet viewports. | Use percentage-based widths or `max-width` with responsive breakpoints. |
| 8 | `sandbox.scss:268` | **Arbitrary Rem Values** | `margin-top: 8rem !important` is massive and likely a layout hack. | Re-evaluate the container height/alignment instead of "shoving" content. |
| 9 | `surveys.scss:115` | **Inconsistent Spacing** | `padding: 8px 8px 0px 8px` uses non-standard zero-bottom padding. | Use consistent padding from the Nairobi scale. |
| 10 | `RoleBasedEmployeeHome.js` | **Inline Layout Styles** | `style={{ padding: "0px" }}` on Buttons bypasses the theme. | Move layout concerns to components or use utility classes. |

## By-File Rollup

| File | Issues | Summary |
| :--- | :---: | :--- |
| `packages/css/src/pages/employee/index.scss` | 12 | Root employee layout with floats and extreme z-indices. |
| `packages/css/src/pages/employee/inbox.scss` | 28 | Heavy use of `!important` and hardcoded `px` dimensions for table/filter views. |
| `packages/css/src/pages/employee/sandbox.scss` | 45+ | Experimental styles with massive margins and fixed viewport heights. |
| `packages/css/src/digitv2/pages/employee/workbench.scss` | 35 | Extremely deep nesting (8+ levels) and asymmetric paddings. |
| `packages/css/src/pages/employee/dss.scss` | 15 | Hardcoded 25px/30px gaps and `!important` font sizes. |
| `packages/css/src/pages/employee/surveys.scss` | 10 | Non-standard negative margins and inconsistent padding-bottoms. |
| `packages/css/src/pages/employee/iframe.scss` | 5 | Arbitrary absolute positioning (`left: 64px`, `top: 80px`). |

## Anti-Pattern Catalog

### 1. Useless Whitespace
Large hardcoded margins that don't adapt to content or viewport.
- `index.scss:8`: `margin-bottom: 56px;`
- `inbox.scss:502`: `margin-top: 55px !important;`
- `sandbox.scss:268`: `margin-top: 8rem !important;`
- `dss.scss:138`: `margin-bottom: 30px;`

### 2. Inconsistent Spacing Scales
The employee surface uses a "scatter-plot" of spacing values instead of a scale.
- **Observed:** `7px`, `10px`, `11.5px`, `15px`, `25px`, `35px`, `46px`, `56px`, `88px`.
- **Target:** Converge to 6 core values (4, 8, 12, 16, 24, 32).

### 3. Asymmetric Padding
- `workbench.scss:934`: `padding: 45px 45px 20px 20px;`
- `surveys.scss:115`: `padding: 8px 8px 0px 8px;`
- `index.scss:13`: `padding: 0 0 16px 0;`

### 4. Hardcoded Widths
- `inbox.scss:446`: `width: 263px !important;`
- `inbox.scss:287`: `width: 874px;`
- `workbench.scss:771`: `width: 250px;`

### 5. Stale Tailwind Hex / Theme
- `index.scss:56`: `background: theme(colors.primary.main);`
- `dss.scss:110`: `border: 1px solid theme(colors.primary.main) !important;`
- `workbench.scss:4`: `color: theme(digitv2.lightTheme.primary);`

### 6. Float-based Layout
- `index.scss:52`: `float: right;`
- `workbench.scss:236`: `float: left;`

### 7. Z-Index Soup
- `index.scss:29`: `z-index: 9999;`
- `index.scss:118`: `z-index: 999;`
- `workbench.scss:470`: `z-index: 10000;`
- `sandbox.scss:427`: `z-index: 1000;`

### 8. Redundant !important
Every file audited uses `!important` to patch layout issues instead of solving specificity.
- Found 100+ instances in `packages/css/src/pages/employee/`.

### 9. Nested Deep Selectors
- `workbench.scss:170`: Nesting level 8 (`.workbench .workbench-create-form form #digit_root .field-wrapper .form-group.field &.field-error .card-label-error`).

## Wins from Converging on Nairobi Spacing

Standardizing on the Nairobi scale (suggested: `4px, 8px, 12px, 16px, 24px, 32px`) would simplify:
- **~250 call-sites** in employee SCSS that currently use arbitrary values like `10px`, `15px`, `25px`, or `56px`.
- Elimination of all `!important` declarations used for spacing overrides.
- Consistent alignment between Sidebar, Topbar, and Module Cards.

## Out of Scope, but Flagged
- **Dead Code:** `index.scss:1-2` and `inbox.scss:300` contain commented-out CSS that should be purged.
- **Accessibility:** Hardcoded `font-size: 0.8rem !important` in `sandbox.scss:312` might break user scaling preferences.
- **Performance:** Deeply nested selectors in `workbench.scss` increase browser paint times for large forms.
