# FIFA Fantasy 2022

FF22 is a work-in-progress turn-based futbol fantasy game.

![Current Roster Screen](/docs/photos/FF22_Current-Roster-View-May2026.png)

This is a portfolio piece to practice working with real-world APIs, modern frontend tooling, brand matching, and data-driven UI.

API paywall constraints shifted this from a 2026 live game to a turn-based format using 2022 data, with rules giving advantage to player performance over easily found squad results.

UI maintains the more modern FIFA World Cup 2026 styling throughout.

Live deployment: [fifa-fantasy-2022.vercel.app](https://fifa-fantasy-2022.vercel.app)

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
  - score summaries in the Match Play header and stage bars.
- Squad/Player conflict panels are wired for:
  - same-group conflicts,
  - current-turn head-to-head conflicts,
  - signed roster overlap display.

## Known Limitation (Important)

- **Scoring + elimination playthrough do not currently work end-to-end on mock-data alone.**
- In the current branch, full turn scoring/elimination progression depends on API-backed result flow and is not fully reliable with `matches.json` only.
- Treat mock-only mode as a UI/flow preview, not a final scoring authority.

## React Compiler
The React Compiler is not enabled on this project because of its impact on dev & build performance.