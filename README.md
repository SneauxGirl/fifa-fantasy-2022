# FIFA Fantasy 2022

FF22 is a work-in-progress turn-based futbol fantasy game.

![Current Roster Screen](/docs/photos/FF22_Current-Roster-View-May2026.png)

This is a portfolio piece to practice working with real-world APIs, modern frontend tooling, brand matching, and data-driven UI.

API paywall constraints shifted this from a 2026 live game to a turn-based format using 2022 data, with rules giving advantage to player performance over easily found squad results.

UI maintains the more modern FIFA World Cup 2026 styling throughout.

Live deployment: [fifa-fantasy-2022.vercel.app](https://fifa-fantasy-2022.vercel.app)

## Documentation

- **[Data identifiers & ID protocol](docs/DATA_IDENTIFIERS.md)** — National team ids, player ids, fixture normalization, and known doc/code conflicts.
- [Services architecture](docs/SERVICES_ARCHITECTURE.md) — Turn fetch, scoring layers, env notes.
- [Logic notes](docs/logic-notes.md) — Roster pool/role model and turn-completion design notes.
- [Rules](docs/rules/rules.md) — Fantasy scoring rules (product).

## Tech Stack
- Vite
- React
- TypeScript
- Claude Code
- REST API: API-Football for player, team, and match data

## Planned
- Auth/OAuth: Firebase Authentication for user login

## Getting Started
To run this project locally:

1. Clone the repository
2. Install dependencies:
   npm install
3. Start the development server:
   npm run dev

Build check:
- `npx tsc -p tsconfig.app.json --noEmit`
- `npm run build`

## Current Status (May 2026)

- App navigation is now `Roster | Match Play | Schedule`.
- Default load route redirects to `Roster`.
- Turn-based Match Play UI is active, including:
  - staged expansion/locking behavior,
  - current-turn `Play` handling with confirmation for incomplete roster,
  - simulated in-progress display and turn progression visuals,
  - score summaries in the Match Play header and stage bars,
- Squad/Player conflict panels are wired for:
  - same-group conflicts,
  - current-turn head-to-head conflicts,
  - signed roster overlap display.

## Known limitations

- **Player (starter) fantasy points do not exist on mock data:** API requrired but not currently hooked up
- **National team results stored on mock data for entire tournament, providing Squad scores without API:** Turn scoring uses full-time (and ET/PEN) scorelines; squad totals for **signed** squads are computed on **Play** and stored in `turnScores`.
- **Elimination cascade:** Knockout progression is implemented for the bundled schedule; validate edge cases when changing schedule sources.
- Canonical rules for **IDs and normalization** are in [`docs/DATA_IDENTIFIERS.md`](docs/DATA_IDENTIFIERS.md) to avoid fixture-vs-roster id drift.

## React Compiler
The React Compiler is not enabled on this project because of its impact on dev & build performance.