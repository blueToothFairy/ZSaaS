# Technical Design

- **ID:** `iss-001`
- **Date:** Nov 4, 2026
- **Title:** Reposition VibeTune as an AI Soundtrack Finder
- **Branch:** `docs/iss-001-product-repositioning`

> Implementation plan: [./iss-001-plan.md](iss-001-plan.md)

## 1) Overview

### Context

VibeTune is currently described as a music discovery app that recommends playlists based on mood, weather, and images. This explains what the technology does, but not why users need the product. A list of songs alone is not a strong reason to use VibeTune instead of an existing music platform.

### Problem

The product focuses on generating playlists rather than helping users complete a specific task. Its target audience and main value are also unclear.

### Proposed Direction

Position VibeTune as an **AI Soundtrack Finder for content creators**.

VibeTune helps creators find music that fits a specific photo, video, or creative project — both the content itself and the feeling they want to communicate.

The product should help users answer:

> Which soundtrack would make this content feel the way I want?

The initial target audience is independent content creators, especially people creating travel and lifestyle content for short-form platforms.

### Core User Flow

1. Create a project and add an image or other content reference.
2. Choose the intended mood, music style, energy, and vocal preference.
3. Let VibeTune analyze the visual content and combine it with the user's intent.
4. Receive a short list of suitable tracks, with a clear reason for each suggestion.
5. Refine the results, select a track, and save it to the project.

### Product Principles

- **Solve a specific task:** Help users choose a soundtrack for their content, not generate playlists for their own sake.
- **Combine visual context with user intent:** The same image can require different music depending on the creator's goal. User choices must not be overridden by AI assumptions.
- **Recommend with reasons:** Explain recommendations using available content and music features.
- **Make refinement easy:** Users should be able to adjust mood, energy, genre, or vocals without starting over.
- **Keep claims honest:** Clearly separate existing functionality from planned capabilities.

## 2) Scope

### In Scope

- Update product positioning and descriptions in relevant Markdown documentation.
- Describe content creators as the initial target audience.
- Describe the Image-to-Soundtrack workflow and its expected user value.
- Present mood and weather as supporting context, not the product's main purpose.
- Align feature descriptions with the current implementation.

### Out of Scope

- User interviews, surveys, market research, or product validation activities.
- Frontend, backend, AI service, recommendation, or database changes.
- New APIs, music providers, models, or integrations.
- Implementing video analysis, beat matching, personalization, or licensed music catalog features.

## 3) Documentation Guidance

The updated product story should lead with the user problem and outcome. CLIP, weather data, and music search are supporting technologies, not the value proposition.

Use this as the working product description:

> **VibeTune helps content creators find the right soundtrack for their content.** It combines visual understanding with the creator's musical intent to recommend relevant tracks and explain why they fit.

Treat this as the intended product direction, not a claim that every part is already implemented. Keep existing technical documentation accurate and label future capabilities as planned.

## 4) Constraints

- Documentation-only change. Modify Markdown files only.
- Inspect the repository before deciding which documents need updates.
- Do not invent implemented features, integrations, data sources, or capabilities.
- Avoid broad rewrites of technical documentation that is unrelated to product positioning.
