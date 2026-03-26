import qs from 'qs'
import useSWR, { SWRResponse } from 'swr'

import { memberStatsDistroURL } from '../profile-functions'

export interface UserStatsDistributionResponse {
    createdAt: string
    createdBy: string
    distribution: {
        [key: string]: number
    }
    subTrack: string
    track: string
    updatedAt: string
    updatedBy: string
}

interface UserStatsDistributionQuery {
    subTrack?: string
    track?: string
}

export function useStatsDistribution(query?: UserStatsDistributionQuery): UserStatsDistributionResponse | undefined {
    const swrKey = query ? `${memberStatsDistroURL()}?${qs.stringify(query)}` : undefined
    const { data }: SWRResponse
        = useSWR(swrKey)

    return data
}
