import { xhrGetPaginatedAsync } from '~/libs/core'

import { CHALLENGE_TRACKS_API_URL } from '../constants'
import { Track } from '../models'

function normalizeError(error: unknown, fallbackMessage: string): Error {
    const typedError = error as {
        message?: string
        response?: {
            data?: {
                message?: string
            }
        }
    }

    const errorMessage = typedError?.response?.data?.message
        || typedError?.message
        || fallbackMessage

    return new Error(errorMessage)
}

function normalizeTrack(track: Partial<Track>): Track | undefined {
    if (!track.id || !track.name) {
        return undefined
    }

    return {
        abbreviation: track.abbreviation,
        id: track.id,
        isActive: Boolean(track.isActive),
        name: track.name,
        track: track.track,
    }
}

export async function fetchChallengeTracks(): Promise<Track[]> {
    try {
        const response = await xhrGetPaginatedAsync<Track[]>(CHALLENGE_TRACKS_API_URL)

        const tracks = response.data || []

        return tracks
            .map(track => normalizeTrack(track))
            .filter((track): track is Track => !!track)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch challenge tracks')
    }
}
