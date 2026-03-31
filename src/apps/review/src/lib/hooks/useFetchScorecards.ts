import useSWR, { SWRResponse } from 'swr'

import {
    fetchScorecards,
    FetchScorecardsParams,
    ScorecardsResponse as FetchScorecardsResponse,
} from '../services'

type UseFetchScorecardsParams = FetchScorecardsParams

export interface ScorecardsResponse extends FetchScorecardsResponse {
    error?: any
    isValidating: boolean
}

export function useFetchScorecards(
    {
        page,
        perPage,
        name = '',
        challengeTrack = '',
        challengeType = '',
        scorecardType = '',
        status = '',
    }: UseFetchScorecardsParams,
): ScorecardsResponse {
    const params: FetchScorecardsParams = {
        challengeTrack,
        challengeType,
        name,
        page,
        perPage,
        scorecardType,
        status,
    }

    const { data, error, isValidating }: SWRResponse<FetchScorecardsResponse, any> = useSWR<FetchScorecardsResponse>(
        ['scorecards', params],
        () => fetchScorecards(params),
    )

    return {
        error,
        isValidating,
        metadata: data?.metadata,
        scoreCards: data?.scoreCards || [],
    }
}
