# Plan: Small Roster Edits to Align with Gameplay Revision

## Context

Upon test API call for specific data, undisclosed paywalls were discovered making 2026 data unavailable. 
New Gameplay will be turn-based rather than realtime with weekly reset, requiring a few updates to logic and scoring.

---

## Design

### 1. Type System

**File**: `/src/types/match.ts`

**Final model** (pool + role separation — **semantically distinct**, plus R16+ dynamics):
```typescript
type RosterPool = "available" | "unsigned" | "signed" | "eliminated"
type RosterRole = "starter" | "bench" | "eliminatedSigned" | null

// Pool: WHERE the member is in the pipeline
// Role: HOW they function (only meaningful when signed/eliminated)

// RosterSquad extends:
{
  pool: RosterPool;          // available | unsigned (staging) | signed (roster) | eliminated
  role: RosterRole;          // null (for available/unsigned) | "starter" (for signed) | "eliminatedSigned"
  isEliminated: boolean;     // Parallel flag: true if tournament-eliminated
}

// RosterPlayer extends:
{
  pool: RosterPool;          // available | unsigned | signed (roster) | eliminated
  role: RosterRole;          // null (for available/unsigned) | "starter" | "bench" | "eliminatedSigned"
  isEliminated: boolean;     // Parallel flag: true if tournament-eliminated
}

// Role mapping by pool (final):
// pool: "available"  → role: null (unselected, no role yet)
// pool: "unsigned"   → role: null (staging, awaiting sign confirmation)
// pool: "signed"     → role: "starter" (squads always; players in formation, scoring)
//                   OR role: "bench" (players in roster, not in formation, no scoring)
// pool: "eliminated" → role: "eliminatedSigned" (historical: was signed, then eliminated)
```

**Key principle**: Pool and Role are distinct. Pool describes membership state; Role describes function. Role is only meaningful for signed/eliminated pools.

---

### 2. Redux State
**File**: `/src/store/slices/rosterSlice.ts`

(filtered by pool property):
```typescript
players: {
  available: RosterPlayer[];        // pool: "available" (may have isEliminated: true)
  unsigned: RosterPlayer[];         // pool: "unsigned" (removed from available, not yet signed)
  signed: RosterPlayer[];           // pool: "signed" (in roster; role: "starter" | "bench")
  eliminated: RosterPlayer[];       // pool: "eliminated" (removed from signed; role: "eliminatedSigned")
}

squads: {
  available: RosterSquad[];         // pool: "available" (may have isEliminated: true)
  unsigned: RosterSquad[];          // pool: "unsigned" (staging bench, awaiting sign confirmation)
  signed: RosterSquad[];            // pool: "signed" (locked to roster; role: ALWAYS "starter", capped at 4)
  eliminated: RosterSquad[];        // pool: "eliminated" (removed from signed during tournament)
}
```
---

### 3. State Machine & Transitions

**State Machine Notes:**
- **role: null** — Member has no functional role (available/unsigned pools): unselected or awaiting sign confirmation. No visual badge.

- **role: "starter"** — Member is in starting formation and scoring (pool: signed only). Visual: ⚽ starter badge on card.
  - Squads: auto-assigned "starter" when signed (all 4 signed squads are starters)
  - Players: user-assigned when dragged to formation grid (max 11, max 1 GK, before QF lock)

- **role: "bench"** — Member is in roster but NOT in starting formation, no scoring (pool: signed only). Visual: no badge.

- **role: "eliminatedSigned"** — Member was signed, then eliminated during tournament (pool: eliminated only). Visual: "eliminatedSigned" badge for historical record.

- **Scoring multiplier**: If `substitute === true`, all points earned × 0.5 for entire tournament (see rules.md Section 4 for substitute window mechanics)

- Role is ONLY meaningful when pool is "signed" or "eliminated"; check pool first before checking role
- **Visual indicators**: ⚽ = "starter" (scoring), no badge = "bench" (no scoring)

**Lock States** (new):
- **Roster Lock** (activates at Quarterfinals "Play" click):
  - ❌ Cannot add/remove players from roster (pool changes frozen)
  - ❌ Cannot add/remove squads
  - ✅ CAN move players between bench ↔ starter (tactical flexibility remains)
  - Applies through Final

- **Minimum Requirements** (only before Roster Lock):
  - Before QF "Play": Must have 4 signed squads + 11 starters to proceed
  - After QF "Play": No minimums enforced (eliminations naturally degrade roster)

**Squad state machine**:
```
┌─────────────────────────────────┐
│  AVAILABLE                      │
│  pool: "available"              │
│  role: null                     │
│  isEliminated: T/F              │  ← Can initialize with isEliminated: true
└─────────────────────────────────┘
  │
  ├─ (non-eliminated only, click/drag) → moveSquadToUnsigned()
  │
  └─ [if already signed] → moveSquadToEliminated() [tournament progression]

┌─────────────────────────────────────────────┐
│  UNSIGNED (Staging Bench)                   │
│  pool: "unsigned"                           │
│  role: undefined                            │
│  isEliminated: always false                 │
│  No limit on quantity                       │
└─────────────────────────────────────────────┘
  │
  ├─ (Remove button) → moveSquadToAvailable() [back to available pool]
  │
  └─ (Sign button → confirm dialog) → moveSquadToSigned() [locks to roster]
         ⚠️ Confirmation popup: "By signing this squad, you commit to this team
            for the duration of the tournament. You cannot change this selection
            until the tournament ends."
         [Cancel] or [Confirm Signing]

┌──────────────────────────────────────────┐
│  SIGNED (Roster)                         │
│  pool: "signed"                          │
│  role: ALWAYS "starter" (automatic)      │
│  Capped at 4 signed-active squads        │
│  isEliminated: always false              │
└──────────────────────────────────────────┘
  │
  └─ (tournament) → moveSquadToEliminated()
         ↓ If 4-squad cap is full and user tries to sign another:
           Show popup: "Squad cap reached. Consider adding this Squad
                       if one of your current selections is eliminated
                       in tournament play"

┌─────────────────────────────────────┐
│  ELIMINATED (Signed-Eliminated)     │
│  pool: "eliminated"                 │
│  role: "eliminatedSigned" (tracked) │
│  Remains visible in Roster, below   │
│  the Bench section                  │
└─────────────────────────────────────┘
```

**Player state machine**:
```
┌─────────────────────┐
│  AVAILABLE          │
│  pool: "available"  │
│  role: undefined    │
│  isEliminated: T/F  │  ← Can initialize with isEliminated: true
└─────────────────────┘
  │
  ├─ (non-eliminated only) → movePlayerToUnsigned() [optional staging]
  │
  └─ [if already signed] → movePlayerToEliminated() [during tournament]

┌──────────────────────────┐
│  UNSIGNED     │
│  pool: "unsigned"        │
│  role: undefined         │
│  isEliminated: always F  │
└──────────────────────────┘
  │
  ├─ → movePlayerToAvailable() [deselect]
  │
  └─ → movePlayerToSigned() [confirms selection, role: default "bench"]

┌────────────────────────────────┐
│  SIGNED (Roster)               │
│  pool: "signed"                │
│  role: "bench" (default)       │  ← Can drag into formation if <11 starters
│  Min 11, Max 18 roster players │
└────────────────────────────────┘
  │
  ├─ movePlayerToStarter() [role changes to "starter", requires <11 starters]
  │
  ├─ movePlayerToAvailable() [deselect from roster]
  │
  └─ movePlayerToEliminated() [tournament elimination]

┌────────────────────────────────┐
│  SIGNED + STARTER              │
│  pool: "signed"                │
│  role: "starter"               │  ← In 11-person formation
│  Max 11 starters               │
└────────────────────────────────┘
  │
  ├─ movePlayerToBench() [role changes to "bench", remove from formation]
  │
  └─ movePlayerToEliminated() [tournament elimination]

┌────────────────────────────────────┐
│  ELIMINATED                        │
│  pool: "eliminated"                │
│  role: "eliminatedSigned"          │ ← Tracks they were signed before elimination
│  Visible in Roster's Eliminated    │
│  section, below Bench              │
└────────────────────────────────────┘
```

---

### 4. Reducer Actions

**File**: `/src/store/slices/rosterSlice.ts`

(13 reducers):
- **Squad transitions:**
  - `moveSquadToUnsigned` (available → unsigned, staging bench)
  - `moveSquadToAvailable` (unsigned → available, removal)
  - `moveSquadToSigned` (unsigned → signed with confirmation, auto-assigns role: "starter", validates 4-squad cap, also continues to display on the ROSTER with icon to denote starter)
  - `moveSquadToEliminated` (signed → eliminated, exclusive to Squad - Players have their own separate elimination logic)

- **Player transitions:**
  - `movePlayerToUnsigned` (available → unsigned, staging bench)
  - `movePlayerToAvailable` (unsigned → available, removal)
  - `movePlayerToSigned` (unsigned → signed, role: "bench" default, validates at <18, Goalkeeper cap at <3)
  - `movePlayerToStarter` (signed with role "bench" → signed with role "starter", validates <11 starters including up to <1 Goalkeeper but not required and no other position restrictions, also continues to display on the ROSTER with icon to denote starter)
  - `movePlayerToBench` (signed with role "starter" → signed with role "bench", starter icon removed)
  - `movePlayerToEliminated` (signed → eliminated, role becomes "eliminatedSigned", player National Team elimination data pulls exclusively, distinct from Squads)

- **Other:**
  - `initializeRoster` (respects isEliminated from JSON, initializes all pools, sets substitute flag for R16+ signings)
  - `setRoundLocked` (unchanged)
  - `validateSquadCapacity` (helper: checks if signed squad count < 4)
  - `calculateSubstitutePoints` (scoring: if substitute === true, multiply all earned points by 0.5)

---

### 5. Type

**Files**: **`/src/types/match.ts`**:
   ```typescript
   export type RosterPool = "available" | "unsigned" | "signed" | "eliminated";
   export type RosterRole = "starter" | "bench" | "eliminatedSigned" | null;

   export interface RosterSquad {
     type: "squad";
     id: number;
     teamId: number;
     pool: RosterPool;                    // available | unsigned (staging) | signed (roster) | eliminated
     role: RosterRole;                    // Mapping:
                                          // - null when pool: "available" or "unsigned"
                                          // - "starter" when pool: "signed" and scoring
                                          // - "eliminatedSigned" when pool: "eliminated"
     isEliminated: boolean;               // Parallel flag: true if tournament-eliminated
     substitute: boolean;                 // Signed following R16. Scores at 50% for entire tournament
     name: string;
     countryCode: string;                 // Country code (API format: NET, JAP, SER, etc.)
     flag: string;
     matchPoints: Record<string, number>; // Points by game/week
     totalPoints: number;                 // All points (respects substitute 50% multiplier)
     coaches?: Coach[];
     officialRoster?: RosterPlayer[];
     squadGames?: Game[];                 // Games scheduled for this squad with isComplete flag
   }

   export interface RosterPlayer {
     type: "player";
     id: number;
     playerId: number;
     pool: RosterPool;                    // available | unsigned | signed (roster) | eliminated
     role: RosterRole;                    // Mapping:
                                          // - null when pool: "available" or "unsigned" (no role)
                                          // - "starter" when pool: "signed", in formation, scoring
                                          // - "bench" when pool: "signed", in roster, no scoring
                                          // - "eliminatedSigned" when pool: "eliminated" (historical)
     isEliminated: boolean;               // Parallel flag: true if tournament-eliminated
     substitute: boolean;                 // Signed folowing R16. Scores at 50% for entire tournament
     name: string;
     position: "Goalkeeper" | "Midfielder" | "Defender" | "Attacker";
     number: number;
     teamId: number;
     countryCode: string;                 // Country code (API format: NET, JAP, SER, etc.)
     flag: string;
     matchPoints: Record<string, number>; // Points by game/week
     totalPoints: number;                 // All points (respects substitute 50% multiplier)
     injury?: PlayerInjury;
     eliminatedReason?: PlayerEliminationReason;
     playerGames?: Game[];                // Games scheduled for this player with isComplete flag
   }
   ```

---

### 6. App.tsx Initialization

**File**: `/src/App.tsx`

**Architecture**: Three separate datasets:
1. **National Teams** (source of truth, `nationTeamsSlice`) — All 32 teams from JSON
2. **Roster Squads** (user selections, `rosterSlice.squads`) — User's selected squads (max 4)
3. **Roster Players** (user selections, `rosterSlice.players`) — User's selected players (18 total)

Squads and Players are functionally separate except for:
- Elimination cascade (when national team is eliminated)
- Clean sheet bonuses
- Similar team-based game mechanics

**Implementation** (Phase 3.2 complete):

```typescript
const allNationalTeams = mockSquadsData.teams || [];

// Initialize players from all national teams roster data
// Players are functionally separate from Squads (which are user selections)
const rosterPlayers: RosterPlayer[] = allNationalTeams.flatMap((nationalTeam: any) =>
  (nationalTeam.players || []).map((p: any) => ({
    type: "player" as const,
    playerId: p.playerId,
    pool: p.isEliminated ? "eliminated" : "available" as const,
    role: p.isEliminated ? "eliminatedSigned" : null,
    isEliminated: p.isEliminated || false,
    name: p.playerName,
    position: p.position,
    number: p.number,
    teamId: nationalTeam.teamId,
    code: nationalTeam.countryCode,
    flag: nationalTeam.flag,
    matchPoints: {},
    totalPoints: 0,
    substitute: false,
    playerGames: [],
    injury: { status: "none", likelyUnavailable: false },
  }))
);

// Initialize national teams as source of truth for elimination status
// These are NOT roster selections yet - just the tournament data
const nationTeamsSquads: RosterSquad[] = allNationalTeams.map((nationalTeam: any) => ({
  type: "squad" as const,
  id: nationalTeam.teamId,
  teamId: nationalTeam.teamId,
  pool: "available" as const,
  role: null,
  isEliminated: nationalTeam.isEliminated || false,
  rosterElimination: nationalTeam.isEliminated ? "resolved" : null,
  name: nationalTeam.teamName,
  code: nationalTeam.countryCode,
  flag: nationalTeam.flag,
  matchPoints: {},
  totalPoints: 0,
  substitute: false,
  squadGames: [],
  coaches: nationalTeam.coaches,
}));

// Load match data and initialize national teams (source of truth for elimination cascade)
dispatch(setMatches(mockMatches as Match[]))
dispatch(initializeNationTeams(nationTeamsSquads))

// Initialize empty roster (user will select squads and players from available pools)
dispatch(initializeRoster({ players: rosterPlayers, squads: [] }))
```

**Key changes from interim guidance**:
- ✅ Removed `officialRoster` field from RosterSquad type — will be added back when implementing database state persistence
- ✅ Use actual field names from squads.json: `teamName`, `countryCode`, `playerName` (not generic `name`, `code`, etc.)
- ✅ Both squads and players default to `isEliminated: false` on initial load
- ✅ Pre-eliminated players initialize in `"eliminated"` pool with role `"eliminatedSigned"`
- ✅ `nationTeamsSquads` is NOT a duplicate — it's the 32-team source of truth (different from empty `rosterSlice.squads`)
- ✅ `rosterSlice.squads` initializes empty, populated only as user selects squads

---

### 7. Component Updates

**Left Panel — Players & Squads Selection:**

- **AvailableSquadsList.tsx**:
  - Display: squads with `pool === "available"` (active first, eliminated greyed out at bottom)
  - Add/Sign buttons **disabled when `isRosterLocked === true`**
  - Eliminated squads: disabled, no actions

- **AvailablePlayersList.tsx**:
  - Display: players with `pool === "available"` (active first, eliminated greyed out)
  - Add to Roster button **disabled when `isRosterLocked === true`**
  - Eliminated players: disabled, no actions

**Right Panel — ROSTER (Current Team):**

- **SignedSquadsSection.tsx**:
  - Display: squads with `pool === "signed"` (all have role: "starter", capped at 4)
  - Remove/Deselect button **disabled when `isRosterLocked === true`**
  - Shows ⚽ starter badge always
  - Confirmation popup on sign (commitment for duration)

- **RosterPlayersBench.tsx**:
  - Display: players with `pool === "signed" && role === "bench"`
  - "Add to Roster" button **disabled when `isRosterLocked === true`**
  - "Remove from Roster" button **disabled when `isRosterLocked === true`**
  - "Move to Starter" button **always enabled** (no lock on formation adjustments)
  - Constraints shown: "Roster (X/18)" + "GK (X/3)"

- **StartersLineup.tsx**:
  - Display: players with `pool === "signed" && role === "starter"`
  - **Before QF Lock**: Fixed 11-slot grid with empty placeholders for unfilled slots
  - **After QF Lock**: Dynamic grid showing only filled slots (no empty placeholders)
  - Drag to Bench button **always enabled** (no lock on formation adjustments)
  - "Move to Bench" button **always enabled**
  - Shows ⚽ starter badge always

- **EliminatedSquadsSection.tsx**:
  - Display: squads with `pool === "eliminated"` (role: "eliminatedSigned")
  - Informational only, no actions
  - Greyed out, shows elimination history

- **EliminatedPlayersSection.tsx**:
  - Display: players with `pool === "eliminated"` (role: "eliminatedSigned")
  - Informational only, no actions
  - Greyed out, shows elimination history

**Lock-Aware UI Summary**:
| Action | Before QF Lock | After QF Lock |
|--------|--------------|---------------|
| Add player to roster | ✅ Enabled | ❌ Disabled |
| Add squad to roster | ✅ Enabled | ❌ Disabled |
| Remove player from roster | ✅ Enabled | ❌ Disabled |
| Remove squad from roster | ✅ Enabled | ❌ Disabled |
| Move player to starter | ✅ Enabled | ✅ Enabled |
| Move player to bench | ✅ Enabled | ✅ Enabled |
| Formation grid style | 11 fixed slots | Dynamic (filled only) |

---

### 8. Selector Updates

**File**: `/src/store/selectors/scoringSelectors.ts`

Update selectors to use new pool/role model:
```typescript
// ===== LOCK STATE SELECTOR =====
selectIsRosterLocked = (state) => state.roster.isRosterLocked
  // true when user clicks "Play" for Quarterfinals (roster locked through end)
  // false before QF Play click (roster editable)

// ===== SQUAD SELECTORS =====
selectAvailableSquads = squads.filter(s => s.pool === "available" && !s.isEliminated)  // role: null
selectEliminatedAvailableSquads = squads.filter(s => s.pool === "available" && s.isEliminated)  // role: null
selectUnsignedSquads = squads.filter(s => s.pool === "unsigned")  // role: null (staging)
selectSignedSquads = squads.filter(s => s.pool === "signed")  // All have role: "starter" (capped at 4)
selectEliminatedSquads = squads.filter(s => s.pool === "eliminated")  // role: "eliminatedSigned"
selectRemainingSquadSlots = 4 - selectSignedSquads.length

// ===== PLAYER SELECTORS =====
selectAvailablePlayers = players.filter(p => p.pool === "available" && !p.isEliminated)  // role: null
selectEliminatedAvailablePlayers = players.filter(p => p.pool === "available" && p.isEliminated)  // role: null
selectUnsignedPlayers = players.filter(p => p.pool === "unsigned")  // role: null (staging)
selectSignedPlayers = players.filter(p => p.pool === "signed")  // All roster members (role: "starter" or "bench")
selectStarterPlayers = players.filter(p => p.pool === "signed" && p.role === "starter")  // In formation
selectBenchPlayers = players.filter(p => p.pool === "signed" && p.role === "bench")  // In roster, not formation
selectEliminatedPlayers = players.filter(p => p.pool === "eliminated")  // role: "eliminatedSigned"
selectRemainingStarterSlots = 11 - selectStarterPlayers.length  // Useful before QF lock
selectRemainingRosterSlots = 18 - selectSignedPlayers.length

// ===== SCORING RULE =====
// See rules.md for complete scoring rules (Section 8: Player Scoring, Section 7: Squad Scoring)
canScorePoints = (member: RosterSquad | RosterPlayer) => member.role === "starter"
  // Only starters score. Role: "starter" implies pool: "signed", so no need to check pool.
```

---

### 9. CRITICAL: Starters Formation Grid (Empty Slots)

**Before Quarterfinals Lock** (enforced 11-starter requirement):
```typescript
// StartersLineup should render fixed 11-slot grid:
const totalStarterSlots = 11;
const filledSlots = selectStarterPlayers;  // pool: "signed" && role: "starter"
const emptySlotCount = totalStarterSlots - filledSlots.length;

// Render all 11 positions:
{/* Filled slots with player cards (draggable out) */}
{filledSlots.map(player => <PlayerCard key={player.id} player={player} />)}

{/* Empty slots (draggable targets from bench) */}
{Array.from({ length: emptySlotCount }).map((_, idx) => (
  <EmptySlot key={`empty-${idx}`} onDropPlayer={movePlayerToStarter} />
))}
```

**After Quarterfinals Lock** (no minimum, grid adjusts dynamically):
```typescript
// StartersLineup shows only filled slots (no empty placeholders):
const filledSlots = selectStarterPlayers;  // pool: "signed" && role: "starter"

// Render only filled positions:
{filledSlots.map(player => <PlayerCard key={player.id} player={player} />)}

// Can still drag between bench ↔ starter, but no UI pressure to fill 11
```

**Why this matters**:
- **Early game (pre-QF)**: Fixed 11-slot grid gives visual feedback of formation completeness; users see what they need to fill
- **Late game (post-QF)**: Dynamic grid reflects reality of eliminations; users can see actual formation without "empty slot guilt"
- **Always**: Users can drag players between bench ↔ starter freely (no lock on formation adjustments)
- Drag-and-drop is intuitive: drop to empty slot (early game) or directly swap with bench player (late game)

---

### 10. Validation Rules

**File**: `/src/services/rosterService.ts`

Validation logic to match new pool/role state model:

```typescript
// ===== ROSTER LOCK STATE =====
// See rules.md Section 3-4 for lock state rules
isRosterLocked = false  // Set to true when user clicks "Play" for Quarterfinals
  // When true: no add/remove players or squads allowed
  // When true: can still move players between bench ↔ starter (tactical flexibility)

// ===== SQUAD VALIDATION =====
// See rules.md Section 3: Minimum Roster Requirements
canAddSquadToUnsigned = (squad: RosterSquad) =>
  !squad.isEliminated &&
  squad.pool === "available" &&
  !isRosterLocked

canSignSquad = () => selectSignedSquads.length < 4 && !isRosterLocked

// Minimum requirement: 4 signed squads required before QF "Play" (see rules.md Section 2)
validateSignedSquadCount = () => {
  if (currentTurn < "Quarterfinals") {
    return selectSignedSquads.length === 4  // Required to play earlier rounds
  }
  return true  // No minimum after roster lock
}

// ===== PLAYER VALIDATION (ROSTER ADDITIONS) =====
// See rules.md Section 3-4 for roster composition rules
// Only allowed when roster is NOT locked
canAddPlayerToRoster = (player: RosterPlayer) =>
  !player.isEliminated &&
  player.pool === "available" &&
  selectSignedPlayers.length < 18 &&
  (player.position !== "GK" || selectSignedPlayers.filter(p => p.position === "GK").length < 3) &&
  !isRosterLocked

canRemovePlayerFromRoster = (player: RosterPlayer) =>
  player.pool === "signed" &&
  !isRosterLocked

// ===== PLAYER VALIDATION (STARTER ADJUSTMENTS) =====
// NO LOCK required - players can adjust formation through entire tournament
// See rules.md Section 5: STARTER Availability for slot limits
canPromoteToStarter = (player: RosterPlayer) => {
  // Before QF: enforce 11-starter limit
  if (currentTurn < "Quarterfinals") {
    return selectStarterPlayers.length < 11 &&
           (player.position !== "GK" || selectStarterPlayers.filter(p => p.position === "GK").length < 1)
  }
  // After QF: no limits, just fill available slots
  return player.pool === "signed" && player.role === "bench"
}

canPromoteToBench = (player: RosterPlayer) =>
  player.pool === "signed" && player.role === "starter"
  // Always allowed, no lock

// ===== ROSTER COMPOSITION VALIDATION =====
// See rules.md Section 3: Minimum Roster Requirements
validateRosterCount = () => {
  if (currentTurn < "Quarterfinals") {
    return selectSignedPlayers.length >= 11 && selectSignedPlayers.length <= 18
  }
  return true  // No limits after roster lock
}

validateRosterPositions = () => {
  const gkCount = selectSignedPlayers.filter(p => p.position === "GK").length
  return gkCount <= 3  // Max 3 GK, no GK requirement
}

// ===== STARTER COMPOSITION VALIDATION =====
// See rules.md Section 1: Initial Setup & Section 3: Minimum Requirements
validateStarterCount = () => {
  if (currentTurn < "Quarterfinals") {
    return selectStarterPlayers.length === 11  // Required to start tournament
  }
  return true  // No minimum after roster lock (naturally degraded by eliminations)
}

validateStarterPositions = () => {
  const gkCount = selectStarterPlayers.filter(p => p.position === "GK").length
  return gkCount <= 1  // Max 1 GK in starters, GK not required
}

// ===== ELIMINATION LOGIC =====
// Squad elimination: exclusive to squads (separate from player elimination)
// Triggered when National Team is eliminated
canEliminateSquad = (squad: RosterSquad) => squad.pool === "signed" && squad.isEliminated === false
moveSquadToEliminated = (squad: RosterSquad) => {
  // Updates squad.pool to "eliminated" and role to "eliminatedSigned"
  // Does NOT automatically eliminate players on that squad
  // Triggered by National Team elimination, independent of Player elimination
}

// Player elimination: based on national team status
// Triggered when National Team is eliminated OR player has individual incident (red card, injury)
canEliminatePlayer = (player: RosterPlayer) =>
  player.pool === "signed" &&
  player.isEliminated === true

movePlayerToEliminated = (player: RosterPlayer) => {
  // Updates player.pool to "eliminated" and role to "eliminatedSigned"
  // Triggered when player.isEliminated becomes true during tournament
  // Independent of squad elimination status
  // Independent of isRosterLocked (eliminations bypass roster lock)
}

// ===== SUBSTITUTE WINDOW (50% POINTS) =====
// Window: Between R16 "Play" click and Quarterfinals "Play" click
canSignNewMember = (tournament: Tournament) =>
  !isRosterLocked  // Can sign until QF "Play" click locks roster

markAsSubstitute = (tournament: Tournament): boolean =>
  tournament.currentTurn === "R16" &&
  !isRosterLocked
  // Only members signed after R16 "Play" (in substitute window) get substitute flag
  // Substitute window closes when QF "Play" is clicked

applySubstituteMultiplier = (points: number, substitute: boolean): number =>
  substitute ? points * 0.5 : points
  // All points × 0.5 for substitute members throughout entire tournament (from QF onward)
```

---

## 11. Turn Completion Async Thunk (Phase 3 API Integration)

**File**: `/src/store/thunks/rosterThunks.ts` (new) or `/src/store/slices/rosterSlice.ts`

> **Current branch note (May 2026):**
> **Squad** turn scores are computed for **signed** squads from match scorelines on **Play** (mock or API). **Starter** player scores require **match events** (goals, cards, etc.) from API call.
>
> **Fixture vs roster team ids:** Always follow **`docs/DATA_IDENTIFIERS.md`** — schedule rows are normalized so `Match.homeTeam.id` / `awayTeam.id` equal national **`teamId`** from `squads.json`.

**Purpose**: When user clicks "Play", execute turn completion sequence in strict order:
1. Fetch match results from API
2. Update all scores (Scoring Record displayed first)
3. Lock turn scores
4. Update eliminated status (cascade from National Team)
5. Show elimination popup
6. Move eliminated members to eliminated pool

**Implementation** (async thunk with redux-thunk):

```typescript
export const playTurn = (turnId: string) => async (dispatch, getState) => {
  try {
    // Step 0: Fetch match results from API (happens first, outside Redux)
    const matchResults = await getMatchResults(turnId); // services/apiFootball.ts

    // Step 1: Update all scores (Scoring Record component displays immediately)
    dispatch(updateScores(matchResults));

    // Step 2: Lock turn scores (points are now final for this turn)
    dispatch(lockTurnScores(turnId));

    // Step 3: Update eliminated status based on National Team eliminations
    // - Cascade: National Team eliminated → Squad marked eliminated
    // - Cascade: National Team eliminated → All its Players marked eliminated
    // - Independent: Individual Player incidents (red card, injury) mark that Player eliminated
    dispatch(updateEliminationStatus(matchResults));

    // Step 4: Show elimination popup with squads and players eliminated this turn
    const eliminatedThisTurn = getState().roster.justEliminated;
    if (eliminatedThisTurn.squads.length > 0 || eliminatedThisTurn.players.length > 0) {
      dispatch(showEliminationModal(eliminatedThisTurn));
    }

    // Step 5: Move all eliminated members to eliminated pool
    dispatch(moveEliminatedToPool());

    // Step 6: Advance turn counter (ready for roster edits before next Play click)
    dispatch(advanceTurn());

  } catch (error) {
    dispatch(handlePlayTurnError(error));
  }
}
```

**User Experience Flow**:
1. User clicks "Play" button
2. Loading state shown (API call in progress)
3. API returns results
4. Scoring Record updates immediately (Step 1)
5. Points locked (Step 2)
6. Elimination status calculated (Step 3)
7. Popup shows who was eliminated (Step 4 - user must acknowledge)
8. Eliminated members moved out of roster (Step 5)

---

## 12. Scoring Calculation (Phase 3.6)

**⚠️ Single Source of Truth**: Detailed scoring rules, formulas, and calculation logic documented in:
- `/docs/rules/rules.md` — Complete scoring formulas (Section 7-8)
- `/src/lib/scoring/` — Implementation with JSDoc (see individual scoring function files)
- `/src/store/thunks/rosterThunks.ts` — Integration into turn completion flow

**Architecture Overview**:
- Stats extracted from match events → Position-based point formulas → Turn aggregation → Redux persistence
- **Stateless & Deterministic**: Calculated on-demand per "Play" click, not continuous
- **Substitution Rule**: 50% multiplier for R16+ signups, persists through tournament

**High-Level Flow**:
```
playTurn() thunk → getMatchResults(turnId)
  → merge schedule → normalizeMatchesNationalTeamIds (see docs/DATA_IDENTIFIERS.md)
  → extractPlayerMatchStats() from events
  → calculatePlayerScore() & calculateSquadScore()
  → calculateTurnScore() aggregation
  → storeTurnScores() to Redux
```

For complete details on point values, card penalties, clean sheet bonuses, and MVP determination:
→ See `/docs/rules/rules.md` Section 7 (Squad) & Section 8 (Player)
9. Turn advances, user can now edit roster for next turn

**Critical Ordering Notes**:
- Step 1 (updateScores) must be first so Scoring Record displays immediately
- Step 2 (lockScores) must be before Step 3 so points don't change during elimination processing
- Step 3 (updateEliminationStatus) must be before Step 4 so modal knows who to show
- Step 4 (showEliminationModal) may require user acknowledgment before Step 5 (x to close)
- Step 5 (moveToEliminated) must happen after modal dismissed to avoid UI thrashing

---

## 12. Database Persistence & Game State Restoration (Phase 4+)

**Context**: Game state initializes fresh from **`squads.json`** (national teams embed **players** per nation—there is no separate `players.json` in this repo). When Phase 4 (Auth/Database) is implemented, the app will need to restore saved game state mid-tournament.

### Game State to Persist

When a user saves/closes a game, the following must be stored in the database:

**Roster State**:
- All players: `pool`, `role`, `isEliminated`, `substitute`, `matchPoints`, `totalPoints`
- All squads: `pool`, `role`, `isEliminated`, `substitute`, `matchPoints`, `totalPoints`
- Current roster counts (signed, starters, bench, eliminated)
- `isRosterLocked` flag (true if QF "Play" has been clicked)

**Tournament State**:
- Current round/turn (e.g., "Group Stage 1", "R16", "Quarterfinals")
- Current week/day within turn (if sub-turn granularity needed)
- List of matches played (marked `isComplete`)
- List of matches remaining

**Scoring State**:
- Cumulative points per turn (turn-by-turn breakdown)
- Running total (all turns combined)
- Individual match points by player/squad
- Scoring Record history (all completed turns)

**UI State** (optional but helpful):
- Sidebar visibility toggle state
- Current page/view (Schedule, Roster, Match Play)
- Modal state if interrupted mid-action

### Initialization on Reload (Future)

When a user returns to a saved game:

1. **Load user data** from database (not JSON)
2. **Restore all pools** with correct `pool` and `role` values
3. **Restore elimination status** (`isEliminated` for squads/players/individuals)
4. **Restore scoring** (all `matchPoints`, `totalPoints`, `substitute` flags)
5. **Restore lock state** (`isRosterLocked` flag)
6. **Resume from last turn** (show Schedule for current turn, not Group Stage 1)
7. **Preserve match history** (Finished matches remain visible)

### Key Differences from Fresh Init

| Aspect | Fresh Init (Current) | Resumed Game (Future) |
|--------|---------------------|----------------------|
| Data source | `squads.json` (teams + nested players) | Database (user doc) |
| Elimination status | From JSON `status` field | From saved `isEliminated` flag |
| Player pool | All available (except pre-eliminated) | Restore exact pool/role state |
| Squad pool | All available | Restore exact pool/role state |
| Scoring | Empty (`matchPoints: {}`) | Restore all historical points |
| Tournament round | Always Group Stage 1 | Resume from saved round |
| Roster assignments | None (user starts fresh) | Restore exact selections + lock state |
| Formation | None (empty grid) | Restore starters/bench assignments |

### Implementation Notes for Phase 4

- **Do NOT modify current App.tsx initialization** — keep JSON-based init for local games / dev
- **Create separate initialization flow** for database-loaded games:
  - `initializeFromJSON()` (current) — for fresh games
  - `initializeFromDatabase()` (new) — for resumed games
- **Use Redux dispatch** to populate store from database snapshot
- **Validate persisted state before restoring**:
  - Check pool/role transitions are valid
  - Verify no data corruption
  - Ensure isRosterLocked makes sense with current turn
- **Handle version migration** — if game logic changes between sessions, may need to re-normalize old saves
- **Determine storage key** — use userId + gameId or similar to support multiple games per user

### Critical for Phase 4: isRosterLocked Persistence

- `isRosterLocked` must be persisted in database
- On reload, if `isRosterLocked === true`:
  - Disable all "add/remove" buttons in roster UI
  - Enable all "move to starter/bench" buttons
  - Update StartersLineup grid style to dynamic (filled slots only)
- If `isRosterLocked === false`:
  - All roster edit buttons enabled
  - StartersLineup grid shows 11 fixed slots with empty placeholders

---

