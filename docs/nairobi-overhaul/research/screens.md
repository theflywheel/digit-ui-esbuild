# Executive Summary — Nairobi Citizen Screens

The Nairobi Citizen theme introduces a significant departure from the default DIGIT UI layout, favoring a high-contrast, card-driven vertical architecture. The primary focus is on a streamlined 6-step complaint filing wizard and a modernized dashboard.

## Key Page-Level Recommendations

1. **Abolish Landing Tiles**: Current `digit-ui` implementations rely on small grid-based service tiles. The Nairobi theme (`Android - 106`) replaces these with high-impact, full-width **Service Cards** (e.g., Quick Pay, Complaints) featuring #FFF4D6 backgrounds and integrated illustrations. This requires a destructive replacement of the `LandingPage` component.
2. **Standardize 6-Step Filing Flow**: The complaint filing process is strictly delineated into six distinct screens: Type Selection, Sub-type Selection, Map Pinning, Address/Pincode, Photo Upload, and Narrative Details. Default DIGIT workflows with fewer steps or combined forms must be restructured to maintain this design intent.
3. **Restructure Navigation Shell**: The navigation shell must be overhauled to incorporate the Nairobi branding (Background: #204F37) and the secondary `NairobiStepNavigation` bar (#E8F3EE) for back-actions and step-context, which is ubiquitous across all filing screens.
4. **Destructive Success Component Update**: The default DIGIT success message is insufficient. Replicate the **NairobiSuccessPanel** (#2E7D32) seen in `Android - 111`, which centers the confirmation in a high-visibility green panel.
5. **Route Renaming for Intent**: Rename `LandingPage` to `CitizenDashboard` and `PGRFiling` to `NairobiComplaintFlow` to better reflect the specialized, linear nature of the Nairobi implementation.
