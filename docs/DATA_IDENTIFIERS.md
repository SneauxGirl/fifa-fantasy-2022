# Data identifiers & ID protocol

This document is the **canonical reference** for how national teams, players, and fixtures are identified in code and data. Following it prevents drift (e.g. comparing API fixture “team id” to roster `teamId` and getting false negatives).

---

## 1. National teams (squads in the tournament)

| Concept | Field | Authority | Usage |
|--------|--------|-----------|--------|
| **Canonical national team id** | `teamId` on `NationalTeam`, and `teamId` / `id` on `RosterSquad` | `squads.json` → `nationTeams` slice | Primary key for “this nation” everywhere **after normalization**. |
| **Human / API shorthand** | `countryCode` (e.g. `WAL`, `QAT`) | Same sources | Stable **secondary** key for labels, flags lookup, grouping, bracket resolution. Use for display and fallbacks when id mapping is missing. |
| **Fixture-side team id** | `Match.homeTeam.id`, `Match.awayTeam.id` | Originally from API-Football or `matches.json` | **Must equal** canonical `teamId` for that `countryCode` after normalization (see §4). Do **not** assume raw fixture ids match roster ids. |

**Rule:** Any logic that answers “is this match relevant to my roster squad?” should compare **`match.*Team.id` to `rosterSquad.teamId`** (or equivalent), **not** names and not mixing raw fixture ids with roster ids without normalization.

---

## 2. Players

| Concept | Field | Authority | Usage |
|--------|--------|-----------|--------|
| **Canonical player id** | `playerId` (number when known) | API-Football / `squads.json` national player rows | Primary key for scoring rows (`PlayerScore.playerId`), events, and roster matching. |
| **Display** | `name`, `number`, `countryCode` | Roster / national roster | UI only; **never** use name as the sole join key for stats or scores. |

**Rule:** Prefer numeric `playerId` for equality checks. String or sentinel values (`"missing"`, `null`) mean “no reliable API id”; scoring and event joins should skip or handle explicitly (see `playTurn` in `rosterThunks.ts`).

---

## 3. Matches

| Concept | Field | Usage |
|--------|--------|--------|
| **Fixture id** | `Match.id` | Stable schedule key across turns; used in `turnScores` per-match rows (`matchId` on `SquadScore` / `PlayerScore`). |
| **Teams on the fixture** | `homeTeam`, `awayTeam` each `{ id, countryCode, name }` | After normalization, `id` is national `teamId`; `countryCode` stays the FIFA-style code. |

---

## 4. Normalization pipeline (single national id on fixtures)

**Module:** `src/lib/normalizeMatchNationalTeamIds.ts`

**Function:** `normalizeMatchesNationalTeamIds(matches, nationalTeams)`  
Rewrites each match’s `homeTeam.id` / `awayTeam.id` using `nationalTeams[].teamId` keyed by `countryCode`. Event rows are updated when team ids can be tied to home/away.

**Call sites (must stay in sync when adding new match ingress paths):**

1. **`App.tsx`** — After resolving `initialMatches` (mock or live schedule), **before** `setMatches`, using the same `allNationalTeams` used for roster bootstrap.
2. **`restartMatchPlay`** (`matchPlayThunks.ts`) — Before `setMatches`, using baseline national teams from `squads.json`.
3. **`playTurn`** (`rosterThunks.ts`) — After `mergePlayedTurnIntoSchedule`, **before** `setMatches`, `advanceTurnSimulation`, and GS2 replaceable flags, using `state.nationTeams.teams`.

**Live API note:** `normalizeMatch()` in `apiFootball.ts` still reads API `teams.home.id` / `teams.away.id`. Those values are **not** authoritative for roster joins until the normalization step above runs on the full schedule stored in Redux.

---

## 5. UI that depends on ids

- **Match Play bracket:** Roster involvement (e.g. thick border) and per-corner fantasy lines use **normalized** `match.homeTeam.id` / `awayTeam.id` vs `RosterSquad.teamId` and `RosterPlayer.teamId`. Starter-only fantasy text uses signed **`role === "starter"`** players with a stored score row for that `matchId`.

---

## 6. Conflicts & outdated references elsewhere

When updating code or docs, fix these if you see them:

| Issue | Resolution |
|-------|------------|
| Docs referring to **`matchService`** | **Removed.** Turn fetches use **`getMatchResults`** from **`services/apiFootball.ts`** only. |
| Link to **`/docs/roster-logic-rebuild.md`** | File does not exist; use **`docs/logic-notes.md`** (Section 11) and this document. |
| **`players.json`** as a separate load path | Players ship **inside `squads.json`** per national team; there is no standalone `players.json` in this repo. |
| Assuming mock **`matches.json` carries rich `events`** | Often empty; **starter (player) fantasy points** need events (or future synthetic stats). **Squad** fantasy points still derive from final scorelines. |

---

## 7. Bundled team data vs API (recommended split)

**National teams, squads, and roster-shaped players** stay grounded in **`squads.json`** (and `nationTeams` / `roster` in Redux). That is the source of **canonical `teamId`**, **`countryCode`**, jersey **numbers**, and stable **`playerId`** where the JSON matches the API.

**Fixtures, live-ish status, events, and scorelines** come from **API-Football** (or **`matches.json`** as a stand-in schedule). Those payloads use **vendor team ids** until normalized.

**Best practice:**

1. **Load nationals first** (sync from JSON, or `hydrateNationalTeamsFromApi` when you extend live squad fetches).
2. **Fetch schedule or turn results** via **`apiFootball.ts`** (`fetchTournamentScheduleMatches`, `getMatchResults`, `fetchMatchDetails`) — not a second parallel normalizer.
3. **Immediately run** `normalizeMatchesNationalTeamIds(matches, nationalTeams)` on any array you will **`setMatches`** or merge into Redux.
4. **Player-level API enrichment** (e.g. extra stats): merge **by `playerId`** (and `countryCode` / `teamId` as guardrails) into national or roster structures; never treat API display names as keys.

**Historical note:** `matchService.ts` was removed — it duplicated fixture mapping without national id alignment. Reintroduce match helpers only as thin wrappers around **`apiFootball`** + **`normalizeMatchesNationalTeamIds`** if a facade is ever needed.

---

## 8. Recommended checks when touching match or roster code

1. New code path that calls `setMatches` → apply **`normalizeMatchesNationalTeamIds`** if national teams are available.
2. Any selector comparing **`match.*Team.id` to roster** → ids must be post-normalization (or document why raw API ids are intentional).
3. New API fields for teams → map to **`countryCode` + canonical `teamId`**, not raw vendor id alone.
4. Fixture normalization → **`apiFootball.normalizeMatch`** (API shape) **plus** **`normalizeMatchesNationalTeamIds`** (national `teamId` on sides); do not add a second parallel normalizer.
