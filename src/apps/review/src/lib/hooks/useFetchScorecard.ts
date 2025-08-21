import { toast } from 'react-toastify'
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
        {
            onError: err => {
                toast.error(err.message)
            },
        },
    )

    return {
        error,
        isValidating,
        scorecard: data,
    }
}
