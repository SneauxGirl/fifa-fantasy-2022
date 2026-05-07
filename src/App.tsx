import { useEffect } from 'react'
import { useAppDispatch } from './store'
import { setMatches } from './store/slices/matchesSlice'
import { initializeRoster } from './store/slices/rosterSlice'
import { initializeNationTeams } from './store/slices/nationTeamsSlice'
import { useTestUtils } from './hooks/useTestUtils'
import type { RosterPlayer, RosterSquad, Match, NationalTeam } from './types/match'
import { Router } from './router'
import mockMatches from './data/matches.json'
import mockSquadsData from './data/squads.json'


function App() {
  const dispatch = useAppDispatch()
  useTestUtils() // Initialize dev test utilities

  useEffect(() => {
    // Normalize source data to match NationalTeam contract from types.
    // squads.json may omit team-level isEliminated; default to false on init.
    const allNationalTeams: NationalTeam[] = (mockSquadsData.teams || []).map((team: any) => ({
      ...team,
      isEliminated: team.isEliminated ?? false,
    }));

    // Initialize players from all national teams roster data
    // Players are functionally separate from Squads (which are user selections)
    // Players connect to national teams only through elimination logic and clean sheet bonuses
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
        countryCode: nationalTeam.countryCode,
        flag: nationalTeam.flag,
        matchPoints: {},
        totalPoints: 0,
        substitute: false,
        playerGames: [],
        injury: { status: "none", likelyUnavailable: false },
      }))
    );

    // Initialize squads from national teams data (user-selectable squad pool)
    const rosterSquads: RosterSquad[] = allNationalTeams.flatMap((nationalTeam: any) =>
      (nationalTeam.squads || []).map((s: any) => ({
        type: "squad" as const,
        id: s.teamId,
        teamId: s.teamId,
        pool: "available" as const,
        role: null,
        isEliminated: s.isEliminated || false,
        rosterElimination: s.rosterElimination || null,
        name: s.name,
        countryCode: s.countryCode,
        flag: s.flag,
        group: nationalTeam.group,
        matchPoints: {},
        totalPoints: 0,
        substitute: false,
        squadGames: [],
        groupAdvancementStatus: s.groupAdvancementStatus || null,
        coaches: s.coaches,
      }))
    );

    // Load match data and initialize national teams (source of truth for elimination cascade)
    // Pass full NationalTeam objects with nested squads and players
    dispatch(setMatches(mockMatches as Match[]))
    dispatch(initializeNationTeams(allNationalTeams))

    // Initialize roster with available players and squads extracted from national teams
    dispatch(initializeRoster({ players: rosterPlayers, squads: rosterSquads }))
  }, [dispatch])

  return <Router />
}

export default App
