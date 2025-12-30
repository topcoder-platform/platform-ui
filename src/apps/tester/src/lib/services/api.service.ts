import axios from 'axios'

type ChallengeTypeItem = {
    id: string
    name: string
}

type ChallengeTrackItem = {
    id: string
    name: string
    track?: string
}

const testerApiBaseUrl = process.env.REACT_APP_TESTER_API_URL || '/api/tester'

const apiClient = axios.create({
    baseURL: testerApiBaseUrl,
    withCredentials: true,
})

/**
 * Fetch challenge types for ConfigForm dropdowns.
 * @returns Promise resolving to an array of { id, name } items.
 */
export const fetchChallengeTypes = async (): Promise<ChallengeTypeItem[]> => {
    const response = await apiClient.get<ChallengeTypeItem[]>('/refdata/challenge-types')
    return response.data
}

/**
 * Fetch challenge tracks for ConfigForm dropdowns.
 * @returns Promise resolving to an array of { id, name, track } items.
 */
export const fetchChallengeTracks = async (): Promise<ChallengeTrackItem[]> => {
    const response = await apiClient.get<ChallengeTrackItem[]>('/refdata/challenge-tracks')
    return response.data
}

/**
 * Fetch scorecards filtered by challenge type and track.
 * @param params - Filter parameters; challengeTrack should be a track code (for example, DEVELOP).
 * @returns Promise resolving to a scorecard response payload.
 */
export const fetchScorecards = async (
    params: { challengeType: string; challengeTrack: string },
): Promise<unknown> => {
    const response = await apiClient.get('/refdata/scorecards', { params })
    return response.data
}

/**
 * Fetch challenge reviews for a given challenge.
 * @param challengeId - Challenge identifier.
 * @param signal - Optional AbortSignal for cancellation.
 * @returns Promise resolving to parsed review JSON.
 */
export const fetchChallengeReviews = async (
    challengeId: string,
    signal?: AbortSignal,
): Promise<unknown> => {
    const response = await fetch(
        `${testerApiBaseUrl}/challenges/${encodeURIComponent(challengeId)}/reviews`,
        {
            credentials: 'include',
            signal,
        },
    )
    if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `Request failed with status ${response.status}`)
    }

    return response.json()
}

/**
 * Create an EventSource for the tester run stream.
 * @param params - URLSearchParams containing run stream query parameters.
 * @returns EventSource instance.
 */
export const createRunStream = (params: URLSearchParams): EventSource => new EventSource(
    `${testerApiBaseUrl}/run/stream?${params.toString()}`,
    { withCredentials: true },
)
