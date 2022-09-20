import { EnvironmentConfig } from '../../../config'
import { InfinitePageDao, InfinitePageHandler, Sort, useGetInfinitePage } from '../../../lib'
import { GamificationConfig } from '../game-config'

import { GameBadge } from './game-badge.model'

export function useGetGameBadgesPage(sort: Sort): InfinitePageHandler<GameBadge> {

    function getKey(index: number, previousPageData: InfinitePageDao<GameBadge>): string | undefined {

        // reached the end
        if (!!previousPageData && !previousPageData.rows.length) {
            return undefined
        }

        const params: Record<string, string> = {
            limit: `${GamificationConfig.PAGE_SIZE}`,
            offset: `${index * GamificationConfig.PAGE_SIZE}`,
            order_by: sort.fieldName,
            order_type: sort.direction,
            organization_id: GamificationConfig.ORG_ID,
        }

        const badgeEndpointUrl: URL = new URL(`${EnvironmentConfig.API.V5}/gamification/badges?${new URLSearchParams(params)}`)

        return badgeEndpointUrl.toString()
    }

    return useGetInfinitePage(getKey)
}
