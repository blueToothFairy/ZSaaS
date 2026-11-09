# Implementation Plan

- **ID:** `iss-002`
- **Date:** Nov 9, 2026
- **Title:** Build a Personalized Music Recommendation Engine
- **Branch:** `feat/iss-002-personalized-recommendations`
- **Design:** [./iss-002-design.md](iss-002-design.md)
- **Scope:** Backend recommendation and music preference APIs, persistence, preference setup and editing UI, integration with existing music search and Vibe Scan modules, and recommendation evaluation artifacts.

## 1) Objective

Build a personalized music recommendation engine that combines a user's explicit music taste with visual context and current content intent.

The system must:

- Require a qualifying music taste profile before returning personalized recommendations.
- Allow authenticated users to configure, edit, and remove their explicit music preferences.
- Reuse the existing CLIP, iTunes search, profile, authentication, database, and caching implementations.
- Retrieve candidates using context-based, taste-based, and hybrid search queries.
- Rank candidates using traceable taste, context, intent, and metadata signals.
- Diversify results without sacrificing recommendation relevance.
- Explain recommendations using only information and ranking signals actually available to the system.
- Compare the new recommendation engine with the existing image-keyword recommendation flow.

The initial implementation must use metadata-based recommendation only. No audio-analysis service or additional machine-learning ranking model is required.

## 2) Existing Architecture and Implementation Constraints

Implement this issue by extending the existing repository architecture rather than creating parallel modules.

### Backend

The existing backend uses Express 5, TypeScript, PostgreSQL, Knex, Clerk authentication, and a module-based structure with controllers, routes, services, repositories, DTOs, and interfaces.

Relevant existing modules include:

- `backend/src/modules/vibe-scan/`
- `backend/src/modules/song/`
- `backend/src/modules/profile/`

Follow the existing module conventions and service construction patterns. Do not introduce a new dependency injection framework.

### Existing Recommendation Flow

The current Vibe Scan implementation extracts visual keywords using CLIP and passes selected keywords to the existing song search implementation.

The current implementation observed on `main` uses the Vibe Scanner service and `SongSearch.searchByKeywords(...)` to retrieve tracks.

Record the actual behavior on the implementation branch before modifying it, including keyword selection, result limits, country handling, and response structure.

### Existing Music Search

Reuse:

- `ISongSearch`.
- `ITunesSearchService`.
- Existing iTunes HTTP request handling.
- Existing response transformation.
- Existing query normalization and expansion.
- Existing candidate deduplication where suitable.
- Existing Redis/CacheService integration.
- Existing country handling and fallback behavior.

Do not create a second iTunes client, a second song-search module, or an independent cache implementation.

The personalized flow must be able to retrieve a candidate pool without allowing the existing provider-level final ranking to determine the final recommendation order.

### Existing Profile and Authentication

Extend the existing `profile` module for music taste management.

Reuse the existing Clerk authentication context and user identity.

New music preference endpoints must use route-level authentication protection and enforce user ownership at the service/repository level.

Do not rely on a `user_id` supplied by the frontend.

Existing Favorites functionality must remain compatible. A saved favorite track must not automatically become an explicit music taste preference without the user selecting it for that purpose.

### Existing Frontend

The frontend uses Next.js App Router, React, and TypeScript.

Integrate music taste setup and editing into the existing Profile area. Integrate the setup-required state into the existing Vibe Scan workflow.

Reuse the existing Clerk token, Axios client, API configuration, and dashboard navigation.

Do not introduce an unrelated settings application or duplicate profile interface.

### Existing Database and Tests

Use the existing PostgreSQL and Knex conventions.

Inspect the actual migration directory, migration configuration, and test commands before creating migrations or adding test infrastructure.

Do not assume that the README's migration command or documented setup reflects the current working branch.

## 3) Tasks

### Task 1 — Inspect Existing Data, APIs, and Implementation Conventions

- [ ] Inspect the current Git branch, working tree, and existing changes before implementation.
- [ ] Review database schema, migration files, migration configuration, and rollback conventions.
- [ ] Review Clerk authentication middleware, route registration, and authenticated user identity handling.
- [ ] Review the existing `profile` module, including profile routes, controllers, favorites services, repositories, DTOs, and interfaces.
- [ ] Review the existing `song` module, including `ISongSearch`, `ITunesSearchService`, response transformation, query expansion, caching, deduplication, and ranking.
- [ ] Review the existing `vibe-scan` module and trace the complete image-to-recommendation request flow.
- [ ] Review the frontend Profile area, Vibe Scan components, API client, and dashboard navigation.
- [ ] Inspect the existing `Song` and raw iTunes response interfaces to identify which metadata fields are already available.
- [ ] Record the current baseline recommendation behavior, including the selected CLIP keywords, search query behavior, provider-level ranking, and final response structure.
- [ ] Verify the Redis/CacheService serialization and deserialization contract. Add a regression test and fix it only if the current implementation demonstrably returns an incompatible cached value.
- [ ] Inspect the current testing infrastructure. If test scripts are placeholders or no runner exists, select and configure a lightweight test setup consistent with the repository.

**Expected result:** An implementation audit identifying the exact files and conventions to reuse, the changes required, and the current recommendation baseline.

### Task 2 — Add Explicit Music Taste Persistence and APIs

Extend the existing `profile` module.

Implement persistent user-owned music preferences for the following types:

**Preferred preferences:**
- Genres.
- Artists.
- Favorite tracks.

**Disliked preferences:**
- Genres.
- Artists.

Allow an optional hard-exclusion setting for disliked genres or artists.

The initial implementation must store explicit preferences only. Do not implement feedback-derived preferences or behavior-based preference weights in this issue.

Suggested logical preference model:

```typescript
type MusicPreferenceType =
  | "genre"
  | "artist"
  | "track";

type PreferenceSentiment =
  | "preferred"
  | "disliked";

interface MusicPreference {
  id: string;
  type: MusicPreferenceType;
  sentiment: PreferenceSentiment;
  value: string;
  provider?: string;
  externalId?: string;
  displayName: string;
  metadata?: Record<string, unknown>;
  hardExclude?: boolean;
}
```

Implementation requirements:

- [ ] Inspect existing database conventions before deciding the physical table structure.
- [ ] Add a user-scoped music preference representation using Knex migrations.
- [ ] Store preferred/disliked genres and artists.
- [ ] Store favorite tracks with stable provider identifiers and sufficient metadata to support recommendation retrieval.
- [ ] Preserve artist and track provider IDs when available.
- [ ] Use normalized values as fallback identifiers when provider IDs are unavailable.
- [ ] Enforce uniqueness for equivalent preferences belonging to the same user.
- [ ] Prevent conflicting preferred/disliked entries from silently coexisting for the same normalized preference.
- [ ] Allow hard exclusions only for explicitly disliked genres or artists.
- [ ] Ensure every read, create, update, replace, and delete operation is scoped to the authenticated user.
- [ ] Implement transaction-safe updates when replacing a complete preference profile.
- [ ] Add authenticated read and update APIs under the existing profile route conventions.
- [ ] Reuse the existing song search implementation for favorite track lookup.
- [ ] Support favorite artist selection by reusing returned artist metadata where possible. Extend the existing iTunes search integration for artist lookup only where required; do not create another provider client.
- [ ] Preserve existing Favorites behavior and avoid conflating saved tracks with explicit music taste.

Suggested API contract, subject to existing route naming conventions:

```text
GET /api/profile/music-taste
PUT /api/profile/music-taste
```

The `PUT` operation should replace the user's explicit music taste profile atomically, making it possible to create, edit, and remove preferences through one consistent operation.

Use additional endpoints only when required by the existing API conventions or frontend workflow.

**Expected result:** Users can persist and manage their explicit music taste through authenticated APIs.

### Task 3 — Build Music Taste Setup and Editing UI

Integrate music taste setup into the existing Profile area.

The interface should support:

**Preferred genres**
- Search or browse supported genres.
- Select multiple preferred genres.
- Remove selected genres.

**Favorite artists**
- Search available artists.
- Display artist names and available metadata.
- Add or remove favorite artists.

**Favorite tracks**
- Reuse existing song search.
- Display track title, artist, and artwork.
- Allow users to select or remove favorite tracks.

**Disliked preferences**
- Select disliked genres.
- Select disliked artists.
- Optionally mark an explicit dislike as a hard exclusion.

Implementation requirements:

- [ ] Reuse the existing Profile dashboard area rather than creating a separate settings application.
- [ ] Provide a clear loading, empty, validation, and save-success/error state.
- [ ] Allow users to edit and remove every saved preference.
- [ ] Prevent duplicate selections.
- [ ] Distinguish explicit music taste selections from existing saved Favorites.
- [ ] Load the current profile when entering the Profile area.
- [ ] Persist changes through the authenticated music taste API.
- [ ] Avoid requiring users to complete unnecessary preference fields.

**Qualifying profile requirement:**

A profile qualifies for personalized recommendations when it contains at least one of the following:

1. At least two distinct preferred genres.
2. At least three distinct favorite tracks with usable track identity and metadata.

These thresholds should be defined as named configuration/constants rather than scattered throughout the code.

Dislikes alone do not qualify as a music taste profile.

**Setup-required behavior:**

- [ ] Check the user's profile before starting personalized recommendation processing.
- [ ] Display a clear setup-required state if the profile does not meet the qualifying threshold.
- [ ] Guide the user to the existing Profile area to configure their music taste.
- [ ] Do not silently fall back to image-only recommendations and label them personalized.

**Expected result:** New and existing users can configure, inspect, and update their explicit music taste.

### Task 4 — Implement Shared Music Taxonomy and Unified Recommendation Profile

Create a shared normalization layer between CLIP output, user preferences, and music metadata.

The current CLIP implementation must remain responsible for visual context extraction only.

Do not assume CLIP directly understands the user's long-term music taste.

Implementation requirements:

- [ ] Inspect the actual CLIP response structure and existing keyword/score representation.
- [ ] Define normalized music taxonomy values for supported genres and visual mood mappings.
- [ ] Map existing CLIP keywords into normalized context attributes where a deterministic mapping exists.
- [ ] Preserve original CLIP labels and their relative scores for traceability.
- [ ] Represent unsupported or missing context attributes as unknown rather than inventing values.
- [ ] Normalize user-selected genre and artist values through the same taxonomy where applicable.
- [ ] Define a unified recommendation input combining visual context, persisted user taste, and current request intent.
- [ ] Make taxonomy mappings deterministic and independently testable.

Suggested internal model:

```typescript
interface UnifiedRecommendationProfile {
  visualContext: {
    keywords: Array<{
      value: string;
      score?: number;
    }>;
    normalizedMoods: string[];
    normalizedGenres: string[];
    energy?: "low" | "medium" | "high";
  };

  userTaste: {
    preferredGenres: string[];
    dislikedGenres: string[];
    favoriteArtists: MusicPreference[];
    dislikedArtists: MusicPreference[];
    favoriteTracks: MusicPreference[];
    hardExclusions: MusicPreference[];
  };

  intent: {
    platform: string;
    contentType: string;
  };
}
```

Optional visual attributes such as mood, normalized genres, and energy must only be populated when supported by CLIP output or explicit taxonomy mappings.

Do not interpret CLIP similarity scores as calibrated probabilities.

**Expected result:** Retrieval and ranking consume one normalized profile instead of independently interpreting raw data from different sources.

### Task 5 — Implement Hybrid Candidate Retrieval

Extend the existing song search implementation rather than creating a separate iTunes integration.

The personalized retrieval process must generate three query groups:

**A. Context-based queries**

Generated from normalized visual context.

Examples:

```text
peaceful sunset acoustic
nostalgic indie evening
warm ambient music
```

**B. Taste-based queries**

Generated from explicit user music preferences.

Examples:

```text
indie acoustic
lo-fi instrumental
favorite artist name
```

**C. Hybrid queries**

Generated from combinations of user taste and visual context.

Examples:

```text
nostalgic indie acoustic
peaceful lo-fi evening
warm alternative music
```

Implementation requirements:

- [ ] Add a query-generation component that accepts the unified recommendation profile.
- [ ] Preserve the distinction between context, taste, and hybrid query groups.
- [ ] Reuse existing query normalization and expansion where appropriate.
- [ ] Normalize and deduplicate queries before provider calls.
- [ ] Merge query-group provenance when equivalent normalized queries are generated by multiple groups.
- [ ] Apply a configurable hard limit to the total number of generated provider queries.
- [ ] Respect the existing iTunes query-expansion limit where possible; do not increase external requests without an evaluation-backed reason.
- [ ] Extend `ISongSearch` and `ITunesSearchService` with a candidate-retrieval operation where required.
- [ ] Reuse existing HTTP handling, response transformation, country handling, and cache infrastructure.
- [ ] Preserve the existing `searchByKeywords` contract for unrelated consumers.
- [ ] Ensure personalized retrieval exposes candidates before the existing provider-level final ranking can discard them.
- [ ] Preserve the normalized query, query group, and relevant provider response metadata as candidate provenance.
- [ ] Use bounded concurrency for provider requests, with a conservative configurable default.
- [ ] Aggregate successful results even when some queries fail.
- [ ] Deduplicate candidates using stable provider identity.
- [ ] Use normalized title and artist as a fallback identity only when a stable provider ID is unavailable.
- [ ] Normalize optional metadata such as `artistId` and `primaryGenreName` when actually returned by iTunes.
- [ ] Keep unavailable metadata undefined rather than synthesizing values.
- [ ] Avoid random query shuffling or random candidate tie-breaking in the personalized evaluation path.

Suggested retrieval result:

```typescript
interface RetrievedCandidate {
  track: Song;
  provenance: Array<{
    group: "context" | "taste" | "hybrid";
    query: string;
  }>;
}
```

A single track can originate from multiple query groups. Merge its provenance rather than creating duplicate candidates.

Do not assume iTunes offers similar-artist discovery support.

**Expected result:** The system can retrieve a bounded, deduplicated, traceable candidate pool using the user's music taste and current visual context.

### Task 6 — Implement Personalized Ranking and Diversification

Create a dedicated `RankingService` within the existing Vibe Scan/recommendation architecture.

Do not place personalized ranking inside the iTunes provider service.

Use the following initial scoring weights:

```text
Final Score =
    0.40 * Context Fit
  + 0.35 * Intent Fit
  + 0.15 * Taste Fit
  + 0.10 * Metadata Quality
```

These weights are configurable starting points and must be evaluated against the fixed dataset before being treated as reliable.

**Context Fit**

Use:

- Normalized visual mood.
- Supported visual context labels.
- Taxonomy genre mappings.
- Candidate query provenance.
- Available candidate genre metadata.

Do not infer tempo, acoustic energy, instrumentation, or other audio characteristics.

**Intent Fit**

Use only deterministic signals that can be justified by the current implementation.

For the initial implementation, intent may influence query construction and candidate provenance. Do not claim that a track is inherently suitable for a specific social platform based only on its genre or title.

If there is no reliable intent-specific signal for a candidate, treat the component as unknown.

**Taste Fit**

Use only available, traceable metadata:

- Preferred genre matches.
- Preferred artist matches.
- Favorite artist identity matches.
- Exact favorite track identity matches.
- Strong negative signals from disliked genres and artists.

Exact favorite track matches and known favorite artist matches should provide stronger positive signals than broad genre matches.

**Metadata Quality**

Use the availability of supported fields that improve identification or discovery, such as:

- Stable provider identity.
- Track title.
- Artist identity/name.
- Available genre metadata.
- Usable artwork or provider URL where relevant.

Missing optional metadata must not automatically penalize a candidate.

**Missing component handling**

- [ ] Represent unavailable component scores as unknown/null rather than zero.
- [ ] Normalize the weighted score over the components for which reliable evidence exists.
- [ ] Do not turn missing metadata into negative ranking evidence.
- [ ] Ensure a candidate cannot receive a misleading explanation for a component that was not evaluated.

**Explicit negative signals and exclusions**

- [ ] Apply a strong configurable penalty for explicit disliked genre or artist matches.
- [ ] Apply hard exclusions when explicitly configured by the user and the candidate metadata confirms the match.
- [ ] Do not exclude a candidate solely because relevant metadata is missing.
- [ ] Keep soft dislikes and hard exclusions as separate concepts.

**Recommendation explanations**

Return reasons generated from the actual positive ranking signals.

Examples:

- Matches your preferred Indie genre.
- Matches an artist you selected.
- Retrieved through a query matching your nostalgic visual context.

Do not claim unsupported audio qualities or fabricate reasons.

**Diversification**

Perform diversification after personalized ranking.

- [ ] Remove remaining duplicates.
- [ ] Limit the same artist to at most two tracks in the top ten when enough suitable alternatives exist.
- [ ] Reduce excessive genre concentration where reliable genre metadata is available.
- [ ] Preserve strong taste and context matches.
- [ ] Relax diversity limits when applying them would unnecessarily reduce result relevance.
- [ ] Do not use random selection to create diversity.

Do not introduce machine-learning ranking or MMR in this issue.

**Expected result:** Recommendations are ordered using personalized, explainable signals and contain reasonable artist/genre diversity.

### Task 7 — Integrate the Personalized Recommendation Flow

Extend the existing Vibe Scan service and controller.

The request flow should follow this sequence:

```text
Authenticated Request
       |
       v
Load User Music Taste
       |
       +---- Not Qualified
       |         |
       |         v
       |    setup_required
       |
       v
Validate Image and Intent
       |
       v
CLIP Visual Analysis
       |
       v
Music Taxonomy
       |
       v
Unified Recommendation Profile
       |
       v
Hybrid Query Generation
       |
       v
iTunes Candidate Retrieval
       |
       v
Candidate Normalization
       |
       v
Personalized Ranking
       |
       v
Diversification
       |
       v
Recommendation Explanations
       |
       v
Personalized Results
```

Implementation requirements:

- [ ] Load and validate the authenticated user's music taste before starting expensive CLIP/provider processing.
- [ ] Use the Clerk-authenticated user ID as the sole source of user identity.
- [ ] Extend the existing Vibe Scan request to accept current platform and content type intent.
- [ ] Preserve existing image upload validation and country handling.
- [ ] Connect the existing CLIP implementation to the unified recommendation profile.
- [ ] Connect hybrid query generation, existing iTunes retrieval, personalized ranking, and diversification.
- [ ] Return recommendations with track metadata, scores, and signal-derived reasons.
- [ ] Return a distinct setup-required response when the user's profile is not qualified.
- [ ] Never label image-only results as personalized.
- [ ] Preserve existing response compatibility where practical.
- [ ] Document intentional API response changes and update affected frontend consumers.
- [ ] Avoid modifying unrelated weather recommendation behavior.

The exact setup-required status code and response envelope must follow the existing backend error/response conventions established during Task 1.

**Expected result:** The existing Vibe Scan workflow produces personalized recommendations using authenticated user taste, visual context, and current intent.

### Task 8 — Evaluate Recommendation Quality

Create a fixed, versioned evaluation dataset.

Use approximately 20–30 representative scenarios covering different combinations of:

- User music taste.
- Visual context.
- Current intent.

Each scenario should contain:

- A fixed user taste profile.
- A fixed visual context or CLIP fixture.
- An intent.
- A stable candidate catalog fixture.
- Human relevance judgments or explicitly defined expected matching signals.

Do not rely exclusively on live iTunes responses because provider results can change over time.

**Baseline**

Run the current image-keyword recommendation flow against the same scenarios using its existing behavior.

**Improved implementation**

Run the personalized engine against the same fixtures.

Measure:

- Relevance@10 or NDCG@10 using documented relevance judgments.
- Taste compatibility.
- Context compatibility.
- Artist diversity.
- Genre diversity where metadata exists.
- Duplicate rate.
- Candidate retrieval coverage.
- Recommendation stability.

Add a specific controlled test:

```text
Same Image
+ Same Intent
+ Different Music Taste
```

Verify that candidate selection or ranking changes meaningfully when the user's taste changes.

Also test that the same profile, context, intent, and candidate fixture produce deterministic results.

Tune ranking weights only when supported by evaluation results. Record the original weights, adjusted weights, measured results, and limitations.

**Expected result:** A repeatable comparison report showing the strengths and limitations of the personalized engine relative to the original image-keyword baseline.

### Task 9 — Testing, Security, Review, and Release

**Backend testing**

- [ ] Test preference validation, normalization, uniqueness, and ownership.
- [ ] Test qualifying-profile validation.
- [ ] Test taxonomy mapping and unknown values.
- [ ] Test query generation, normalization, deduplication, and query limits.
- [ ] Test candidate provenance merging.
- [ ] Test personalized ranking components.
- [ ] Test explicit dislikes and hard exclusions.
- [ ] Test missing metadata handling.
- [ ] Test diversification and fallback behavior.
- [ ] Test provider partial failures and bounded concurrency.
- [ ] Test cache serialization/deserialization if the existing contract is changed or corrected.

**Frontend testing**

- [ ] Test preference loading, creation, editing, and removal.
- [ ] Test favorite artist/track selection.
- [ ] Test duplicate and conflicting preference validation.
- [ ] Test setup-required states.
- [ ] Test Vibe Scan request and response compatibility.

**Security**

- [ ] Require authentication on all new music taste APIs.
- [ ] Enforce preference ownership in every repository operation.
- [ ] Never trust frontend-supplied user IDs.
- [ ] Validate and bound preference values and request sizes.
- [ ] Restrict the number of provider queries and concurrent requests.
- [ ] Avoid persisting uploaded image bytes as part of the music taste profile.

**Release**

- [ ] Verify a user cannot access or change another user's preferences.
- [ ] Verify the qualifying-profile requirement.
- [ ] Verify explicit dislike and hard-exclusion behavior.
- [ ] Verify explanations against actual ranking signals.
- [ ] Verify empty results, partial provider failures, duplicate candidates, and insufficient metadata.
- [ ] Verify migration rollback without destructive preference data changes.
- [ ] Document API contracts, database changes, rollout, and rollback steps.
- [ ] Confirm the frontend and backend remain compatible after deployment.

## 4) Acceptance Criteria

- Every personalized recommendation is generated using the authenticated user's qualifying explicit music taste profile.
- Users can create, edit, and remove preferred genres, disliked genres, favorite artists, disliked artists, and favorite tracks.
- A profile qualifies with at least two distinct preferred genres or at least three distinct favorite tracks with usable metadata.
- Existing Favorites functionality remains separate from explicit music taste selections.
- Recommendations use visual context, user music taste, and current intent in retrieval or ranking.
- Changing relevant music taste can change candidates or their ranking while visual context and intent remain fixed.
- Explicit disliked genres and artists receive strong negative treatment; configured hard exclusions are applied when metadata confirms the match.
- Missing metadata is treated as unknown, not as a mismatch.
- No unavailable audio characteristic is used for ranking or explanations.
- Existing iTunes search, caching, response transformation, and query normalization are reused rather than duplicated.
- Candidate queries are bounded and deduplicated.
- Provider calls use bounded concurrency.
- Candidate provenance is preserved.
- Personalized ranking is not overridden by the existing provider-level final ranking.
- Random query shuffling and random score tie-breaking are not used in the evaluation path.
- Duplicate tracks are removed and artist repetition is limited when enough suitable candidates exist.
- The fixed evaluation dataset compares baseline and improved implementations using documented quality measures.
- New APIs enforce authenticated user ownership.
- The implementation does not require an audio-analysis service, paid LLM API, or additional recommendation microservice.

## 5) Deliverables

- User-owned explicit music taste persistence.
- Authenticated music taste read/update APIs integrated into the existing Profile module.
- Music preference onboarding and editing UI integrated into the existing Profile area.
- Shared music taxonomy and unified recommendation profile.
- Hybrid iTunes candidate retrieval integrated into the existing Song Search module.
- Query provenance and deterministic personalized candidate retrieval.
- Dedicated personalized RankingService.
- Artist/genre diversification.
- Ranking-signal-based recommendation explanations.
- Vibe Scan integration with setup-required handling.
- Fixed evaluation dataset and baseline comparison report.
- Relevant unit and integration tests.
- Updated API, schema, and rollout documentation.

## 6) Out of Scope

- Audio analysis and audio-feature extraction.
- BPM, tempo, instrumentation, or acoustic-feature-based ranking.
- Similar-artist discovery APIs unsupported by the existing provider integration.
- Machine-learning ranking and MMR.
- Feedback-derived or behavior-based music taste learning.
- Recommendation history and adaptive personalization.
- Preferred languages and vocal preference until reliable track metadata is available.
- YouTube integration and embedded playback.
- New weather integrations or unrelated changes to weather-driven recommendations.
- Replacing CLIP or building a separate recommendation microservice.
- Replacing the existing profile, song search, authentication, or caching architecture.