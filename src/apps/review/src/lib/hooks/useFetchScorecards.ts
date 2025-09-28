import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import { Scorecard } from '../models'

interface UseFetchScorecardsParams {
  page: number
  perPage: number
  name?: string
  challengeTrack?: string
  scorecardType?: string
  challengeType?: string
  status?: string
}

export interface ScorecardsResponse {
  scoreCards: Scorecard[]
  metadata: any
  error?: any
  isValidating: boolean
}

const baseUrl = `${EnvironmentConfig.API.V6}`

const PAGE_SIZE = 20

export function useFetchScorecards(
    {
        page,
        perPage = PAGE_SIZE,
        name = '',
        challengeTrack = '',
        challengeType = '',
        scorecardType = '',
        status = '',
    }: UseFetchScorecardsParams,
): ScorecardsResponse {
    const query = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
        ...(name ? { name } : {}),
        ...(scorecardType ? { scorecardType } : {}),
        ...(challengeTrack ? { challengeTrack } : {}),
        ...(challengeType ? { challengeType } : {}),
        ...(status ? { status } : {}),
    })

    const fetcher = (url: string): Promise<ScorecardsResponse> => xhrGetAsync<ScorecardsResponse>(url)

    const { data, error, isValidating }: SWRResponse<ScorecardsResponse, any> = useSWR<ScorecardsResponse>(
        `${baseUrl}/scorecards?${query.toString()}`,
        fetcher,
    )

    return {
        error,
        isValidating,
        metadata: data?.metadata,
        scoreCards: data?.scoreCards?.map(scorecard => ({
            ...scorecard,
            minimumPassingScore: scorecard.minimumPassingScore ?? 50,
        })) || [],
    }
}
