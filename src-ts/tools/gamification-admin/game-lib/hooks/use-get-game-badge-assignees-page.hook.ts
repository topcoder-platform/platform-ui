import { EnvironmentConfig } from '../../../../config'
import { InfinitePageDao, InfinitePageHandler, Sort, useGetInfinitePage } from '../../../../lib'
import { GamificationConfig } from '../../game-config'
import { GameBadge, MemberBadgeAward } from '../game-badge.model'

export function useGetGameBadgeAssigneesPage(badge: GameBadge, sort: Sort): InfinitePageHandler<MemberBadgeAward> {

    function getKey(index: number, previousPageData: InfinitePageDao<MemberBadgeAward>): string | undefined {

        // reached the end
        if (!!previousPageData && !previousPageData.rows.length) {
            return undefined
        }

        const params: Record<string, string> = {
            limit: `${GamificationConfig.PAGE_SIZE}`,
            offset: `${index * GamificationConfig.PAGE_SIZE}`,
            order_by: sort.fieldName,
            order_type: sort.direction,
        }

        const badgeEndpointUrl: URL = new URL(
            `${EnvironmentConfig.API.V5}/gamification/badges/${badge.id}/assignees?${new URLSearchParams(params)}`,
        )

        return badgeEndpointUrl.toString()
    }

    return useGetInfinitePage(getKey)
}
