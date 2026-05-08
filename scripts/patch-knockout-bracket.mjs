/**
 * Patches src/data/matches.json: knockout (49–64) = bracketFeeds, NS, null scores,
 * schedule (dates/venues). Group 1–48 unchanged.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const matchesPath = path.join(root, "src/data/matches.json");

const V = {
  alBayt: { id: 1, name: "Al Bayt Stadium", city: "Al Khor" },
  khalifa: { id: 2, name: "Khalifa International Stadium", city: "Doha" },
  thumama: { id: 3, name: "Al Thumama Stadium", city: "Doha" },
  rayyan: { id: 4, name: "Al Rayyan Stadium", city: "Al Rayyan" },
  lusail: { id: 5, name: "Lusail Stadium", city: "Lusail" },
  edu: { id: 6, name: "Education City Stadium", city: "Al Rayyan" },
  s974: { id: 7, name: "Stadium 974", city: "Doha" },
  janoub: { id: 8, name: "Al Janoub Stadium", city: "Al Wakrah" },
};

const NS = { short: "NS", long: "Not Started", elapsed: null };
const emptyScore = () => ({
  halftime: { home: null, away: null },
  fulltime: { home: null, away: null },
  extratime: { home: null, away: null },
  penalty: { home: null, away: null },
});

const TBD = { id: 0, countryCode: "TBD", name: "TBD" };

const knockout = [
  {
    id: 49,
    homeTeam: { ...TBD, name: "1A" },
    awayTeam: { ...TBD, name: "2B" },
    date: "2022-12-03T17:30:00Z",
    status: NS,
    score: emptyScore(),
    venue: V.khalifa,
    stage: { id: 2, name: "Round of 16" },
    events: [],
    bracketFeeds: {
      home: { kind: "group_place", group: "A", place: 1 },
      away: { kind: "group_place", group: "B", place: 2 },
    },
  },
  {
    id: 50,
    homeTeam: { ...TBD, name: "1C" },
    awayTeam: { ...TBD, name: "2D" },
    date: "2022-12-03T21:30:00Z",
    status: NS,
    score: emptyScore(),
    venue: V.rayyan,
    stage: { id: 2, name: "Round of 16" },
    events: [],
    bracketFeeds: {
      home: { kind: "group_place", group: "C", place: 1 },
      away: { kind: "group_place", group: "D", place: 2 },
    },
  },
  {
    id: 51,
    homeTeam: { ...TBD, name: "1D" },
    awayTeam: { ...TBD, name: "2C" },
    date: "2022-12-04T17:30:00Z",
    status: NS,
    score: emptyScore(),
    venue: V.thumama,
    stage: { id: 2, name: "Round of 16" },
    events: [],
    bracketFeeds: {
      home: { kind: "group_place", group: "D", place: 1 },
      away: { kind: "group_place", group: "C", place: 2 },
    },
  },
  {
    id: 52,
    homeTeam: { ...TBD, name: "1B" },
    awayTeam: { ...TBD, name: "2A" },
    date: "2022-12-04T21:30:00Z",
    status: NS,
    score: emptyScore(),
    venue: V.alBayt,
    stage: { id: 2, name: "Round of 16" },
    events: [],
    bracketFeeds: {
      home: { kind: "group_place", group: "B", place: 1 },
      away: { kind: "group_place", group: "A", place: 2 },
    },
  },
  {
    id: 53,
    homeTeam: { ...TBD, name: "1E" },
    awayTeam: { ...TBD, name: "2F" },
    date: "2022-12-05T17:30:00Z",
    status: NS,
    score: emptyScore(),
    venue: V.janoub,
    stage: { id: 2, name: "Round of 16" },
    events: [],
    bracketFeeds: {
      home: { kind: "group_place", group: "E", place: 1 },
      away: { kind: "group_place", group: "F", place: 2 },
    },
  },
  {
    id: 54,
    homeTeam: { ...TBD, name: "1G" },
    awayTeam: { ...TBD, name: "2H" },
    date: "2022-12-05T21:30:00Z",
    status: NS,
    score: emptyScore(),
    venue: V.s974,
    stage: { id: 2, name: "Round of 16" },
    events: [],
    bracketFeeds: {
      home: { kind: "group_place", group: "G", place: 1 },
      away: { kind: "group_place", group: "H", place: 2 },
    },
  },
  {
    id: 55,
    homeTeam: { ...TBD, name: "1F" },
    awayTeam: { ...TBD, name: "2E" },
    date: "2022-12-06T15:00:00Z",
    status: NS,
    score: emptyScore(),
    venue: V.edu,
    stage: { id: 2, name: "Round of 16" },
    events: [],
    bracketFeeds: {
      home: { kind: "group_place", group: "F", place: 1 },
      away: { kind: "group_place", group: "E", place: 2 },
    },
  },
  {
    id: 56,
    homeTeam: { ...TBD, name: "1H" },
    awayTeam: { ...TBD, name: "2G" },
    date: "2022-12-06T19:00:00Z",
    status: NS,
    score: emptyScore(),
    venue: V.lusail,
    stage: { id: 2, name: "Round of 16" },
    events: [],
    bracketFeeds: {
      home: { kind: "group_place", group: "H", place: 1 },
      away: { kind: "group_place", group: "G", place: 2 },
    },
  },
  {
    id: 57,
    homeTeam: { ...TBD, name: "W53" },
    awayTeam: { ...TBD, name: "W54" },
    date: "2022-12-09T17:30:00Z",
    status: NS,
    score: emptyScore(),
    venue: V.edu,
    stage: { id: 3, name: "Quarterfinals" },
    events: [],
    bracketFeeds: {
      home: { kind: "winner", matchId: 53 },
      away: { kind: "winner", matchId: 54 },
    },
  },
  {
    id: 58,
    homeTeam: { ...TBD, name: "W49" },
    awayTeam: { ...TBD, name: "W50" },
    date: "2022-12-09T21:30:00Z",
    status: NS,
    score: emptyScore(),
    venue: V.lusail,
    stage: { id: 3, name: "Quarterfinals" },
    events: [],
    bracketFeeds: {
      home: { kind: "winner", matchId: 49 },
      away: { kind: "winner", matchId: 50 },
    },
  },
  {
    id: 59,
    homeTeam: { ...TBD, name: "W55" },
    awayTeam: { ...TBD, name: "W56" },
    date: "2022-12-10T17:30:00Z",
    status: NS,
    score: emptyScore(),
    venue: V.thumama,
    stage: { id: 3, name: "Quarterfinals" },
    events: [],
    bracketFeeds: {
      home: { kind: "winner", matchId: 55 },
      away: { kind: "winner", matchId: 56 },
    },
  },
  {
    id: 60,
    homeTeam: { ...TBD, name: "W51" },
    awayTeam: { ...TBD, name: "W52" },
    date: "2022-12-10T21:30:00Z",
    status: NS,
    score: emptyScore(),
    venue: V.alBayt,
    stage: { id: 3, name: "Quarterfinals" },
    events: [],
    bracketFeeds: {
      home: { kind: "winner", matchId: 51 },
      away: { kind: "winner", matchId: 52 },
    },
  },
  {
    id: 61,
    homeTeam: { ...TBD, name: "W57" },
    awayTeam: { ...TBD, name: "W58" },
    date: "2022-12-13T19:00:00Z",
    status: NS,
    score: emptyScore(),
    venue: V.lusail,
    stage: { id: 4, name: "Semifinals" },
    events: [],
    bracketFeeds: {
      home: { kind: "winner", matchId: 57 },
      away: { kind: "winner", matchId: 58 },
    },
  },
  {
    id: 62,
    homeTeam: { ...TBD, name: "W59" },
    awayTeam: { ...TBD, name: "W60" },
    date: "2022-12-14T19:00:00Z",
    status: NS,
    score: emptyScore(),
    venue: V.alBayt,
    stage: { id: 4, name: "Semifinals" },
    events: [],
    bracketFeeds: {
      home: { kind: "winner", matchId: 59 },
      away: { kind: "winner", matchId: 60 },
    },
  },
  {
    id: 63,
    homeTeam: { ...TBD, name: "L61" },
    awayTeam: { ...TBD, name: "L62" },
    date: "2022-12-17T15:00:00Z",
    status: NS,
    score: emptyScore(),
    venue: V.khalifa,
    stage: { id: 5, name: "Third Place" },
    events: [],
    bracketFeeds: {
      home: { kind: "loser", matchId: 61 },
      away: { kind: "loser", matchId: 62 },
    },
  },
  {
    id: 64,
    homeTeam: { ...TBD, name: "W61" },
    awayTeam: { ...TBD, name: "W62" },
    date: "2022-12-18T15:00:00Z",
    status: NS,
    score: emptyScore(),
    venue: V.lusail,
    stage: { id: 6, name: "Final" },
    events: [],
    bracketFeeds: {
      home: { kind: "winner", matchId: 61 },
      away: { kind: "winner", matchId: 62 },
    },
  },
];

const all = JSON.parse(fs.readFileSync(matchesPath, "utf8"));
const head = all.filter((m) => m.id < 49);
const out = [...head, ...knockout].sort((a, b) => a.id - b.id);
fs.writeFileSync(matchesPath, JSON.stringify(out, null, 2) + "\n", "utf8");
console.log("Patched knockout matches 49–64 with bracketFeeds + NS.");
