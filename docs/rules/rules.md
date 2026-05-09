## FF22 Fantasy Scoring Rules (Turn-Based Gameplay)

### Definitions

* **Squad(s)** – The 4 national teams selected by the user at the start of the tournament; score points automatically each turn. Squads are treated as their own position type (not GK/DEF/MID/FWD).
* **Player** – An individual footballer participant in the tournament; selected for the user's ROSTER and STARTER slots. Players have one of four positions: GK, DEF, MID, FWD. Players relationship to a Squad in real life does not affect gameplay other than elimination.
* **ROSTER** – The collection of all Squads and Players selected available to the user for each turn's selection.
* **STARTER** – A Player selected from the ROSTER to actively contribute points in a given turn. Squads are automatic STARTERS every turn.
* **ELIMINATED** – Status for a Squad or Player removed from eligibility due to tournament elimination; greyed out in the UI.
* **SUBSTITUTE** – A Squad or Player added to the ROSTER after R16, scores at 50% of standard points.

*Technical identifiers* (how squads/players/fixtures are keyed in code and data): see **`docs/DATA_IDENTIFIERS.md`**.

---

### 1. Initial Setup & Turn-Based ROSTER

* On initial selection, **Squads** and **Players** are available for user to add to a **ROSTER**.
* User selects **4 Squads** and **18 Players** (by position, from any team) at the start of the tournament.
* **Squads** are automatically included every turn as STARTERS.
* Each turn, the user selects **11 Players from the ROSTER** to be added as STARTERS. Only STARTERS are eligible to accumulate points for that turn.

#### "Play" Button & Turn Completion

* **Play Button**: Advances the tournament to the next turn. Clicking "Play":
  1. Locks the current roster and formation
  2. Fetches match results for that turn's games
  3. Calculates points for all STARTERS and SQUADS
  4. Updates eliminated status based on match results
  5. Unlocks roster for editing before the next "Play" click
* Points for the turn are counted regardless of elimination status that results from that squad or player's match.

#### Goalkeeper Constraints (Player ROSTER only)

* A maximum of **3 Goalkeepers (GK)** may be held on the Player ROSTER at any time.
* A maximum of **1 Goalkeeper (GK)** may be selected as a STARTER per turn.
* These limits apply to the **Player position GK only**. Squads are their own position type and players within Squads are not counted against the GK cap.

### 2. Minimum Roster Requirements

* **Before Quarterfinals "Play" Click**: User must have a complete roster to proceed
  - **4 Squads** signed (max capacity)
  - **11 Players** selected as STARTERS from the signed ROSTER
  - **11-18 total Players** on the signed ROSTER
* **After Quarterfinals "Play" Click**: No minimum enforced (eliminations naturally reduce available players)

---

### 3. Elimination & Substitutions

**Replacement rules for Squads and Players (identical):**

1. **Group Stage 1, 2, and Final:** replacement Squads or Players may be added for any eliminated Squad or Player with **no penalty**.
2. **Round of 16:** this is the **final turn with replacement permitted**. Squads or Players added at this time are flagged as **SUBSTITUTES** and score **50% of points and bonuses**.
3. **Quarterfinals and beyond:** no new Squads or Players may be added, but ROSTER Players can still be rotated to fill STARTER roles as usual.

   * If the ROSTER does not have enough Players to fill all STARTER positions, those STARTER positions remain **unfilled** and score 0.
   * Similarly, unfilled Squad spots remain **unfilled** and score 0.
   * There is no additional penalty for unfilled spots beyond missed opportunity.

* Once a Squad or Player is ELIMINATED, they are marked as **ELIMINATED** (greyed out) and removed from eligibility for STARTER selection.

### 4. Substitute Window & Late Additions

* **Group Stage 1, 2, and Final (Turns 1-3)**: New Squads or Players may be added with **no penalty** (100% scoring)
* **Round of 16 (Turn 4)**: Final opportunity to add new Squads or Players
  - Squads or Players added during R16 are flagged as **SUBSTITUTES**
  - SUBSTITUTES score at **50% of standard points** for the entire remainder of the tournament
* **Quarterfinals and Beyond (Turn 5+)**: Roster is **locked** after clicking "Play" for Quarterfinals
  - No new additions permitted
  - Players can still be moved between STARTER and BENCH roles for tactical adjustments
  - Eliminated players automatically removed from eligible STARTER pool

---

### 5. STARTER Availability Notes

* STARTER slots that are empty but have available **Players** or **Squads** in the ROSTER display as **"Unassigned"**.
* STARTER slots that are empty because all available **Players** or **Squads** for that position have been ELIMINATED display as **"Unavailable"**.
* ELIMINATED **Squads** and **Players** remain visible in grey for strategic reference.

---

### 6. Tournament Structure & Turns

Tournament is divided into **7 sequential turns** based on match schedule:

| Turn | Stage | Dates | Group/Round |
|------|-------|-------|-------------|
| 1 | Group Stage 1 | Nov 20-26, 2022 | Groups A-D |
| 2 | Group Stage 2 | Nov 26-30, 2022 | Groups A-D |
| 3 | Group Stage Final | Nov 29-Dec 3, 2022 | Groups A-D |
| 4 | Round of 16 | Dec 3-7, 2022 | Round of 16 |
| 5 | Quarterfinals | Dec 9-11, 2022 | Quarterfinals (Roster locks after "Play") |
| 6 | Semifinals | Dec 14-15, 2022 | Semifinals |
| 7 | Final | Dec 18, 2022 | Final |

Note: Turns 3-4 overlap by 1 match (Dec 3) — coordinate API pulls carefully.

---

## 7. Squad Scoring

### Match Result Points

| Result | Points |
| ------ | ------ |
| Win    | 10     |
| Draw   | 5      |
| Loss   | 0      |

* Assigned per match, consistent across tournament stages.
* Match result points are awarded only for **completed matches** (status: FT, AET, PEN).
* **Partial matches** (status: SUSP, ABD, INT) award goals-based points only — no result points.

### Goals Scored / Conceded

* Goals Scored: +2 points per goal
* Goals Conceded: -1 point per goal
* Applies for every match, including group and knockout stages.
* For partial matches, all goals scored in play completed are counted.

### Clean Sheet Bonus

* **Squad** keeps a clean sheet (0 goals conceded) → +5 points per match
* Awarded for completed and partial matches when no goals were conceded.

### Advancement Bonuses

* Awarded at the end of the turn prior to matches in the next round:
  | Stage / Advancement    | Bonus Points |
  |------------------------|--------------|
  | Group Winner           | +40          |
  | Group Advances (other) | +20          |

  Note: Only Group Stage advancement bonuses are awarded. Later round bonuses are not used since historical results are known.

### Partial Match Handling

Matches interrupted before completion (API status: `SUSP`, `ABD`, `INT`) are scored as follows:

* Goals scored in play completed count normally (+2 per goal for Squads; position-based for Players).
* Goals conceded count normally (-1 per goal for Squads; affects Player clean sheets).
* No win/draw/loss result points are awarded.
* Score is derived from the best available data: `fulltime → halftime → 0`.

Matches not yet started or cancelled (status: `NS`, `PST`, `CANC`, `TBD`) score 0 points.

### Turn Scoring Rules

* Points are calculated per match and summed for the turn.
* ELIMINATED **Squads** and **Starters** receive full points from their last match.
* Turn totals include all **Squads** plus STARTER **Player** points.

### Integration With Player Scoring

* **Squads** are treated as a unique position type (not GK/DEF/MID/FWD).
* Turn total = sum of STARTER **Players** + 4 **Squads**.
* Cumulative tournament score = sum of all turn totals.
* Replacement **Squads** or **Players** added as SUBSTITUTES after Round of 16 score at **50%**, including all bonuses.
* Replacement Squads or Players added earlier (Group Stage 1, 2, and Final) score at **100%**.

### Tie-Breaker: "In-House Shootout"

* Uses **top five scoring STARTER Players** from the turn (GK, DEF, MID, FWD).
* Excludes **Squads**; only Player goals count.
* Formula: sum of top 5 STARTER Player goals minus **STARTER GK goals conceded** for that turn.
* Players ranked by fantasy points, not by goals (provides better statistical variation in winner).
* Higher resulting goal count wins.
* Only non-shootout goals count.

---

## 8. Player Scoring Rules

### Goals (credited to Player)

* Forward (FWD) → +3
* Midfielder (MID) → +4
* Defender (DEF) → +5
* Goalkeeper (GK) → +7
* Goals are assigned based on the Player's **most forward position**

### Assists (credited to Player)

* All positions → +2 points

### Clean Sheets

* GK → +7, DEF → +4, MID → +1, FWD → 0
* Clean sheet is awarded only at end of match

### Goalkeeper Extras (If I can get these from API calls)

* Penalty Saves (regular play) → +5
* Penalty Saves (shootout) → +2

### Penalty Scoring

**On-Field Penalties:**

* Penalty scored → counts as standard goal (applies goal points + hat trick if eligible)
* Penalty missed (non-GK) → -2
* Penalty saved (GK only) → +5

**Shootout Penalties:**

* Shootout goal → +1
* Shootout save (GK only) → +2
* Shootout fail → -2

### Negative Events

* Yellow Card → -3
* Red Card → -7
* Own Goal → -3
* Penalty Miss (non-GK, on-field) → -2

### Hat Trick Bonus

* Awarded **once per match**, at the end of the match
* Player scoring ≥ 3 goals in a single match → +21 points
* Includes on-field penalty goals; excludes shootout goals

### Scoring Scope

* Only STARTERS contribute to turn points
* Bench Players do not contribute to turn score
* Bench points are visible for strategic consideration

### Roster Adjustments Between Turns

* No auto-bench substitutions
* If a STARTER does not play → 0 points for that slot
* Player formation adjustments (bench ↔ starter) allowed at any time before "Play" is clicked for the next turn
* New roster additions only allowed before "Play" click (roster locked after Quarterfinals)

### Position System

* Player positions: GK / DEF / MID / FWD
* Squads are their own position type and are not part of the GK/DEF/MID/FWD classification
* Hybrid roles assigned to most forward role

### Cumulative Scoring

* Player scores are cumulative per match and per turn
* Turn scores feed into total tournament cumulative score
* Turn MVP awarded to **highest scoring STARTER Player** (Squads excluded); no bonus, just a trophy icon

---

### Notes

* All **Squads** score evenly (same point structure; no positional differentiation).
* Match points, goals, clean sheet, and advancement bonuses do not change throughout the tournament.
* Points per match and per goal remain consistent from group stage to final.
* Hat trick bonus counts only once per match, non-shootout goals included.
