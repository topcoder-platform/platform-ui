import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import { Scorecard } from '../models'

interface UseFetchScorecardParams {
  id: string;
}
const baseUrl = `${EnvironmentConfig.API.V6}/review`

export function useFetchScorecard(
    {
        id,
    }: UseFetchScorecardParams,
): Scorecard {

    const fetcher = (url: string): Promise<Scorecard> => xhrGetAsync<Scorecard>(url)

    const { data }: SWRResponse<Scorecard, any> = useSWR<Scorecard>(
        `${baseUrl}/scorecards/${id}`,
        fetcher,
    )

    return data as Scorecard
}
