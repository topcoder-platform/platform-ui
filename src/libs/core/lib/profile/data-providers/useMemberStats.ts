import useSWR, { SWRResponse } from 'swr'

import { getProfileUrl } from '../profile-functions'
import { UserStats } from '../user-stats.model'

export function useMemberStats(handle?: string): UserStats | undefined {
    const { data }: SWRResponse = useSWR(handle ? `${getProfileUrl(handle)}/stats` : undefined)

    return data && data.length ? data[0] : undefined
}
