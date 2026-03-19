export interface TournamentContest {
    contestId: string
    entrantIds: string[]
    problemId?: string
    problemName?: string
    winnerId?: string
}

export interface TournamentRound {
    roundNumber: number
    roundName: string
    contests: TournamentContest[]
}

export interface TournamentBracket {
    rounds: TournamentRound[]
}

export interface Tournament {
    tourneyId: string
    name: string
    numRounds: number
    initialEntrants: number
    maxContestantsPerMatch: number
    advancingContestants: number
    startDate: string
    isActive: boolean
    status: string
    publishedAt: string | null
    roundDurationMinutes: number | null
    intermissionMinutes: number | null
    bracketStructure: TournamentBracket
}

export interface CreateTournamentPayload {
    name: string
    numRounds: number
    initialEntrants: number
    maxContestantsPerMatch: number
    advancingContestants: number
}

export interface PublishTournamentPayload {
    startDateTime: string
    roundDurationMinutes: number
    intermissionMinutes: number
}

export interface TournamentRoom {
    roomId: string
    roundNumber: number
    contestId: string
    problemId: string
    problemName?: string
    deployAt: string
    scheduledOpenAt: string
    scheduledCloseAt: string
    status: string
    roomUrl: string | null
    lastError: string | null
    deployedAt: string | null
    closedAt: string | null
}

export interface TournamentRoomRound {
    roundNumber: number
    roundName: string
    rooms: TournamentRoom[]
}

export interface ActiveTournament {
    tourneyId: string
    name: string
    status: string
    startDate: string
    publishedAt: string | null
    roundDurationMinutes: number | null
    intermissionMinutes: number | null
    roomRounds: TournamentRoomRound[]
}
