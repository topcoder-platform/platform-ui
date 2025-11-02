import { toast } from 'react-toastify'
import { sortBy } from 'lodash'
import { useMemo } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import { Scorecard } from '../models'

const baseUrl = `${EnvironmentConfig.API.V6}`

interface ScorecardResponse {
  scorecard: Scorecard | undefined
  error?: any
  isValidating: boolean
}

export function useFetchScorecard(id: string | undefined, shouldRetry: boolean): ScorecardResponse {

    const fetcher = (url: string): Promise<Scorecard> => xhrGetAsync<Scorecard>(url)

    const { data, error, isValidating }: SWRResponse<Scorecard, any> = useSWR<Scorecard>(
        // eslint-disable-next-line unicorn/no-null
        id ? `${baseUrl}/scorecards/${id}` : null,
        fetcher,
        {
            ...(shouldRetry
                ? {}
                : {
                    errorRetryCount: 0,
                    shouldRetryOnError: false,
                }),
            onError: err => {
                toast.error(err.message)
            },
        },
    )

    const scorecard = useMemo(() => (
        data ? {
            ...data,
            minimumPassingScore: data.minimumPassingScore ?? 50,
            scorecardGroups: sortBy(data.scorecardGroups.map(group => ({
                ...group,
                sections: sortBy(group.sections.map(section => ({
                    ...section,
                    questions: sortBy(section.questions, 'sortOrder'),
                })), 'sortOrder'),
            })), 'sortOrder'),
        } : data
    ), [data])

    return {
        error,
        isValidating,
        scorecard,
    }
}
