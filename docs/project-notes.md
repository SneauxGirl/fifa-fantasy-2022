______________________________

# FF22 Project Notes
______________________________

## Phase 0 — Setup & Skeleton - Complete 3/16/26

## Phase 1 — Mock Data & Core Types complete 3/17/2025

## Phase 2 — Basic UI Components

## Phase 2.5 — Architecture & Implementation Plan for Schedule/Roster/Match Play

---------------------------------------------------------
### COMPLETE TO THIS POINT (3/27/26) - REFACTOR FOR TURN BASED PLAY
_________________________________________________________

## Phase 3 — API Integration & Turn-Based Gameplay

// ====== Goal: Shift from live-action to turn-based gameplay using historical 2022 World Cup data. =====

**Context:** Real-time match data (live scores, minute-by-minute events) is behind an undisclosed paywall. Pivoting to historical 2022 World Cup data for initial roster load and turn-based game mechanics instead.

---

### Current Snapshot (May 2026)

- Core app shell, roster flow, and Match Play UI are functional.
- Navigation/order updated to `Roster | Match Play | Schedule`.
- Match Play now includes cumulative score display in the blue header and per-stage score breakdown labels.
- Roster conflict surfaces are active in Squad/Player cards (same-group + current-turn opponent detection).
- Confirm-on-play behavior is active for incomplete pre-Quarterfinal setups (warns, does not hard-block).

### Known limitations (Current Branch)

- **Starter (player) points in mock mode:** `matches.json` usually lacks **`events`**, so player fantasy scoring may show zeros until API is connected; squad scoring still uses final scorelines for signed squads.
- **Elimination / knockout:** Validate when swapping schedule sources.
- **Id protocol:** Fixture team ids are normalized to national **`teamId`** — see **`docs/DATA_IDENTIFIERS.md`** (avoid comparing raw API fixture ids to roster without that step).

---

### COMPLETED WORK

#### ✅ 3.1 — Remove API-Live-Action Logic
- Removed `gamesComplete` property from all types and state
- Removed live polling infrastructure
- Removed AI slice (Claude/OpenAI integration — deferred to Phase 5+)

#### ✅ 3.2 — Load Initial 2022 Roster Data
- All 32 teams and ~650 players load from `squads.json` in `available` pool
- No API call needed for initial state — data already normalized in JSON
- Position standards established:
  - Internal storage: Long names ("Goalkeeper", "Defender", "Midfielder", "Attacker")
  - UI display: Short codes ("GK", "DEF", "MID", "FWD") via `positionToFifa()` helpers in `lib/formatMapping.ts`

#### ✅ 3.3 — Scoring Formulas & Lock State
- `isRosterLocked: boolean` state in `/src/store/slices/uiSlice.ts` (line 20)
- `setRosterLocked` reducer in `uiSlice.ts` (lines 100-102)
- `selectIsRosterLocked` selector in `/src/store/selectors/scoringSelectors.ts` (lines 75-80)
- Lock set to true when user clicks "Play" at Quarterfinals; remains true through Final

---

#### ✅ 3.4 — Component Lock Enforcement (COMPLETE)

**Goal:** Wire 5 components to enforce lock state when `isRosterLocked === true`

**Lock semantics:**
- ❌ Cannot add/remove players from roster
- ❌ Cannot add/remove squads
- ✅ CAN move players between bench ↔ starter (tactical flexibility)
- ✅ Elimination cascade still applies (automatic)

**Components to update:**
1. `AvailablePlayersList.tsx` — Disable add button when locked
2. `AvailableSquadsList.tsx` — Disable squad selection when locked
3. `SquadsSection.tsx` — Disable squad removal/addition when locked
4. `StartersLineup.tsx` — Disable drag; keep move-to-starter/bench enabled
5. `RosterDragZone.tsx` — Disable player signing/removal when locked

**Status:**
- [x] AvailablePlayersList — Complete
- [x] AvailableSquadsList — Complete
- [x] RosterDragZone — Started (import added)
- [x] SquadsSection — Pending
- [x] StartersLineup — Pending
- [x] Dev server verification

### IN PROGRESS

#### 3.5 ADDITION

 - Update all components to work with the new data and play flow
 - Modify page formats as needed and style
 - Check for responsiveness
 - Update to variable styling from Tokens as possible
 - Confirm and update for accessiblity as part of refactor

---

### UPCOMING PHASES

#### 3.6 — Turn Completion Flow (Async Thunk & UI)

**File:** `/src/store/thunks/rosterThunks.ts`

**"Play" button sequence:**
1. Fetch match results for the turn (via **`getMatchResults(turnId)`** in `services/apiFootball.ts` — mock or live)
2. Calculate player/squad scores
3. Lock turn scores (mark as final)
4. Update eliminated status (cascade from National Team → Players/Squads)
5. Show elimination notification modal
6. Move eliminated members to `pool: "eliminated"`
7. Update UI lock state if QF was completed

**Scoring Record Component (NEW):**
- Location: `/src/components/Dashboard/ScoringRecord.tsx`
- Display: "Squads: X pts | Players: Y pts | Total: Z pts"
- Updated first on "Play", static until next "Play"
- Eliminatedmembers retain their points from elimination turn

#### 3.6 — Validation & Testing

**Test scoring calculations:**
- Validate against 2022 World Cup historical data (spot-check 3-5 matches)
- Verify substitute multiplier (50% for R16+ signings)
- Verify eliminated members retain points

**Test lock state:**
- Pre-lock: All add/remove buttons enabled, 11-slot formation grid
- Post-lock: All add/remove disabled, move buttons enabled, dynamic formation grid

**Test turn completion:**
- "Play" triggers async thunk, API call succeeds, scores calculated, modal appears, lock state updates

**Test elimination cascade:**
- National team eliminated → all players eliminated
- Players moved to `pool: "eliminated"` with points retained

---

### Slice State Updates Needed (Phase 3.5+)

**nationTeamsSlice** (Incomplete refactor):
- Currently: Only stores `squads: RosterSquad[]`
- Needs: Full team metadata (teamId, teamName, countryCode, flag, confederation, group, coaches) + all players array
- Purpose: Source of truth for 32-team tournament state (distinct from rosterSlice user selections)
- Reference: `docs/roster-logic-rebuild.md` Section 6 (App.tsx Initialization)
- Related TODOs:
  - [ ] Expand NationTeamsState interface to include team metadata + players
  - [ ] Update initializeNationTeams reducer to handle full data structure
  - [ ] Verify elimination cascade logic uses correct nationTeams data

---

### Architecture Notes

**Turn-Based Match Data:**
- Each turn's match results fetched via single API call when user clicks "Play"
- API call retrieves: scoring data (goals, assists, clean sheets), red/yellow cards, substitutions, eliminations

**Tournament Structure:** (Defined in `docs/rules/rules.md` Section 6)
- **Finished:** Matches from completed prior turns (final scores)
- **Current:** Current turn's matches (with halftime snapshot)
- **Upcoming:** Next turn's matches (by position, e.g., "1A v 2B")

**Round-Specific Roster Availability:**
- **Group Stage 1-3:** All non-eliminated squads/players available (100% scoring)
- **R16:** Final substitution window (50% scoring for new additions)
- **QF+:** Roster locked; no new additions (formation adjustments allowed)

**Key Gameplay Changes:**
- No polling; match results fetch on-demand per turn
- Cumulative scoring; points carry forward across all turns
- Flexible roster updates; users control timing between turns (no timers)
- Round-based progression; 7 sequential turns (Group Stage 1 → Final)
- Historical data; all results based on 2022 World Cup public records

---

### Documentation & Cleanup

**After Phase 3 complete:**
- [ ] Delete `docs/2022revision-notes.md` (all content migrated)
- [ ] Verify `src/services/SERVICES_ARCHITECTURE.md` reflects turn-based model
- [ ] Update `docs/roster-logic-rebuild.md` if discrepancies found

---

## Phase 4 — Auth / Database Integration

// ====== Goal: Allow users to save their fantasy teams. =====

1. Decide MVP approach:
   - Firebase Auth (fast, serverless) or
   - SQL (PostgreSQL / Supabase) for custom auth

2. Connect database:
   - Save user-selected lineups
   - Store historical performance / match updates

3. Secure API routes for CRUD operations:
   - Save team
   - Fetch team
   - Update / delete lineup

---

## Phase 5 — Final UI Polish

// ====== Goal: Clean and shiny. =====

1. Styling

2. Responsive design for dashboard + lineup panel

3. Error handling + empty states + loaders

4. Wireframe alignment check (ensure your initial plan matches implementation)

---

## Phase 6 — Documentation / README / Notes

// ====== Goal: Make your project self-explanatory. =====

1. Update README.md with:
   - Final Tech stack
   - Screenshots
   - How To Use/Recreate (KEEP IT SIMPLE - direct to design notes)

2. Make sure docs/design-notes.md is updated:
   - Architecture diagrams
   - Mock data notes
   - TODO notes for next phases