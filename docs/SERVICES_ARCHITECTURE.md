# Services Architecture & Integration Guide

## Overview

Turn-based gameplay model: Users click "Play" to trigger a single API call per turn. No continuous polling. All data fetching and normalization happens in `matchService.ts`, then async thunk (`rosterThunks.ts`) orchestrates state updates in strict sequence.

---

## Current Services Status

### Active Services
- ✅ **matchService.ts** — Data fetching & normalization (turn-based)
- ✅ **apiFootball.ts** — API integration with normalizers

### Deleted Services (Live-Action Only)
- ❌ **pollService.ts** — Removed (polling not used in turn-based model)
- ❌ **aiService.ts** — Removed (Phase 0)
- ❌ **webSocket.ts** — Removed (Phase 0, no live feed)
- ❌ **liveScoresThunk.ts** — Removed (Phase 3, live score overlays not needed for turn-based)

### Future Services (Not Yet Created)
- Phase 4: `authService.ts` — Firebase authentication & user sessions

---

## Service Design: Separation of Concerns

### apiFootball.ts & matchService.ts
**Purpose:** Data layer — fetches and normalizes match results for a single turn

**Core Functions:**
```typescript
// apiFootball.ts — Primary API integration
getMatchResults(turnId: string): Promise<Match[]>
  // Called by playTurn() async thunk in Step 0
  // Input: Turn ID (e.g., "Group_Stage_1", "R16", "Quarterfinals")
  // Returns: Match array with scores, events (goals, cards, substitutions)
  // Data structure: Match with homeTeam/awayTeam, score, events, status
  // No polling, one call per "Play" click

normalizeMatch(apiFixture): Match
  // Converts API-Football fixture response to internal Match type
  // Extracts: teams, scores (FT, ET, HT, penalty), events, status

normalizePlayer(apiPlayer): Player
  // Normalizes player data from API to internal Player type
  // Maps: position, countryCode, nationality

normalizeTeam(apiTeam): Squad
  // Normalizes team/squad data from API to internal Squad type

normalizeMatchEvents(apiEvents): MatchEvent[]
  // Normalizes event array (goals, cards, substitutions)

// matchService.ts — Fallback/wrapper layer
fetchAllMatches(): Promise<Match[]>
fetchMatchDetails(matchId): Promise<Match>
fetchRosterMatches(teamIds): Promise<Match[]>
normalizeMatches(apiMatches): Match[]
```

**Scoring Functions** (separate concern, in `/src/lib/scoring/`):
```typescript
// These are NOT in matchService — they're in dedicated scoring library
calculatePlayerScore(player, stats, isSubstitute, matchId): PlayerScore
  // Calculates fantasy points for a player in a single match
  // Called by playTurn() thunk Step 1
  // Uses extractPlayerMatchStats() to get stats from events

calculateSquadScore(squad, match, isSubstitute, advancementBonus): SquadScore
  // Calculates fantasy points for a squad in a match
  // Called by playTurn() thunk Step 1

calculateTurnScore(turn, playerScores, squadScores): TurnScore
  // Aggregates player + squad scores into turn total with MVP tracking

extractPlayerMatchStats(player, match): PlayerMatchStats | null
  // Extracts player stats from match events (goals, assists, cards)
  // Returns null if player didn't participate in match
  // Used to feed into calculatePlayerScore
```

**Elimination Detection** (in `/src/store/thunks/rosterThunks.ts`):
```typescript
detectEliminatedTeams(matches: Match[], turnId: string): string[]
  // Analyzes knockout match results to identify eliminated national teams
  // Only runs for knockout stages (R16+)
  // Filters matches to ["FT", "AET", "PEN"] (completed matches only)
  // Identifies loser as eliminated; both teams advance on draws
  // Returns array of eliminated country codes
```

**Current State:**
- ✅ Uses mock 2022 World Cup historical data from JSON
- ✅ API integration ready (apiFootball.ts configured, but paywall prevents 2026 data)
- ✅ Scoring fully implemented (Phase 3.6 complete)

**Architecture Separation**:
- **Data Layer** (`apiFootball.ts`, `matchService.ts`): Fetch & normalize API responses
- **Stats Layer** (`matchStatsExtractor.ts`): Extract performance data from events
- **Scoring Layer** (`calculatePlayerScore`, `calculateSquadScore`, `calculateTurnScore`): Pure scoring functions
- **Orchestration** (`rosterThunks.ts`, `playTurn`): Coordinate all steps in turn completion

---

## Turn Completion Flow

**matchService.ts role in async thunk:**

```
User clicks "Play"
  ↓
playTurn() async thunk (rosterThunks.ts)
  ↓
Step 0: await matchService.getMatchResults(turnId)
  ↓ (returns match data)
  ↓
Step 1: dispatch(updateScores()) — uses calculatePlayerScore(), calculateSquadScore()
  ↓ Step 2-5: Additional Redux updates (lock, eliminate, modal, move)
```

See: `/docs/roster-logic-rebuild.md` Section 11 for full async thunk implementation.

---

## API-Football Response Mapping (Phase 3)

**Source:** API-Football v3 `/fixtures` endpoint

**Valid Match Status Codes (Turn-Based Only):**
- `"NS"` — Not Started (upcoming match)
- `"FT"` — Full Time (match finished normally)
- `"AET"` — After Extra Time (match finished with extra time)
- `"PEN"` — After Penalties (match finished via penalty shootout)

**Note:** Live status codes ("1H", "2H", "ET", "HT", "P") are not supported in turn-based gameplay. Matches are fetched after completion.

**Required fields from API response:**
```typescript
{
  fixture: {
    id: number,
    date: string (ISO 8601),
    status: {
      short: string,    // "NS" | "FT" | "AET" | "PEN" (turn-based only)
      elapsed: number   // minutes elapsed (used for display in live matches, null for turn-based)
    }
  },
  teams: {
    home: { id, code, name },
    away: { id, code, name }
  },
  goals: {
    home: number,
    away: number
  },
  score: {
    halftime: { home, away },
    fulltime: { home, away },
    extratime: { home, away },
    penalty: { home, away }
  },
  events: Array<{         // Goals, substitutions, cards
    type: "Goal" | "Card" | "subst",
    detail: string,       // e.g., "Yellow Card", "Red Card"
    player: { id, name },
    time: { elapsed, extra }
  }>
}
```

**Normalize to internal Match type** via `normalizeMatch()`

---

## Phase 3 Implementation Status

### ✅ COMPLETE — Data Layer (Phase 3.1-3.3)
- ✅ `apiFootball.ts` — API integration with normalizers
- ✅ `matchService.ts` — Fallback/wrapper layer
- ✅ Turn-based match fetching via `getMatchResults(turnId)`
- ✅ Event normalization (goals, assists, cards, substitutions)
- ✅ Error handling for API failures

### ✅ COMPLETE — Scoring Functions (Phase 3.6)
- ✅ `matchStatsExtractor.ts` — Extract stats from events
- ✅ `calculatePlayerScore()` — Position-based point formulas
- ✅ `calculateSquadScore()` — Team/match result formulas
- ✅ `calculateTurnScore()` — Turn aggregation with MVP
- ✅ Substitution modifier (50% multiplier for R16+ additions)
- ✅ `turnScoresSlice` — Redux persistence

### ✅ COMPLETE — Async Thunk Integration (Phase 3.5-3.6)
- ✅ `playTurn()` thunk orchestrates turn completion in strict sequence
- ✅ Match fetching → score calculation → storage pipeline
- ✅ Elimination cascade detection and propagation
- ✅ Full "Play" click → API → score updates → Redux flow

### ✅ COMPLETE — Live Score Removal (Phase 3 Cleanup)
- ✅ Removed `liveScoresThunk.ts` (not used in turn-based gameplay)
- ✅ Cleaned up `selectAllMatches` selector (removed live score injection)
- ✅ Removed live status code checks from components ("1H", "2H", "ET", "HT", "P")
- ✅ Updated `MatchStatusShort` type to reflect turn-based codes only

### Future Enhancements (Phase 4+)
- [ ] Add caching layer (optional: cache results per turn to avoid re-fetching)
- [ ] Enhance shootout stats capture (currently null in event logs)
- [ ] Implement actual save statistics for goalkeepers (currently estimated as 0)
- [ ] Real 2026 data when paywall is removed or alternative API available

---

## Confirm Environment Variables (Phase 3)

**File:** `.env` (Vite config)

**And filters for League, SEason, Dates and potentially by Match**
```
VITE_API_FOOTBALL_KEY=your_api_key_here
VITE_API_FOOTBALL_BASE_URL=https://api-football-v1.p.rapidapi.com
VITE_API_FOOTBALL_HOST=api-football-v1.p.rapidapi.com
```

**Usage in matchService.ts:**
```typescript
const API_KEY = import.meta.env.VITE_API_FOOTBALL_KEY;
const API_BASE = import.meta.env.VITE_API_FOOTBALL_BASE_URL;
```

---

## Redux Selector Architecture (Phase 3 Cleanup)

**selectAllMatches** — Primary match selector
- **Before:** Applied live score overlays, checked for live statuses, modified match data
- **After:** Returns matches as-is from Redux state (no transformations)
- **Reason:** Turn-based gameplay has no live matches; selector should focus on data retrieval, not transformation

**Removed Selectors:**
- `selectAllMatchesWithLiveScores` — Was redundant alias, now removed
- Live score injection logic — Removed from selector, was dead code for turn-based gameplay

**Selector Best Practice:**
All scoring selectors in `scoringSelectors.ts` now focus on:
1. Filtering matches by completion status (NS, FT, AET, PEN)
2. Extracting roster members and their stats
3. Pure data retrieval without transformation

---

## Future Services (Phase 4+)

### authService.ts (Phase 4)
- Firebase authentication (sign up, login, logout)
- User session management
- JWT token refresh

### Potential Future (Phase 5+)
- `databaseService.ts` — User game saves (Firestore / Supabase)
- `analyticsService.ts` — Game event tracking

---