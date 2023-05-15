import qs from 'qs'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'

import { UserBadge } from '../user-badge.model'
import { gamificationAPIBaseURL } from '../profile-functions'

export interface UserBadgesResponse {
    count: number
    limit?: number
    offset?: number
    rows: Array<UserBadge>
}

interface UserBadgesQuery {
    limit?: number
    offset?: number
    organization_id?: string
}

const GAMIFICATION_ORG_ID: string = EnvironmentConfig.GAMIFICATION_ORG_ID

export function useMemberBadges(userId: number, query?: UserBadgesQuery): UserBadgesResponse | undefined {
    const { data }: SWRResponse
        = useSWR(
            userId
                ? `${gamificationAPIBaseURL()}/badges/assigned/${userId}?${qs.stringify({
                    // use default organization_id if not provided
                    organization_id: GAMIFICATION_ORG_ID, ...query,
                })}`
                : undefined,
        )

    return data
}
