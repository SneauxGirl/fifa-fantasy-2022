import { setLiveScores } from "../slices/liveScoresSlice";
import { generateLiveScore } from "../slices/liveScoresSlice";
import type { Match } from "../../types/match";
import type { AppDispatch } from "../index";

/**
 * Initialize live scores for all live matches
 * Call this when live matches start (or at app init for demo)
 */
export const initializeLiveScores = (matches: Match[]) => (dispatch: AppDispatch) => {
  const liveScores: Record<number, any> = {};

  matches.forEach((match) => {
    const isLive = ["1H", "2H", "ET", "HT", "P"].includes(match.status.short);
    if (isLive) {
      // Use match.score.live if available, otherwise fall back to fulltime (or 1-1 for null)
      const baseScore = match.score.live ?? match.score.fulltime;
      const finalHome = baseScore.home ?? 1;
      const finalAway = baseScore.away ?? 1;
      const liveScore = generateLiveScore(finalHome, finalAway, match.id);
      liveScores[match.id] = liveScore;
    }
  });

  if (Object.keys(liveScores).length > 0) {
    dispatch(setLiveScores(liveScores));
  }
};
