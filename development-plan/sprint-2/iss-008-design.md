# Technical Design

- **ID:** `iss-008`
- **Date:** Nov 18, 2026
- **Title:** Add a restrained visual focal point to AI Vibe Scan
- **Branch:** `feat/iss-008-vibe-scan-visual-focus`

> Implementation plan: [./iss-008-plan.md](iss-008-plan.md)

## 1) Overview

### Context

The AI Vibe Scan tab already fits the dashboard's Option 6 visual direction, but its upload and empty-result states feel visually quiet. The main action lacks a clear focal point.

### Proposed

Keep the existing paper, ink, blue, and acid palette and the two-column scan layout. Strengthen only the image-upload panel and empty-result state: add a compact step label, a single acid-accent camera tile, clearer upload action, and a short visual-to-sound message. Use thin framing, restrained geometric rings, and existing type styles to create hierarchy without adding decorative clutter.

Uploaded-photo, analyzing, error, and result behavior remain intact. No new interaction, dependency, endpoint, or data change is needed.

### Goals

- Make the image upload the clear first action.
- Give the idle results panel a deliberate, branded visual state.
- Preserve the Option 6 theme and keep the interface calm, readable, and responsive.
- Retain all current scan behavior and accessibility semantics.

### Non-Goals

- Redesigning other dashboard tabs or the overall dashboard shell.
- Changing upload validation, scan progress, API behavior, or song results.
- Adding drag-and-drop, new assets, animation, or new dependencies.

## 2) Requirements and Constraints

- Keep existing file input, button activation, accessible label, and result live region.
- Use existing dashboard CSS tokens and module; avoid global style changes.
- Keep decoration behind content and preserve keyboard focus indicators.
- Ensure the layout continues stacking on narrow screens and works with reduced motion.

## 3) Architecture and Components

- `saas-platform/src/app/home/components/vibe-scan-tab.tsx` — refine upload and idle-state hierarchy; preserve loading, error, and results branches.
- `saas-platform/src/app/home/dashboard.module.css` — add scoped panel, label, icon, and decorative-ring styles using existing theme tokens.

## 4) Data, APIs, and Security

No data model, API, or security changes.

## 5) Risks and Rollback

The photo preview can reduce text contrast. Keep upload instructions within the existing panel treatment and review both empty and selected-image states. Roll back by reverting the two scoped frontend changes; no data cleanup is required.

## 6) References

- `saas-platform/src/app/home/components/vibe-scan-tab.tsx` — current tab state and UI.
- `saas-platform/src/app/home/dashboard.module.css` — current Option 6 dashboard palette and layout.
- `development-plan/sprint-2/iss-007-design.md` — current sprint design document format.
