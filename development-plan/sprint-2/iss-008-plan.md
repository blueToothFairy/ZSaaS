# Implementation Plan

- **ID:** `iss-008`
- **Date:** Nov 18, 2026
- **Title:** Add a restrained visual focal point to AI Vibe Scan
- **Design:** [./iss-008-design.md](iss-008-design.md)
- **Scope:** Refine the Vibe Scan upload and idle-result presentation within the current Option 6 dashboard style.

## 1) Objective

Make the first step of Vibe Scan easier to notice and give its idle state a clear visual identity, without changing scan behavior or adding visual noise.

## 2) Tasks

### Task 1 — Refine the Upload Panel

- [x] Add a small input-step label and a clear, compact upload action.
- [x] Use one acid-accent camera tile as the panel's focal point.
- [x] Add restrained framing and geometric detail using existing dashboard colors.
- [x] Preserve the selected-image preview and its change-photo action.

**Expected result:** The upload panel reads as the obvious first step and remains visually consistent with Option 6.

### Task 2 — Strengthen the Idle Results State

- [x] Replace the generic empty message with a concise visual-to-sound message.
- [x] Add one small branded mark and understated supporting geometry.
- [x] Keep the idle state distinct from loading, error, and populated results.

**Expected result:** The results panel feels intentional before a scan, while directing attention back to image selection.

### Task 3 — Responsive and Accessibility Review

- [x] Keep the existing responsive column-to-stack behavior.
- [x] Confirm text and controls remain legible over a selected photo through a darkened image treatment.
- [x] Preserve accessible button naming, live announcements, and keyboard focus.
- [ ] Check narrow and wide dashboard layouts in a browser.
- [x] Respect the existing reduced-motion preference; the update adds no animation.

**Expected result:** The visual update remains usable across viewport sizes and input methods.

## 3) Acceptance Criteria

- The upload action is the strongest focal point in the idle Vibe Scan view.
- Decoration is limited to a few purposeful accents and does not compete with text.
- Selected-photo, analyzing, error, and result states retain their current behavior.
- The two-column layout still stacks on small screens.
- No API, data, dependency, or unrelated dashboard changes are introduced.

## 4) Out of Scope

- Drag-and-drop support, scan-flow changes, or new visual assets.
- Styling changes to other dashboard tabs.
