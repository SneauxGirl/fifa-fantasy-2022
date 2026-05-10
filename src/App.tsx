import { useEffect } from 'react'
import { useAppDispatch } from './store'
import { setMatches, setTurnSimulation, setLoading } from './store/slices/matchesSlice'
import { initializeRoster } from './store/slices/rosterSlice'
import { initializeNationTeams } from './store/slices/nationTeamsSlice'
import { useTestUtils } from './hooks/useTestUtils'
import type { RosterPlayer, RosterSquad, Match, NationalTeam } from './types/match'
import {
  createInitialTurnSimulation,
  loadTurnSimulationFromStorage,
  persistTurnSimulationToStorage,
} from './lib/turnSimulation'
import { getDataSourcePreference } from './lib/dataSourcePreference'
import { fetchTournamentScheduleMatches } from './services/apiFootball'
import { hydrateNationalTeamsFromApi } from './services/hydrateNationalTeamsFromApi'
import { Router } from './router'
import mockMatches from './data/matches.json'
import mockSquadsData from './data/squads.json'
import { normalizeMatchesNationalTeamIds } from './lib/normalizeMatchNationalTeamIds'
import { loadPersistedScheduleOrDefault } from './lib/persistSchedule'


function App() {
  const dispatch = useAppDispatch()
  useTestUtils() // Initialize dev test utilities

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const baseNationalTeams: NationalTeam[] = (mockSquadsData.teams || []).map((team: any) => ({
        ...team,
        isEliminated: team.isEliminated ?? false,
      }))

      let allNationalTeams = baseNationalTeams
      let initialMatches: Match[] = mockMatches as Match[]

      if (getDataSourcePreference() === 'live') {
        dispatch(setLoading(true))
        try {
          initialMatches = await fetchTournamentScheduleMatches()
          allNationalTeams = await hydrateNationalTeamsFromApi(baseNationalTeams)
        } catch (err) {
          console.error('[App] Live data bootstrap failed; using bundled mock matches and JSON rosters.', err)
          initialMatches = mockMatches as Match[]
          allNationalTeams = baseNationalTeams
        } finally {
          if (!cancelled) dispatch(setLoading(false))
        }
      }

      if (cancelled) return

      initialMatches = normalizeMatchesNationalTeamIds(initialMatches, allNationalTeams)
      initialMatches = loadPersistedScheduleOrDefault(initialMatches)

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
      )

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
      )

      dispatch(setMatches(initialMatches))
      const persistedTurnSimulation = loadTurnSimulationFromStorage(initialMatches)
      const turnSimulation = persistedTurnSimulation ?? createInitialTurnSimulation(initialMatches)
      dispatch(setTurnSimulation(turnSimulation))
      if (!persistedTurnSimulation) {
        persistTurnSimulationToStorage(turnSimulation)
      }

      dispatch(initializeNationTeams(allNationalTeams))
      dispatch(initializeRoster({ players: rosterPlayers, squads: rosterSquads }))
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [dispatch])

  return <Router />
}

export default App
