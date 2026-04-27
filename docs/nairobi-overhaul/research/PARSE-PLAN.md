# Nairobi PGR Citizen Theme — Parse Plan

## Goal

Capture the **complete visual & component spec** for the Nairobi citizen-facing PGR experience from Figma `sH2pLZBXZZ6c7LlfQwFFjR` ("Design System Drafts"), in enough detail that we can **destructively replicate** in `digit-ui-esbuild` — overhauling color mapping, renaming components, and deleting any DIGIT default that conflicts. Employee flow extrapolates from this; do not analyze it.

## Source pages (Figma node IDs)

Primary:
- `80555:2039` — **Nairobi City County** (the Nairobi-specific surfaces)
- `83791:18171` — **PGR (Theme)** (PGR-tuned design tokens)
- `76045:16791` — **Praja - Citizen Engagement** (general citizen patterns we may inherit)

Token / atom references (use these to resolve `paintStyle` / `textStyle` IDs to names):
- `72546:14565` — Colors
- `72446:31347` — Typography
- `72546:14637` — Icons
- `78565:34161` — Radius
- `9819:23405` — Atoms / Molecules
- `72783:5397` — Organisms

## Output schema (one JSON file per stream — `findings/<stream>.json`)

```jsonc
{
  "metadata": {
    "stream": "claude" | "codex" | "gemini",
    "figmaFileKey": "sH2pLZBXZZ6c7LlfQwFFjR",
    "extractedAt": "<ISO timestamp>",
    "sourcePages": ["80555:2039", "83791:18171", "76045:16791"]
  },

  "tokens": {
    "color": [
      {
        "name": "primary/yellow",         // Figma style name OR derived role
        "hex": "#FEC931",
        "alpha": 1,
        "role": "primary-cta",            // best-guess semantic role
        "usedOn": ["Button/Primary bg", "Tag/Active bg", ...],   // node names
        "frequency": 66                    // how many fills reference it
      }
    ],
    "typography": [
      {
        "name": "Heading/H1",
        "fontFamily": "Roboto",
        "fontWeight": 700,
        "fontSize": 32,
        "lineHeight": 40,
        "letterSpacing": 0,
        "usedOn": ["Header", "Page Title"]
      }
    ],
    "radius": [{ "name": "rounded-md", "value": 8, "usedOn": [...] }],
    "spacing": [{ "name": "space-md", "value": 16, "usedOn": [...] }],
    "shadow":  [{ "name": "card",      "value": "0 1px 2px ...", "usedOn": [...] }],
    "icon":    [{ "name": "bell",      "size": 24, "fill": "#FEC931", "usedOn": [...] }]
  },

  "components": [
    {
      "name": "Button / Primary",
      "category": "atom",                 // atom | molecule | organism | page
      "shape": {
        "width": "auto" | "<px>",
        "height": 48,
        "padding": "12px 24px",
        "borderRadius": 8,
        "border": "none" | "1px solid #..."
      },
      "states": {
        "default":  { "bg": "#FEC931", "text": "#000000", "border": "none", "shadow": null },
        "hover":    { "bg": "#E5B428", ... },
        "pressed":  { ... },
        "focus":    { "outline": "2px solid #...", ... },
        "disabled": { ... },
        "loading":  { ... }
      },
      "iconSlot": { "position": "left" | "right" | "none", "size": 16, "color": "#000" },
      "label": { "textStyle": "Body/Medium", "transform": "none" | "uppercase" },
      "variants": ["small", "medium", "large"],
      "figmaNodeId": "1234:5678",
      "notes": "anything weird, like asymmetric padding or a non-token color"
    }
  ],

  "patterns": [
    {
      "name": "Complaint Card",
      "category": "molecule",
      "structure": "header (status pill + ID) / body (description + meta) / footer (timestamp, action)",
      "tokensUsed": ["primary/yellow", "border/light"],
      "figmaNodeId": "...",
      "screenshotUrl": "<v1/images endpoint url, optional>"
    }
  ],

  "screens": [
    {
      "name": "Citizen / Home",
      "figmaNodeId": "...",
      "components": ["TopBar", "Banner", "ServiceTile x6", "Footer"],
      "notes": "..."
    }
  ],

  "divergencesFromDigitUiDefault": [
    {
      "what": "primary.main",
      "digitUiDefault": "#C84C0E",
      "figmaIntent": "#FEC931",
      "consequence": "every Tailwind bg-primary-main / focus / Colors.lightTheme.primary[1] consumer is wrong"
    }
  ],

  "recommendations": {
    "destructiveReplaces": [
      "Delete X, replace with Y because Figma diverges by Z"
    ],
    "renamingProposals": [
      { "from": "primary.main", "to": "brand.cta" }
    ],
    "newComponentsNeeded": ["..."],
    "componentsToRemove": ["..."]
  }
}
```

## Method

For each stream:

1. Pull each source page via `GET /v1/files/sH2pLZBXZZ6c7LlfQwFFjR/nodes?ids=<id>&depth=4`. Walk recursively. Pages are large — paginate by depth or by individual frame children if needed.
2. Dereference style IDs via `GET /v1/files/.../styles` for color/text style names.
3. For every frame whose name implies a component (Button, Card, Input, Tag, Tab, Header, etc.), capture: dimensions, fills, strokes, effects, cornerRadius, padding, child structure. If the node has a Figma `componentSetId`, fetch the variants too (this is where hover/disabled live).
4. For interactive states, look for variant properties on a `COMPONENT_SET`: `state=default|hover|pressed|focus|disabled`, `size=sm|md|lg`, `variant=primary|secondary|tertiary`. Capture every combination.
5. For each color/text style usage, accumulate frequency so we can detect intent vs. accident.
6. Produce screenshots for top-level frames via `GET /v1/images?ids=<id>&format=png&scale=1` — store URL only (valid ~7 days).
7. Output the JSON above to `findings/<stream>.json`. Also write a 200-word executive summary to `findings/<stream>.md` highlighting the 5 biggest divergences from current `digit-ui-esbuild`.

## Token handling

- The Figma PAT is provided in the agent's prompt env (`FIGMA_TOKEN`). Never write it to disk, log it, commit it, or echo it in output. After this run we'll rotate.
- Output JSON must not include the token — it's request auth, not content.

## Synthesis (after all three streams finish)

I (the orchestrator) will:
- Diff the three JSONs to surface contradictions and consensus.
- Cross-reference each component against `digit-ui-esbuild`'s current implementation (Tailwind config, SCSS, JS Colors, `LandingPageCard`, etc.).
- Produce `OVERHAUL-PLAN.md`: a destructive replication plan listing every file to delete, rename, or rewrite.
