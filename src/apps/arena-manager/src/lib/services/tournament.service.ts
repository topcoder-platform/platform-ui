import {
    ActiveTournament,
    CreateTournamentPayload,
    PublishTournamentPayload,
    ResponseObject,
    Tournament,
    TournamentRoomRound,
} from '../models'
import { arenaApiRequest } from './arena-manager.service'

export async function createTournament(
    payload: CreateTournamentPayload,
): Promise<ResponseObject<Tournament>> {
    return arenaApiRequest<Tournament>('POST', '/tourney/create', payload)
}

export async function updateTournament(
    tourneyId: string,
    payload: Tournament,
): Promise<ResponseObject<Tournament>> {
    return arenaApiRequest<Tournament>('PUT', `/tourney/${tourneyId}`, payload)
}

export async function getTournament(
    tourneyId: string,
): Promise<ResponseObject<Tournament>> {
    return arenaApiRequest<Tournament>('GET', `/tourney/${tourneyId}`)
}

export async function listTournaments(): Promise<ResponseObject<Tournament[]>> {
    return arenaApiRequest<Tournament[]>('GET', '/tourney/list')
}

export async function deleteTournament(
    tourneyId: string,
): Promise<ResponseObject<string | null>> {
    return arenaApiRequest<string | null>('DELETE', `/tourney/${tourneyId}`)
}

export async function publishTournament(
    tourneyId: string,
    payload: PublishTournamentPayload,
): Promise<ResponseObject<Tournament>> {
    return arenaApiRequest<Tournament>('POST', `/tourney/${tourneyId}/publish`, payload)
}

export async function getActiveTournament(): Promise<ResponseObject<ActiveTournament | null>> {
    return arenaApiRequest<ActiveTournament | null>('GET', '/tourney/active')
}

export async function getTournamentRooms(
    tourneyId: string,
): Promise<ResponseObject<TournamentRoomRound[] | null>> {
    return arenaApiRequest<TournamentRoomRound[] | null>('GET', `/tourney/${tourneyId}/rooms`)
}
