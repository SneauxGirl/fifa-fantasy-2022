# FIFA Fantasy 2022

Turn-based fantasy football on the **2022 World Cup** results (portfolio piece). The UI follows a **2026 FIFA-style** look.

![Current Roster Screen](/docs/photos/FF22_Current-Roster-View-May2026.png)

**Live:** [fifa-fantasy-2022.vercel.app](https://fifa-fantasy-2022.vercel.app)



## Tech stack

Vite · React · TypeScript · API-Football (optional live source)

## Getting started

```bash
npm install
npm run dev
```

- Production build: `npm run build`  
- Typecheck: `npx tsc -p tsconfig.app.json --noEmit`
## Documentation

Implementation detail, progress, and rules live under **`docs/`**:

- **[`docs/project-notes.md`](docs/project-notes.md)** — Phases, **latest progress**, snapshot, limitations  
- **[`docs/logic-notes.md`](docs/logic-notes.md)** — Roster pool/role model and turn-flow notes  
- **[`docs/rules/rules.md`](docs/rules/rules.md)** — Fantasy scoring (product rules)  
- **[`docs/DATA_IDENTIFIERS.md`](docs/DATA_IDENTIFIERS.md)** — Team/player IDs and fixture normalization  
- **[`docs/SERVICES_ARCHITECTURE.md`](docs/SERVICES_ARCHITECTURE.md)** — Data fetch, mocks, environment  
- **[`docs/DESIGN-STANDARDS.md`](docs/DESIGN-STANDARDS.md)** — Tokens, layout, accessibility  

Currently working on Team Elimination logic following end of Turn 3, and have not hooked up API for Player scores.

## React Compiler

Not enabled (dev/build performance).
