import { useId, useState } from "react";
import appLayoutStyles from "../layouts/AppLayout.module.scss";
import { Modal } from "../components/Modals/Modal";
import { SoccerBallIcon } from "../components/Shared/SoccerBallIcon";
import styles from "./Rules.module.scss";

/**
 * Rules — plain-language overview of how the game works.
 * Page title is shown in the app header banner (AppLayout).
 */

const Rules = () => {
  const [squadPointsModalOpen, setSquadPointsModalOpen] = useState(false);
  const squadModalTitleId = useId();

  return (
    <div className={appLayoutStyles.pageLayout}>
      <div className={styles.wrapper}>
        <article className={styles.article} aria-labelledby="rules-page-desc">
          <p id="rules-page-desc" className={styles.lede}>
            Build a roster, pick starters each turn, then use Match Play to advance the tournament.
            Points come from your squads and your chosen starters.
          </p>

          <section className={styles.section} aria-labelledby="rules-roster">
            <h2 id="rules-roster" className={styles.sectionTitle}>
              Your Roster
            </h2>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <SoccerBallIcon className={styles.listBullet} />
                <span>You sign national squads and individual players. Players can come from any team - not just the squads you choose.</span>
              </li>
                <li className={styles.listItem}>
                <SoccerBallIcon className={styles.listBullet} />
                <span>
                  National squads are automatic starters - their results count toward your points automatically.
                </span>
              </li>
              <li className={styles.listItem}>
                <SoccerBallIcon className={styles.listBullet} />
                <span>
                  You can sign up to 18 players on your bench, then select 11 to start each round. Only the Starters score points that round.
                </span>
              </li>
              <li className={styles.listItem}>
                <SoccerBallIcon className={styles.listBullet} />
                <span>You can hold up to three goalkeepers on your player roster and start one goalkeeper per turn.</span>
              </li>
              <li className={styles.listItem}>
                   <SoccerBallIcon className={styles.listBullet} />
                <span>Once you sign a squad or player, you cannot remove or replace them unless they are eliminated.</span>
              </li>
              <li className={styles.listItem}>
                <SoccerBallIcon className={styles.listBullet} />
                <span>Eliminated squads and players stay visible for reference only. All points scored are retained.</span>
              </li>
            </ul>
          </section>

                    <section className={styles.section} aria-labelledby="rules-scoring">
            <h2 id="rules-scoring" className={styles.sectionTitle}>
              Scoring (basics)
            </h2>
            <ul className={styles.list}>
                 <li className={styles.listItem}>
                <SoccerBallIcon className={styles.listBullet} />
                <span>Only starters (4 squads+11 players) score per round. Roster players on the bench do not.</span>
              </li>
              <li className={styles.listItem}>
                <SoccerBallIcon className={styles.listBullet} />
                <span>
                  Squads earn points from match results (wins and draws) and goals scored, and lose points from goals
                  conceded.{" "}
                  <button
                    type="button"
                    className={styles.inlineHelpLink}
                    onClick={() => setSquadPointsModalOpen(true)}
                    aria-haspopup="dialog"
                    aria-expanded={squadPointsModalOpen}
                  >
                    Open squad points breakdown
                  </button>
                </span>
              </li>
              <li className={styles.listItem}>
                <SoccerBallIcon className={styles.listBullet} />
                <span>
                  Players earn points from match events—goals, assists, clean sheets, and more. Points are awarded individually and by position. Points are deducted for cards.
                </span>
              </li>
                 <li className={styles.listItem}>
                <SoccerBallIcon className={styles.listBullet} />
                <span>Game points count through the elimination game. ie: If a player scores 2 goals in a game where they are eliminated, those goals count as points scored, then the player is removed for the following round.</span>
              </li>
            </ul>
          </section>

          <section className={styles.section} aria-labelledby="rules-match-play">
            <h2 id="rules-match-play" className={styles.sectionTitle}>
              Match Play
            </h2>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <SoccerBallIcon className={styles.listBullet} />
                <span>
                  In Match Play, you can see all completed and current round games, and one round ahead. "Live" games show incomplete scores that are less than or equal to the final score for that match.
                </span>
              </li>
              <li className={styles.listItem}>
                <SoccerBallIcon className={styles.listBullet} />
                <span>
                  Selecting a full team of 4 squads and 11 starters before clicking play is recommended but not required.
                  </span>
              </li>
                <li className={styles.listItem}>
                <SoccerBallIcon className={styles.listBullet} />
                <span>
                  There are no restrictions on lineup, or how many swaps are made between bench and starter per turn.
                  </span>
              </li>
                 <li className={styles.listItem}>
                <SoccerBallIcon className={styles.listBullet} />
                <span>Once your starters are in position for the current selection of matches, click "Play" to end the round and reveal the final scores and points.</span>
              </li>
            </ul>
          </section>

          <section className={styles.section} aria-labelledby="rules-replacements">
            <h2 id="rules-replacements" className={styles.sectionTitle}>
              Replacements and substitutes
            </h2>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <SoccerBallIcon className={styles.listBullet} />
                <span>Throughout group play, any eliminated squads or players can be replaced.</span>
              </li>
              <li className={styles.listItem}>
                <SoccerBallIcon className={styles.listBullet} />
                <span>
                  The round of 16 is the last chance to add new squads or players; anyone added during Round of 16 play is added as a "substitute" and they score at 50% for the tournament.
                </span>
              </li>
              <li className={styles.listItem}>
                <SoccerBallIcon className={styles.listBullet} />
                <span>
                  At and after quarterfinals, you cannot add new squads or players—you can still swap starters from what
                  you have.
                </span>
              </li>
            </ul>
          </section>



          <p className={styles.footerNote}>
            For the full rule set and point tables, see the project documentation when you need every detail.
          </p>
        </article>
      </div>

      <Modal
        isOpen={squadPointsModalOpen}
        onClose={() => setSquadPointsModalOpen(false)}
        dialogLabelId={squadModalTitleId}
      >
        <div className={styles.squadModalBody}>
          <h2 id={squadModalTitleId} className={styles.squadModalHeading}>
            Full points system
          </h2>
          <p className={styles.squadModalLead}>
            Turn totals combine <strong>signed squads</strong> and <strong>starter players</strong>.
          </p>

          <section className={styles.squadModalSection} aria-labelledby="squad-points">
            <h3 id="squad-points" className={styles.squadModalSubheading}>
              Squads
            </h3>
            <ul className={styles.squadModalList}>
              <li className={styles.scoreLine}><span className={styles.scoreValue}>+10</span><span className={styles.scoreLabel}>Match Win</span></li>
              <li className={styles.scoreLine}><span className={styles.scoreValue}>+5</span><span className={styles.scoreLabel}>Match Draw</span></li>
              <li className={styles.scoreLine}><span className={styles.scoreValue}>0</span><span className={styles.scoreLabel}>Match Loss</span></li>
              <li className={styles.scoreLine}><span className={styles.scoreValue}>+2</span><span className={styles.scoreLabel}>Goals For (each)</span></li>
              <li className={styles.scoreLine}><span className={styles.scoreValue}>-1</span><span className={styles.scoreLabel}>Goals Against (each)</span></li>
              <li className={styles.scoreLine}><span className={styles.scoreValue}>+5</span><span className={styles.scoreLabel}>Clean Sheet (No Goals Conceded)</span></li>
            </ul>
          </section>

          <section className={styles.squadModalSection} aria-labelledby="group-bonus">
            <h3 id="group-bonus" className={styles.squadModalSubheading}>
              Group advance bonus
            </h3>
            <ul className={styles.squadModalList}>
              <li className={styles.scoreLine}><span className={styles.scoreValue}>+40</span><span className={styles.scoreLabel}>Group Winner</span></li>
              <li className={styles.scoreLine}><span className={styles.scoreValue}>+20</span><span className={styles.scoreLabel}>Group Second</span></li>
            </ul>
          </section>

          <section className={styles.squadModalSection} aria-labelledby="player-all">
            <h3 id="player-all" className={styles.squadModalSubheading}>
              Players (all)
            </h3>
            <ul className={styles.squadModalList}>
              <li className={styles.scoreLine}><span className={styles.scoreValue}>+2</span><span className={styles.scoreLabel}>Assist</span></li>
              <li className={styles.scoreLine}><span className={styles.scoreValue}>-3</span><span className={styles.scoreLabel}>Own Goal</span></li>
              <li className={styles.scoreLine}><span className={styles.scoreValue}>-3</span><span className={styles.scoreLabel}>Yellow Card</span></li>
              <li className={styles.scoreLine}><span className={styles.scoreValue}>-7</span><span className={styles.scoreLabel}>Red Card</span></li>
              <li className={styles.scoreLine}><span className={styles.scoreValue}>+21</span><span className={styles.scoreLabel}>Hat Trick (3+ Goals in One Match)</span></li>
            </ul>
          </section>

          <section className={styles.squadModalSection} aria-labelledby="player-position">
            <h3 id="player-position" className={styles.squadModalSubheading}>
              Players (by position)
            </h3>
            <div className={styles.positionPoints}>
              <p className={styles.positionTitle}>Goalkeeper</p>
              <ul className={styles.squadModalList}>
                <li className={styles.scoreLine}><span className={styles.scoreValue}>+7</span><span className={styles.scoreLabel}>Goal Scored</span></li>
                <li className={styles.scoreLine}><span className={styles.scoreValue}>+7</span><span className={styles.scoreLabel}>Clean Sheet Bonus</span></li>
                <li className={styles.scoreLine}><span className={styles.scoreValue}>+2</span><span className={styles.scoreLabel}>Shootout Save</span></li>
                <li className={styles.scoreLine}><span className={styles.scoreValue}>+1</span><span className={styles.scoreLabel}>Regular/Extra-Time Save</span></li>
                <li className={styles.scoreLine}><span className={styles.scoreValue}>-2</span><span className={styles.scoreLabel}>Shootout Miss</span></li>
              </ul>

              <p className={styles.positionTitle}>Defender</p>
              <ul className={styles.squadModalList}>
                <li className={styles.scoreLine}><span className={styles.scoreValue}>+5</span><span className={styles.scoreLabel}>Goal Scored</span></li>
                <li className={styles.scoreLine}><span className={styles.scoreValue}>+4</span><span className={styles.scoreLabel}>Clean Sheet Bonus</span></li>
              </ul>

              <p className={styles.positionTitle}>Midfielder</p>
              <ul className={styles.squadModalList}>
                <li className={styles.scoreLine}><span className={styles.scoreValue}>+4</span><span className={styles.scoreLabel}>Goal Scored</span></li>
                <li className={styles.scoreLine}><span className={styles.scoreValue}>+1</span><span className={styles.scoreLabel}>Clean Sheet Bonus</span></li>
              </ul>

              <p className={styles.positionTitle}>Attacker</p>
              <ul className={styles.squadModalList}>
                <li className={styles.scoreLine}><span className={styles.scoreValue}>+3</span><span className={styles.scoreLabel}>Goal Scored</span></li>
                <li className={styles.scoreLine}><span className={styles.scoreValue}>0</span><span className={styles.scoreLabel}>Clean Sheet Bonus</span></li>
              </ul>
            </div>
          </section>

          <p className={styles.squadModalFooter}>
            Only signed squads and starters count in turn totals. Bench players do not.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Rules;
