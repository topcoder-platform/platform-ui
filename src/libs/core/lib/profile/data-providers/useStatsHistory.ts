import useSWR, { SWRResponse } from 'swr'

import { getProfileUrl } from '../profile-functions'
import { UserStatsHistory } from '../user-stats.model'

export function useStatsHistory(handle?: string): UserStatsHistory | undefined {
    const { data }: SWRResponse = useSWR(handle ? `${getProfileUrl(handle)}/stats/history` : undefined)

    return data && data.length ? data[0] : undefined
}
