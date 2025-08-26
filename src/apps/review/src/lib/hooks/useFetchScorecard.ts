import { sortBy } from 'lodash'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import { Scorecard } from '../models'

const baseUrl = `${EnvironmentConfig.API.V6}/review`

interface ScorecardResponse {
  scorecard: Scorecard | undefined
  error?: any
  isValidating: boolean
}

export function useFetchScorecard(id: string | undefined): ScorecardResponse {

    const fetcher = (url: string): Promise<Scorecard> => xhrGetAsync<Scorecard>(url)

    const { data, error, isValidating }: SWRResponse<Scorecard, any> = useSWR<Scorecard>(
        // eslint-disable-next-line unicorn/no-null
        id ? `${baseUrl}/scorecards/${id}` : null,
        fetcher,
    )

    return {
        error,
        isValidating,
        scorecard: data ? {
            ...data,
            scorecardGroups: sortBy(data.scorecardGroups.map(group => ({
                ...group,
                sections: sortBy(group.sections.map(section => ({
                    ...section,
                    questions: sortBy(section.questions, 'sortOrder'),
                })), 'sortOrder'),
            })), 'sortOrder'),
        } : data,
    }
}
