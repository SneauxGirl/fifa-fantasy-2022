/**
 * Regenerates src/data/matches.json:
 * - Group 1–48: normalize status to FT when scores exist; fix stage on match 48; keep venues/dates/teams.
 * - Knockout 49–64: official FIFA 2022 bracket, final scores (Olympics / FIFA results), empty events.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const matchesPath = path.join(root, "src/data/matches.json");

const FINISHED = { short: "FT", long: "Match Finished", elapsed: null };
const finishedPen = {
  short: "PEN",
  long: "Match Finished (Pen)",
  elapsed: null,
};
const finishedAet = {
  short: "AET",
  long: "Match Finished (AET)",
  elapsed: null,
};

/** Venue presets aligned with existing JSON ids */
const V = {
  alBayt: { id: 1, name: "Al Bayt Stadium", city: "Al Khor" },
  khalifa: { id: 2, name: "Khalifa International Stadium", city: "Doha" },
  thumama: { id: 3, name: "Al Thumama Stadium", city: "Doha" },
  rayyan: { id: 4, name: "Ahmad bin Ali Stadium", city: "Al Rayyan" },
  lusail: { id: 5, name: "Lusail Stadium", city: "Lusail" },
  edu: { id: 6, name: "Education City Stadium", city: "Al Rayyan" },
  s974: { id: 7, name: "Stadium 974", city: "Doha" },
  janoub: { id: 8, name: "Al Janoub Stadium", city: "Al Wakrah" },
};

function emptyScore() {
  return {
    halftime: { home: null, away: null },
    fulltime: { home: null, away: null },
    extratime: { home: null, away: null },
    penalty: { home: null, away: null },
  };
}

function score(ft, et = null, pen = null) {
  const s = emptyScore();
  s.fulltime = { home: ft[0], away: ft[1] };
  if (et) s.extratime = { home: et[0], away: et[1] };
  else s.extratime = { home: null, away: null };
  if (pen) s.penalty = { home: pen[0], away: pen[1] };
  return s;
}

const raw = JSON.parse(fs.readFileSync(matchesPath, "utf8"));

/** countryCode -> team object from existing data */
const teamByCode = new Map();
for (const m of raw) {
  teamByCode.set(m.homeTeam.countryCode, { ...m.homeTeam });
  teamByCode.set(m.awayTeam.countryCode, { ...m.awayTeam });
}
function T(code) {
  const t = teamByCode.get(code);
  if (!t) throw new Error(`Unknown team code: ${code}`);
  return { id: t.id, countryCode: t.countryCode, name: t.name };
}

const groupFixed = raw
  .filter((m) => m.id <= 48)
  .map((m) => {
    const patch = { ...m };
    if (patch.id === 48) {
      patch.stage = { id: 1, name: "Group Stage" };
    }
    const ftH = patch.score?.fulltime?.home;
    const ftA = patch.score?.fulltime?.away;
    const hasFt = ftH != null && ftA != null;
    if (hasFt) {
      patch.status = FINISHED;
    }
    return patch;
  });

/** Knockout rows: home/away codes, ISO date, venue, status short, score parts */
const ko = [
  {
    id: 49,
    h: "NET",
    a: "USA",
    date: "2022-12-03T17:30:00Z",
    venue: V.khalifa,
    st: "FT",
    sc: score([3, 1]),
  },
  {
    id: 50,
    h: "ARG",
    a: "AUS",
    date: "2022-12-03T21:30:00Z",
    venue: V.rayyan,
    st: "FT",
    sc: score([2, 1]),
  },
  {
    id: 51,
    h: "FRA",
    a: "POL",
    date: "2022-12-04T17:30:00Z",
    venue: V.thumama,
    st: "FT",
    sc: score([3, 1]),
  },
  {
    id: 52,
    h: "ENG",
    a: "SEN",
    date: "2022-12-04T21:30:00Z",
    venue: V.alBayt,
    st: "FT",
    sc: score([3, 0]),
  },
  {
    id: 53,
    h: "JAP",
    a: "CRO",
    date: "2022-12-05T17:30:00Z",
    venue: V.janoub,
    st: "PEN",
    sc: score([1, 1], [0, 0], [1, 3]),
  },
  {
    id: 54,
    h: "BRA",
    a: "SOU",
    date: "2022-12-05T21:30:00Z",
    venue: V.s974,
    st: "FT",
    sc: score([4, 1]),
  },
  {
    id: 55,
    h: "MOR",
    a: "SPA",
    date: "2022-12-06T15:00:00Z",
    venue: V.edu,
    st: "PEN",
    sc: score([0, 0], [0, 0], [3, 0]),
  },
  {
    id: 56,
    h: "POR",
    a: "SWI",
    date: "2022-12-06T19:00:00Z",
    venue: V.lusail,
    st: "FT",
    sc: score([6, 1]),
  },
  {
    id: 57,
    h: "CRO",
    a: "BRA",
    date: "2022-12-09T17:30:00Z",
    venue: V.edu,
    st: "PEN",
    /** 0-0 at 90; Neymar 105+1, Petković 116; pens 4-2 */
    sc: score([0, 0], [1, 1], [4, 2]),
  },
  {
    id: 58,
    h: "NET",
    a: "ARG",
    date: "2022-12-09T21:30:00Z",
    venue: V.lusail,
    st: "PEN",
    /** 2-2 at 90; 0-0 AET; pens 3-4 */
    sc: score([2, 2], [0, 0], [3, 4]),
  },
  {
    id: 59,
    h: "MOR",
    a: "POR",
    date: "2022-12-10T17:30:00Z",
    venue: V.thumama,
    st: "FT",
    sc: score([1, 0]),
  },
  {
    id: 60,
    h: "FRA",
    a: "ENG",
    date: "2022-12-10T21:30:00Z",
    venue: V.alBayt,
    st: "FT",
    sc: score([2, 1]),
  },
  {
    id: 61,
    h: "CRO",
    a: "ARG",
    date: "2022-12-13T19:00:00Z",
    venue: V.lusail,
    st: "FT",
    /** All goals in regulation */
    sc: score([0, 3]),
  },
  {
    id: 62,
    h: "MOR",
    a: "FRA",
    date: "2022-12-14T19:00:00Z",
    venue: V.alBayt,
    st: "FT",
    sc: score([0, 2]),
  },
  {
    id: 63,
    h: "CRO",
    a: "MOR",
    date: "2022-12-17T15:00:00Z",
    venue: V.khalifa,
    st: "FT",
    sc: score([2, 1]),
  },
  {
    id: 64,
    h: "ARG",
    a: "FRA",
    date: "2022-12-18T15:00:00Z",
    venue: V.lusail,
    st: "PEN",
    /** 2-2 at 90; 1-1 ET; pens 4-2 */
    sc: score([2, 2], [1, 1], [4, 2]),
  },
];

const stName = (s) => {
  if (s === "PEN") return finishedPen;
  if (s === "AET") return finishedAet;
  return FINISHED;
};

const knockoutBuilt = ko.map((row) => ({
  id: row.id,
  homeTeam: T(row.h),
  awayTeam: T(row.a),
  date: row.date,
  status: stName(row.st),
  score: row.sc,
  venue: row.venue,
  stage: {
    id: row.id <= 56 ? 2 : row.id <= 60 ? 3 : row.id <= 62 ? 4 : row.id === 63 ? 5 : 6,
    name:
      row.id <= 56
        ? "Round of 16"
        : row.id <= 60
          ? "Quarterfinals"
          : row.id <= 62
            ? "Semifinals"
            : row.id === 63
              ? "Third Place"
              : "Final",
  },
  events: [],
}));

const out = [...groupFixed, ...knockoutBuilt].sort((a, b) => a.id - b.id);

fs.writeFileSync(matchesPath, JSON.stringify(out, null, 2) + "\n", "utf8");
console.log(`Wrote ${out.length} matches to ${path.relative(root, matchesPath)}`);
