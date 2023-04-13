import { EnvironmentConfig } from '~/config'
import { InfinitePageDao, InfinitePageHandler, Sort, useGetInfinitePage } from '~/libs/ui'

import { GameBadge } from '../game-badge.model'
import { ORG_ID, PAGE_SIZE } from '../../config'

export function useGetGameBadgesPage(sort: Sort): InfinitePageHandler<GameBadge> {

    function getKey(index: number, previousPageData: InfinitePageDao<GameBadge>): string | undefined {

        // reached the end
        if (!!previousPageData && !previousPageData.rows.length) {
            return undefined
        }

        const params: Record<string, string> = {
            limit: `${PAGE_SIZE}`,
            offset: `${index * PAGE_SIZE}`,
            order_by: sort.fieldName,
            order_type: sort.direction,
            organization_id: ORG_ID,
        }

        const badgeEndpointUrl: URL = new URL(
            `${EnvironmentConfig.API.V5}/gamification/badges?${new URLSearchParams(params)}`,
        )

        return badgeEndpointUrl.toString()
    }

    return useGetInfinitePage(getKey)
}
