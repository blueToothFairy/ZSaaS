# Technical Design

- **ID:** `iss-002`
- **Date:** Nov 9, 2026
- **Title:** Build a Personalized Music Recommendation Engine
- **Branch:** `feat/iss-002-personalized-recommendations`

> Implementation plan: [./iss-002-plan.md](iss-002-plan.md)

## 1) Overview

### Context

VibeTune currently uses CLIP to extract visual keywords from uploaded images and the existing iTunes integration to retrieve matching tracks. Authenticated users can also save favorite tracks.

The current Vibe Scan flow sends selected image keywords directly to the existing song search implementation.

However, it does not yet combine a structured user music taste profile, current content intent, and visual context within one personalized recommendation process.

The existing backend already provides reusable modules for Vibe Scan, song search, user profiles, authentication, caching, and database access.

The implementation should extend these modules instead of introducing parallel services.

### Problem

Visual context alone cannot represent a user's actual music taste.

Two users can upload the same image and have completely different music preferences.

For example:

- User A prefers Indie, Acoustic, and Lo-fi.
- User B prefers Electronic, Pop, and Dance.

If both users upload the same sunset image, the system should not simply return the same recommendations to both users.

Without explicit preferences and transparent ranking:

- Recommendations may match the image but not the user's taste.
- The system cannot reliably distinguish preferred and disliked genres or artists.
- Users cannot explicitly communicate what kind of music they enjoy.
- Recommendation results have no reliable explanation based on actual ranking signals.
- Recommendation quality cannot be measured consistently against the existing implementation.

### Proposed Direction

Build a personalized recommendation flow using a unified profile containing:

1. The user's explicit music taste.
2. Visual context extracted from the uploaded image.
3. The user's current content intent.

Retrieve candidates from three query groups:

- Context-based queries.
- Taste-based queries.
- Hybrid queries combining context and taste.

Rank candidates using traceable metadata and retrieval signals, apply explicit preference constraints, diversify results, and return explanations based on actual ranking evidence.

Reuse the existing CLIP implementation and iTunes search integration.

The implementation must not infer long-term music taste from images or claim audio characteristics that the available providers do not expose.

### Goals

- Persist editable explicit music preferences for each authenticated user.
- Support preferred/disliked genres, favorite/disliked artists, and favorite tracks.
- Require at least two preferred genres or three usable favorite tracks before returning personalized recommendations.
- Keep existing saved Favorites separate from explicit music taste selections.
- Combine visual context and user taste in ranking; current request intent may shape retrieval queries only.
- Explain recommendations using traceable ranking signals.
- Reuse existing profile, song search, authentication, database, and caching modules.
- Evaluate the new engine against the existing image-keyword flow through both deterministic fixture regression and end-to-end Backend + CLIP API runs.

### Non-Goals

- Audio fingerprinting, audio feature extraction, or additional audio-analysis services.
- BPM, tempo, instrumentation, or acoustic-feature-based ranking.
- Similar-artist discovery unsupported by the existing provider integration.
- Feedback-derived music taste learning in this issue.
- Preferred language and vocal preference until reliable metadata is available.
- Machine-learning ranking or MMR in the initial implementation.
- Replacing CLIP's visual-context role.
- Replacing the existing profile, song search, or authentication architecture.
- Changes to unrelated weather recommendation behavior.

---

## 2) Existing Architecture and Integration Points

### 2.1. Backend Modules

The existing backend follows a module-based Express architecture.

Relevant modules:

```text
backend/src/modules/
├── vibe-scan/
│   ├── controllers/
│   ├── routes/
│   └── services/
│
├── song/
│   ├── interfaces/
│   ├── services/
│   └── ...
│
└── profile/
    ├── dto/
    ├── interfaces/
    ├── repositories/
    ├── services/
    └── ...
```

The exact subdirectory structure should follow the current source files on the implementation branch.

Maintain the existing architectural pattern:

```text
Route
  |
  v
Controller
  |
  v
Service
  |
  v
Repository
  |
  v
Database
```

Use the existing construction and dependency-passing conventions.

Do not introduce a new dependency injection framework.

### 2.2. Vibe Scan Integration

The existing Vibe Scan implementation uses CLIP output to generate keywords and calls the existing song search implementation.

The personalized flow should be integrated into the existing Vibe Scanner service and related controller/route.

Do not create another image analysis service.

### 2.3. Song Search Integration

Reuse the existing:

- `ISongSearch`.
- `ITunesSearchService`.
- iTunes HTTP handling.
- Response transformation.
- Query normalization and expansion.
- Country handling.
- Candidate deduplication.
- CacheService and Redis integration.

The existing song search implementation already has query expansion, caching, and ranking-related behavior.

However, personalized recommendation requires access to a candidate pool before the provider-level ranking determines the final recommendation order.

Extend the existing search abstraction with a candidate-retrieval operation rather than creating an independent provider integration.

Preserve the current `searchByKeywords` contract for other consumers.

### 2.4. Profile Integration

Add Music Taste functionality to the existing `profile` module.

Reuse:

- Existing Clerk user identity.
- Profile route conventions.
- DTO and interface conventions.
- Repository and service construction patterns.
- Existing track search for catalog selection where practical.

Existing Favorites data must remain separate from explicit Music Taste preferences.

Selecting a track in the existing Favorites feature must not automatically create a music taste preference.

### 2.5. Frontend Integration

Integrate the new functionality into the existing Next.js dashboard:

- Add Music Taste setup and editing to the existing Profile area.
- Add a setup-required state to the existing Vibe Scan workflow.
- Reuse the current authentication token and API request mechanism.
- Reuse existing dashboard navigation and UI conventions.

Do not introduce a separate settings application.

### 2.6. Database and Authentication

Use the existing PostgreSQL and Knex implementation.

All new Music Taste endpoints must require Clerk authentication.

Every preference read and mutation must be scoped to the authenticated user's identity.

The repository has no automated Knex migration runner. Database changes are delivered as manual SQL in `backend/migrations/mig-002.sql`; apply the script separately from application deployment. Remove the redundant `music_preferences_identity_unique` index while retaining the `(user_id, preference_type, normalized_value)` no-conflict protection. Add a canonical `music_genres` registry (canonical ID, display name, optional parent, active state, source metadata) and provider/source alias mapping. Rollback keeps preference data intact while reverting application code.

---

## 3) Functional Requirements

### 3.1. Explicit Music Taste

The initial profile supports the following preference types:

| Preference Type | Supported Sentiment | Description |
|---|---|---|
| Genre | Preferred / Disliked | Music genres the user enjoys or avoids |
| Artist | Preferred / Disliked | Artists the user enjoys or avoids |
| Track | Preferred | Favorite tracks selected by the user |

A disliked genre or artist can optionally be marked as a hard exclusion.

The initial implementation stores explicit preferences only.

Do not introduce inferred preference weights or feedback-derived profile updates.

### 3.2. Qualifying Profile

A user is eligible for personalized recommendations when either condition is met:

- At least two distinct preferred genres.
- At least three distinct favorite tracks with usable identity and metadata.

Disliked preferences alone do not qualify.

Define these thresholds as named constants so they can be changed without modifying multiple services.

### 3.3. Preference Editing

Users must be able to:

- Add preferred genres.
- Remove preferred genres.
- Add disliked genres.
- Add and remove favorite artists.
- Add and remove disliked artists.
- Add and remove favorite tracks.
- Configure and remove hard exclusions where applicable.
- Review all currently saved preferences.

Changes must be persisted and reflected in subsequent recommendation requests.

---

## 4) Data Model Changes

### 4.1. User Music Preferences

Add a user-owned music preference representation.

A suggested logical structure is:

```text
user_music_preferences
----------------------
id
user_id
preference_type
sentiment
preference_value
normalized_value
provider
external_id
display_name
metadata
is_hard_excluded
created_at
updated_at
```

Field descriptions:

| Field | Description |
|---|---|
| id | Preference record ID |
| user_id | Authenticated owner |
| preference_type | genre, artist, or track |
| sentiment | preferred or disliked |
| preference_value | Original selected value |
| normalized_value | Normalized identity used for matching |
| canonical_genre_id | Resolved `music_genres.id` for known genre preferences; null for non-genres or unresolved labels |
| provider | Metadata provider, such as itunes |
| external_id | Provider-specific artist or track identifier |
| display_name | User-facing value |
| metadata | Optional provider metadata snapshot |
| is_hard_excluded | Whether an explicit dislike is a hard exclusion |
| created_at | Creation time |
| updated_at | Last update time |

The implemented schema uses `music_preferences` for preference rows and `music_taste_settings` for preferred languages and vocal preference. Both tables are keyed to the authenticated user through `user_profiles`.

The settings row stores `preferred_languages` as JSONB and `vocal_preference` as a checked value. The `music_genres` registry owns stable canonical IDs; `music_genre_aliases` stores normalized aliases and their source names. User-selected aliases resolve to the canonical ID before preference insert, while the display name retains the original label.

### 4.2. Identity and Uniqueness

Use stable identity wherever possible.

**Genre**

Normalize genre values using the shared taxonomy.

Resolve known genres to the canonical genre ID and prevent duplicate preferences for that ID. Keep the existing `(user_id, preference_type, normalized_value)` no-conflict rule. Drop the redundant `music_preferences_identity_unique` index; include `DROP INDEX IF EXISTS public.music_preferences_identity_unique;` in the safe SQL change. Add `music_genres` and a source/alias mapping table so genre identity is managed centrally.

**Artist**

Use the provider artist ID when available.

Otherwise, use a normalized artist name as a fallback identity.

**Track**

Use the provider and external track ID as the preferred identity.

For example:

```text
itunes:123456789
```

When a provider ID is unavailable, use a stable normalized title + artist identity only if it can be determined reliably.

Add appropriate unique constraints and indexes.

Conflicting preferred/disliked records for the same normalized preference must be prevented or resolved explicitly.

### 4.3. Existing Song Model Compatibility

The current `Song` interface contains fields similar to:

```typescript
interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  previewUrl?: string;
  externalUrl?: string;
  duration?: number;
  releaseDate?: string;
}
```

Extend this model only with optional provider fields needed for personalized ranking, such as:

```typescript
interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  previewUrl?: string;
  externalUrl?: string;
  duration?: number;
  releaseDate?: string;

  artistId?: string;
  primaryGenreName?: string;
}
```

These optional fields must be populated only when the provider actually returns them.

Preserve compatibility with existing song consumers.

Do not fabricate genre, artist ID, language, or vocal attributes.

### 4.4. Explicit and Inferred Preferences

Only explicit preferences are stored in this issue.

There is no requirement for a `feedback` source or inferred preference weight in the initial data model.

If future issues introduce behavioral personalization, they should extend this model without overwriting existing explicit preferences.

### 4.5. Relationship with Existing Favorites

Existing Favorites remain a separate user feature.

A favorite track selected through Music Taste setup becomes an explicit preference.

An existing saved Favorite becomes a Music Taste preference only after the user explicitly selects it.

Avoid duplicating existing favorites or changing their current behavior.

### 4.6. Migration Requirements

- Follow the existing Knex migration conventions.
- Enforce user ownership.
- Add the required uniqueness constraints and indexes.
- Make the migration safe for existing users and existing preference/favorite data.
- Provide a rollback strategy.
- Do not use destructive migration steps.

---

## 5) APIs and Interfaces

All new preference endpoints must be authenticated.

### 5.1. Music Taste Profile API

Suggested endpoints:

```text
GET /api/profile/music-taste
PUT /api/profile/music-taste
```

The exact route prefix and registration must follow existing profile API conventions.

**GET**

Return the authenticated user's explicit Music Taste profile.

Example:

```json
{
  "success": true,
  "data": {
    "genres": {
      "preferred": [
        "indie",
        "acoustic",
        "lo-fi"
      ],
      "disliked": [
        "heavy metal"
      ]
    },
    "artists": {
      "preferred": [
        {
          "provider": "itunes",
          "externalId": "12345",
          "name": "Example Artist"
        }
      ],
      "disliked": []
    },
    "tracks": [
      {
        "provider": "itunes",
        "externalId": "67890",
        "title": "Example Song",
        "artist": "Example Artist"
      }
    ],
    "qualifying": true
  }
}
```

**PUT**

Replace the authenticated user's explicit preferences.

The operation should:

- Validate all fields.
- Normalize values.
- Prevent duplicates and conflicting preferences.
- Validate hard-exclusion settings.
- Persist changes atomically.
- Return the updated profile and qualification status.

The backend must derive the user ID from Clerk authentication context.

Never accept a user ID from the request body as the authority for ownership.

### 5.2. Catalog Search

Reuse the existing song search API for favorite track selection.

For artist selection:

- Reuse artist metadata returned by existing track search where possible.
- Extend the existing iTunes request abstraction for artist lookup if the current integration requires it.
- Do not introduce a separate iTunes HTTP client.
- Do not assume similar-artist discovery is available.

The final endpoint shape must follow existing song search API conventions.

### 5.3. Personalized Vibe Scan API

Extend the existing Vibe Scan request to accept current intent.

Example input fields:

```text
image
platform
contentType
```

The request must use the authenticated user's profile.

If the profile does not qualify, return a distinct setup-required response.

The response must follow existing API response conventions.

Example logical response:

```json
{
  "success": false,
  "code": "MUSIC_TASTE_SETUP_REQUIRED",
  "message": "Configure your music taste to receive personalized recommendations."
}
```

Do not silently return image-only results under a personalized recommendation response.

### 5.4. Recommendation Result

Each returned recommendation should contain:

```typescript
interface PersonalizedRecommendation {
  track: Song;

  score: number;

  reasons: string[];

  provenance: Array<{
    group: "context" | "taste" | "hybrid";
    query: string;
  }>;
}
```

The public API may omit internal provenance details if they are not needed by the frontend, but they must remain available internally for evaluation and troubleshooting.

Return recommendation explanations derived from actual positive ranking signals.

---

## 6) Music Taxonomy and Unified Recommendation Profile

### 6.1. Music Taxonomy

Create a deterministic mapping layer for supported visual and music-related attributes.

There must be one source of truth: consolidate the currently dispersed taxonomy in `backend/src/shared/music/music-taxonomy.ts`; remove duplicate mapping definitions from `backend/src/modules/vibe-scan/services/music-taxonomy.ts` or leave only a compatibility re-export. This shared module owns `normalizeMusicTerm`, canonical genre identifiers, aliases, resolver rules, CLIP keyword normalization, and `MOOD_MAP`.

```typescript
export type CanonicalGenre =
  | "pop" | "rock" | "indie" | "electronic" | "hip-hop" | "r&b"
  | "jazz" | "classical" | "metal" | "folk" | "other";

export function resolveMusicGenre(value: string): CanonicalGenre | null;
```

Resolver order: normalize input; exact canonical match; explicit alias lookup; ordered word-boundary classification rules (for example `indie`, `metal`, then electronic aliases `electronic|edm|techno|house`); return `null` if unmatched. Rules must avoid accidental substring matches and be unit-testable. `other` is explicit, not the fallback for unknown input.

#### Genre coverage survey

Apple/iTunes exposes `primaryGenreName` and catalog genre identifiers; treat these as provider metadata rather than a complete canonical vocabulary. Spotify documents artist genres and recommendation genre seeds but marks those endpoints deprecated, so they are not a stable runtime dependency. MusicBrainz exposes an evolving genre/tag vocabulary with community-supplied values; use it as an external source, not VibeTune's ID system. Map provider labels into stable VibeTune canonical IDs and store source IDs/names separately. References: [Apple iTunes Search API](https://performance-partners.apple.com/search-api), [Spotify artist genres](https://developer.spotify.com/documentation/web-api/reference/get-an-artist), [Spotify genre seeds](https://developer.spotify.com/documentation/web-api/reference/get-recommendation-genres), [MusicBrainz API](https://musicbrainz.org/doc/MusicBrainz_API).

Add a `music_genres` registry with canonical ID, display name, optional parent ID, active flag, and source metadata, plus an alias/source mapping for provider labels. Permit parent/child genres (e.g. electronic with house/techno aliases). Unresolved inputs remain unmapped and retain their display text; never fabricate an ID.

#### Expanded CLIP vocabulary and mood mapping

Retain current labels and expand the CLIP keyword catalog:

```text
weather: rainy, stormy, sunny, foggy, snowy, cloudy, windy, thunder, lightning, drizzle, misty, humid, icy, heatwave, breeze
animals: wolf, lion, tiger, cat, dog, eagle, owl, fox, whale, shark, butterfly, dragon, snake, horse, crow
feelings: happy, sad, melancholic, nostalgic, romantic, lonely, hopeful, angry, peaceful, anxious, dreamy, mysterious, dark, uplifting, energetic, calm, chill, epic, intense
genres: lofi, jazz, classical, rock, indie, ambient, electronic, pop, hip hop, trap, orchestral, acoustic, techno, house, punk, metal, synthwave
scenes: late night city, sunset beach, forest morning, empty road, rainy window, coffee shop, mountain sunrise, neon city, space travel, cyberpunk alley, desert horizon, underwater world
times: midnight, dawn, twilight, evening, morning, afternoon
```

Map recognized labels through the shared context mapping and one `MOOD_MAP`, with explicit related genres/search terms. Allow scene, time, weather, feeling, and genre evidence to compose, without letting an unrelated label invent a mood. Preserve original CLIP labels and scores. Validate expanded terms against deployed model outputs; listing a term here does not imply the current model already recognizes it.

Keyword indices must always match embedding row indices. The current workspace keyword array contains 5,084 labels while the current text embedding matrix contains 84 rows. The AI startup now ignores labels beyond the embedding rows and rejects a catalog that has fewer labels than vectors. The first 84 entries match the six requested categories. To activate additional catalog labels, install the optional `AI_CLIP/requirements-embedding-build.txt` dependencies and run `python build_vibe_embeddings.py` in `AI_CLIP/`; then deploy both generated `.npy` files together. The generator encodes the labels in order and validates the resulting `(keywordCount, 512)` shape.

Extend `MOOD_MAP` to cover combinations represented by the expanded vocabulary:

| Mood/context key | Supporting keywords | Canonical genre/search directions |
|---|---|---|
| joyful | happy, sunny, uplifting | pop, funk, upbeat pop |
| melancholic | sad, lonely, rainy, midnight | indie, folk, melancholic indie |
| nostalgic | nostalgic, sunset, evening | indie, acoustic, nostalgic acoustic |
| romantic | romantic, sunset beach, twilight | pop, jazz, romantic jazz |
| peaceful | calm, peaceful, forest morning, breeze | ambient, classical, calm instrumental |
| dreamy | dreamy, misty, space travel, twilight | ambient, electronic, dream pop |
| mysterious | mysterious, foggy, neon city, cyberpunk alley | electronic, jazz, dark electronic |
| dark/intense | dark, stormy, thunder, intense | metal, rock, dark rock |
| energetic/epic | energetic, epic, heatwave, mountain sunrise | electronic, orchestral, energetic electronic |

These are deterministic retrieval associations, not claims about a track's measured audio mood. Preserve multiple supported context dimensions instead of collapsing every scene into one mood.

Responsibilities:

- Normalize genre names.
- Map supported visual keywords to mood categories.
- Map normalized moods to relevant music genres and search keywords.
- Normalize user-selected genre preferences.
- Handle unknown values consistently.

Example:

```typescript
const moodToMusic = {
  nostalgic: {
    genres: ["indie", "acoustic"],
    keywords: [
      "nostalgic indie",
      "melancholic acoustic"
    ]
  },

  peaceful: {
    genres: ["ambient", "instrumental"],
    keywords: [
      "peaceful ambient",
      "calm instrumental"
    ]
  },

  energetic: {
    genres: ["pop", "electronic"],
    keywords: [
      "upbeat pop",
      "energetic electronic"
    ]
  }
};
```

These mappings are heuristic rules, not proof that every track within a genre shares a particular mood.

Do not infer unsupported audio attributes.

### 6.2. CLIP Context

The current CLIP service returns visual keyword information and associated similarity scores.

Use the actual output structure.

Preserve:

- Original keyword.
- Available similarity score.
- Normalized taxonomy mapping.

Optional fields such as scene, mood, and energy should only exist when supported by the current output or deterministic mapping rules.

CLIP similarity scores must not be presented as calibrated probabilities.

### 6.3. Unified Recommendation Profile

Create one internal model for the complete recommendation request.

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

  requestContext: {
    platform: string;
    contentType: string;
  };
}
```

Rules:

- Visual context is derived from CLIP and supported taxonomy mappings.
- User taste is loaded from persisted explicit preferences.
- Intent comes from the current request.
- Missing values remain unknown.
- The unified profile is the common input for query generation and ranking.

---

## 7) Hybrid Candidate Retrieval

### 7.1. Query Groups

Generate candidates from three query groups.

**Context-based queries**

Derived from visual context.

Example:

```text
peaceful sunset acoustic
nostalgic indie evening
warm ambient music
```

**Taste-based queries**

Derived from explicit music preferences.

Example:

```text
indie acoustic
lo-fi instrumental
favorite artist name
```

For favorite tracks, use available track and artist metadata to construct useful search queries.

Do not assume provider support for similar-artist discovery.

**Hybrid queries**

Combine context and preferred music characteristics.

Example:

```text
nostalgic indie acoustic
peaceful lo-fi evening
warm alternative music
```

### 7.2. Query Normalization

Before making external requests:

- Normalize casing and whitespace.
- Remove duplicate queries.
- Merge provenance when the same query belongs to multiple groups.
- Apply a configurable maximum query count.
- Reuse existing query expansion and normalization rules where practical.

The personalized flow should respect the existing iTunes search query limit rather than generating an unbounded number of variants.

Do not use random query shuffling in the evaluation path.

### 7.3. Existing iTunes Integration

Extend the existing `ISongSearch` and `ITunesSearchService`.

The personalized candidate retrieval operation should:

1. Receive the generated query plan.
2. Reuse existing iTunes HTTP request handling.
3. Reuse existing response transformation.
4. Reuse country selection and fallback.
5. Reuse existing caching infrastructure.
6. Execute provider requests under a concurrency limit.
7. Return the collected candidate pool and provenance.

Preserve the current search API for other consumers.

### 7.4. Candidate Provenance

Each candidate should preserve information about how it was retrieved.

Example:

```json
{
  "trackId": "12345",
  "provenance": [
    {
      "group": "context",
      "query": "nostalgic evening music"
    },
    {
      "group": "taste",
      "query": "indie acoustic"
    },
    {
      "group": "hybrid",
      "query": "nostalgic indie acoustic"
    }
  ]
}
```

If the same track is found by multiple queries:

- Keep one candidate.
- Merge provenance.
- Preserve its provider identity.
- Do not discard query-group evidence.

### 7.5. Candidate Normalization and Deduplication

Use provider track identity where available.

If provider identity is unavailable, use a normalized title + artist fallback when it is reliable.

Keep metadata optional.

Missing genre or artist identifiers must not be fabricated.

### 7.6. Existing Provider-Level Ranking

The existing iTunes service contains ranking-related logic.

For the personalized retrieval path, candidates must reach the new RankingService before a provider-level final ranking determines their final order or removes relevant candidates.

Provider metadata and query matching evidence can still be reused.

Avoid applying two independent final ranking algorithms sequentially.

---

## 8) Personalized Ranking

### 8.1. Initial Weighted Formula

Use the following initial weights:

```text
Final Score =
    0.5 * contextFit
  + 0.4 * tasteFit
  + 0.1 * metadataQuality
```

If a component is unknown, renormalize over the available component weights; do not substitute zero. Remove `intentTerm`/Intent Fit from ranking types, formula, component breakdown, explanations, and evaluation metrics. Request intent may contribute query terms during retrieval only.

Evaluate them with the Backend + CLIP API scenarios and report measured results; fixture results remain regression evidence only.

The system must not use the formula blindly when a component has no reliable evidence.

When a component is unavailable, treat it as unknown and normalize the final weighted score over the available components.

Do not substitute zero for unknown values.

### 8.2. Context Fit

Context Fit measures compatibility with the current visual context.

Use:

- Normalized CLIP keywords.
- Supported mood mappings.
- Supported taxonomy genres.
- Candidate query provenance.
- Available track genre metadata.

A candidate retrieved through a context-related query may receive supporting context evidence.

Do not claim that the system has evaluated the actual audio's emotional character.

### 8.3. Request intent (retrieval only)

Request intent may help construct relevant queries and preserve query provenance. It is not a ranking score.

Use current intent to:

- Generate relevant queries.
- Select supported content-related search terms.
- Preserve intent-related query provenance.

A platform name such as Instagram or TikTok does not by itself prove that a song is suitable for that platform.

Do not invent platform-specific audio quality, popularity, duration suitability, or licensing claims.



### 8.4. Taste Fit

Taste Fit measures compatibility with the user's explicit music preferences.

Supported signals:

| Signal | Matching method |
|---|---|
| Preferred genre | Match normalized genre metadata |
| Disliked genre | Apply strong negative treatment |
| Preferred artist | Match provider artist ID or normalized name |
| Disliked artist | Apply strong negative treatment |
| Favorite track | Match stable provider track identity |

Exact favorite track and known preferred artist matches should carry stronger positive signals than broad genre matches.

The exact internal component weights should be independently configurable.

Do not infer similarity between artists from their names.

### 8.5. Metadata Quality

Metadata Quality represents the availability of fields that help identify and discover a track.

Potential evidence:

- Stable provider track ID.
- Track title.
- Artist name or ID.
- Available genre information.
- Artwork.
- External track URL.

Do not treat unavailable optional metadata as a negative genre, mood, or taste match.

Metadata quality must not dominate taste or context relevance.

### 8.6. Explicit Dislikes

Distinguish two cases:

**Soft dislike**

A disliked genre or artist applies a strong configurable negative score.

It can lower the ranking without automatically removing the candidate.

**Hard exclusion**

If the user explicitly configures a disliked genre or artist as a hard exclusion, remove candidates whose metadata confirms that match.

If the required metadata is missing, do not automatically assume a match or remove the candidate.

### 8.7. Diversification

Perform diversification after ranking.

Initial rule:

- No more than two tracks from the same artist in the top ten when enough suitable alternatives exist.

Additional behavior:

- Reduce excessive genre concentration where metadata supports it.
- Preserve strong personal taste matches.
- Preserve strong context matches.
- Relax diversity constraints if too few suitable candidates remain.
- Maintain deterministic output for equivalent inputs.

Do not use random selection.

Machine-learning ranking and MMR are outside the initial implementation.

### 8.8. Recommendation Explanations

Generate explanations using the actual positive component signals.

Examples:

```text
Matches your preferred Indie genre.
Matches an artist you selected.
Retrieved from a query matching your nostalgic visual context.
```

Each reason must correspond to evidence that actually contributed to the recommendation.

Do not claim:

- A specific BPM.
- Acoustic or instrumental characteristics.
- Tempo.
- Energy measured from audio.
- Similarity between artist recordings.

Unless that information is available from a supported and verified data source, it must not appear in the explanation.

---

## 9) Recommendation Flow

The integrated flow should be:

```text
Authenticated Request
        |
        v
Load User Music Taste
        |
        +---- Profile Not Qualified
        |          |
        |          v
        |    setup_required
        |
        v
Validate Image and Intent
        |
        v
Existing CLIP Visual Analysis
        |
        v
Normalize Visual Context
        |
        v
Build Unified Recommendation Profile
        |
        v
Generate Search Queries
        |
        +---- Context Queries
        |
        +---- Taste Queries
        |
        +---- Hybrid Queries
        |
        v
Existing iTunes Integration
        |
        v
Bounded Candidate Retrieval
        |
        v
Candidate Normalization
        |
        v
Deduplication + Provenance Merging
        |
        v
Personalized Ranking
        |
        v
Diversification
        |
        v
Signal-Based Explanations
        |
        v
Personalized Recommendations
```

The user's taste profile should be validated before expensive image analysis and external music search operations begin.

The existing Vibe Scan service remains the main integration point.

---

## 10) API and Error Handling

### 10.1. Missing Music Taste Profile

Return a distinct setup-required response when the user's explicit profile does not qualify.

Do not silently return the old image-keyword result under a personalized response.

If the legacy non-personalized search remains available during rollout, it must be clearly distinguished from personalized recommendations.

### 10.2. Partial Provider Failure

If some search queries fail:

- Keep successfully retrieved candidates.
- Record failed queries.
- Continue ranking valid candidates.
- Return partial recommendations when appropriate.

Do not fail the entire recommendation request solely because one search query failed.

### 10.3. Insufficient Candidates

When too few candidates are available:

1. Try permitted alternative queries.
2. Use available taste/context combinations.
3. Relax diversification constraints when justified.
4. Return fewer recommendations with an appropriate response state.

Do not use random or unrelated tracks to fill the result list.

### 10.4. Missing Metadata

Treat missing fields as unknown.

Examples:

- No genre: genre fit is unknown.
- No artist ID: use normalized artist name only if reliable.
- No preview URL: the track can still be recommended but cannot be previewed.
- No artwork: use the existing frontend fallback.

Do not convert missing metadata into a negative preference match.

---

## 11) Security, Privacy, and Reliability

- Require Clerk authentication for all new preference and personalized recommendation endpoints.
- Derive the user ID from the authenticated request context.
- Enforce user ownership in repository queries.
- Never trust a user ID supplied by the frontend.
- Validate preference types, values, provider IDs, and payload sizes.
- Enforce unique preference records.
- Bound the number of generated queries.
- Bound provider request concurrency.
- Handle external API failures without unnecessarily terminating the entire recommendation process.
- Avoid storing raw uploaded image bytes in the music taste profile.
- Avoid logging sensitive user data.
- Preserve existing song search and Favorites behavior.
- Avoid introducing unnecessary services or infrastructure.

---

## 12) Testing and Evaluation

### 12.1. Unit Tests

Test:

- Preference validation.
- Preference normalization.
- Qualifying-profile rules.
- Genre taxonomy mapping.
- Unified profile construction.
- Search query generation.
- Query normalization and deduplication.
- Provenance merging.
- Taste Fit.
- Context Fit.
- Metadata Quality.
- Missing metadata behavior.
- Explicit dislike penalties.
- Hard exclusions.
- Diversification.
- Final score normalization.

### 12.2. Integration Tests

Test the integrated flow using mocked:

- CLIP responses.
- iTunes responses.
- Database operations.
- Cache behavior.

Important scenarios:

- Authenticated user with a qualifying profile.
- Authenticated user without a qualifying profile.
- User with preferred genres.
- User with favorite tracks.
- User with explicit disliked genres.
- User with hard exclusions.
- Partial provider failures.
- Empty provider responses.
- Incomplete track metadata.
- Duplicate candidates across multiple query groups.

### 12.3. Fixed Evaluation Dataset

Create a versioned dataset containing approximately 20–30 scenarios.

Each scenario should include:

- Explicit user taste.
- Visual context.
- Current intent.
- Stable candidate metadata fixtures.
- Documented relevance judgments.

Use identical fixture catalogs for deterministic regression comparisons. For the primary API-flow run, submit the same scenario inputs to both flows and score each flow's returned candidate list; do not replace API candidates with the fixture catalog.

Compare:

- Relevance@10 or NDCG@10.
- Taste compatibility.
- Context compatibility.
- Artist diversity.
- Genre diversity where available.
- Duplicate rate.
- Candidate coverage.

### 12.4. Controlled Personalization Tests

A mandatory test should hold the context and intent constant while changing user taste.

Example:

```text
Input A:
Image: Sunset at the beach
Intent: Instagram Story
Taste: Indie, Acoustic, Lo-fi

Input B:
Image: Sunset at the beach
Intent: Instagram Story
Taste: Electronic, Pop, Dance
```

The resulting candidates or their ranking must change meaningfully where suitable metadata and candidates are available.

Also verify deterministic results for identical inputs and fixtures.

### 12.5. Baseline Comparison

The primary evaluation must call the actual Backend + CLIP API flow to simulate the production request. Capture input and output at every stage (request, CLIP, normalized context, query plan, provider retrieval, ranked response), elapsed time per stage and end-to-end, and process memory (baseline, after stage, peak where measurable). Record whether CLIP is warm or cold. Calculate quality metrics from candidates returned by that API run against documented scenario judgments. Capture a sanitized provider/result snapshot for reproducibility. Fixture-only evaluation remains regression coverage and must be labeled separately; it is not a substitute for API-flow evaluation.

The improved implementation is the new personalized recommendation flow.

The report must document:

- Baseline behavior.
- Improved behavior.
- Evaluation methodology.
- Dataset version.
- Metrics.
- Ranking weights: Context 0.5, Taste 0.4, Metadata Quality 0.1.
- Per-stage API inputs/outputs, latency, memory, and captured candidate results.
- Results.
- Limitations.

Do not rely exclusively on subjective impressions or live provider results.

---

## 13) Risks and Mitigations

| Risk | Mitigation |
|---|---|
| iTunes does not provide genre or artist IDs for every track | Use optional metadata and reliable normalized-name fallbacks |
| Some user profiles contain too little information | Require two genres or three usable favorite tracks |
| Existing Favorites are confused with Music Taste | Keep explicit preference selection separate |
| Existing provider ranking removes useful candidates | Expose a candidate pool before personalized ranking |
| Multiple generated queries create excessive external calls | Normalize, deduplicate, cap query count, and use bounded concurrency |
| Random query expansion makes evaluation inconsistent | Use deterministic personalized query generation |
| Missing metadata is interpreted as a mismatch | Treat unavailable values as unknown |
| Dislikes unintentionally remove valid recommendations | Distinguish soft dislikes from explicit hard exclusions |
| Preference records are accessed across users | Enforce Clerk authentication and user-scoped repository operations |
| Initial ranking weights are not optimal | Compare against the fixed evaluation dataset and tune using measured results |
| Existing cache serialization is inconsistent | Verify the Redis/CacheService contract and add regression tests |
| Existing API consumers break after integration | Preserve existing contracts where practical and document intentional changes |

---

## 14) Rollout and Rollback

Implement in the following order:

1. Inspect and confirm existing architecture and migration conventions.
2. Add explicit music preference persistence and authenticated APIs.
3. Add Music Taste setup and editing to the existing Profile area.
4. Implement unified profile and personalized candidate retrieval.
5. Add personalized ranking, diversification, and explanations.
6. Integrate the new recommendation flow into Vibe Scan.
7. Run baseline comparisons and verify the acceptance criteria.

Introduce the personalized retrieval and ranking implementation behind the existing recommendation service boundary.

During rollout:

- Preserve the existing search contracts for unrelated consumers.
- Do not remove existing Favorites functionality.
- Do not modify unrelated weather behavior.
- If the existing Vibe Scan response changes, update its frontend consumer together with the backend change.
- Do not silently return image-only recommendations as personalized output.

Rollback must be able to restore the previous recommendation flow without deleting the user's persisted music taste data.

Database rollback and preference retention must be considered separately. Avoid destructive migration operations.

---

## 15) Implementation Decisions

The initial implementation explicitly follows these decisions:

| Decision | Initial Approach |
|---|---|
| User taste source | Explicit user-selected preferences |
| Profile qualification | Two preferred genres or three usable favorite tracks |
| Preference categories | Genres, artists, tracks |
| Feedback-based learning | Deferred |
| Music metadata | Existing iTunes integration |
| Additional provider | Not required |
| Visual analysis | Existing CLIP service |
| Retrieval | Context + taste + hybrid queries |
| Ranking | Weighted metadata-based ranking |
| Initial weights | Context 0.5, Taste 0.4, Metadata Quality 0.1; request intent is retrieval-only |
| Missing metadata | Unknown, not negative |
| Diversification | Deterministic artist/genre constraints |
| Persistence | Existing PostgreSQL + Knex |
| Authentication | Existing Clerk integration |
| Frontend | Existing Profile and Vibe Scan interfaces |
| Cache | Existing CacheService/Redis |
| Audio analysis | Not used |
| Machine-learning ranking | Not included |

## 16) Final Expected Outcome

After implementation, VibeTune should support the following workflow:

1. An authenticated user configures their music taste through the existing Profile interface.
2. The user selects preferred genres, favorite artists, and favorite tracks, with optional dislikes.
3. The user uploads an image and selects a current content intent.
4. The system loads the user's explicit music taste and analyzes visual context using the existing CLIP service.
5. A unified recommendation profile combines music taste, visual context, and intent.
6. The existing iTunes integration retrieves candidates through context-based, taste-based, and hybrid queries.
7. A dedicated ranking engine evaluates personal and contextual relevance.
8. The system diversifies the results and provides explanations based on actual ranking evidence.
9. The user receives recommendations that reflect both their established music preferences and their current needs.

**The core principle is to recommend music that users are likely to enjoy, while remaining relevant to the visual context and purpose of their current request.**