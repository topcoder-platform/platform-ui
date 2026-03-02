import { FC, useContext, useEffect, useMemo } from 'react'
import { Outlet, Routes, useParams } from 'react-router-dom'

import {
    authUrlLogin,
    profileContext,
    ProfileContextData,
    routerContext,
    RouterContextData,
} from '~/libs/core'
import { LoadingSpinner } from '~/libs/ui'

import { communityLoaderRouteId } from '../../../config/routes.config'
import { TOPGEAR_REDIRECT_URL } from '../../../config/index.config'
import {
    useCommunityMeta,
    useUserGroups,
} from '../../../lib/hooks'
import {
    AccessDenied,
    AccessDeniedCause,
    CommunityLayout,
} from '../../../lib/components'
import { CommunityContextProvider } from '../CommunityContext'

interface CommunityLoaderProps {
    communityId?: string
    routeId?: string
}

/**
 * Checks whether two string lists have any shared value.
 *
 * @param left First list.
 * @param right Second list.
 * @returns True when at least one item exists in both lists.
 */
function hasIntersection(left: string[], right: string[]): boolean {
    if (!left.length || !right.length) {
        return false
    }

    const values = new Set(left)
    return right.some(value => values.has(value))
}

/**
 * Community route loader that resolves metadata, applies access checks and renders children.
 * The community layout base URL is derived from the resolved `communityId` and effective route id.
 * Anonymous users can continue to child routes, where route-level `authRequired` controls public/private access.
 * Authenticated users who are not in `authorizedGroupIds` are shown a not-authorized screen.
 * The `wipro` community always redirects to TopGear (or to login if unauthenticated).
 *
 * @param props Optional fixed community and route ids for static route wiring.
 * @returns Community shell with nested routes or access denied state.
 */
const CommunityLoader: FC<CommunityLoaderProps> = (props: CommunityLoaderProps) => {
    const { communityId: routeCommunityId }: { communityId?: string } = useParams<{ communityId: string }>()
    const communityId = props.communityId ?? routeCommunityId
    const routeParentId = props.routeId ?? communityLoaderRouteId
    const baseUrl = `/${routeParentId}/${communityId}`
    const { profile }: ProfileContextData = useContext(profileContext)
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(
        () => getChildRoutes(routeParentId),
        [routeParentId, getChildRoutes],
    )
    const {
        communityMeta,
        isLoading: isLoadingCommunityMeta,
    }: ReturnType<typeof useCommunityMeta> = useCommunityMeta(communityId)
    const {
        groupIds,
        isLoading: isLoadingGroups,
    }: ReturnType<typeof useUserGroups> = useUserGroups(profile?.userId)

    useEffect(() => {
        if (communityId !== 'wipro') {
            return
        }

        if (profile) {
            window.location.href = TOPGEAR_REDIRECT_URL
            return
        }

        window.location.href = authUrlLogin(window.location.href)
    }, [communityId, profile])

    if (!communityId || communityId === 'wipro') {
        return <LoadingSpinner />
    }

    if (isLoadingCommunityMeta || isLoadingGroups) {
        return <LoadingSpinner />
    }

    if (!communityMeta) {
        return <AccessDenied cause={AccessDeniedCause.NOT_AUTHORIZED} />
    }

    const isMember = hasIntersection(
        communityMeta.groupIds ?? [],
        groupIds,
    )
    const authorizedGroupIds = communityMeta.authorizedGroupIds ?? []
    const isAuthorized = hasIntersection(authorizedGroupIds, groupIds)

    if (authorizedGroupIds.length > 0 && profile && !isAuthorized) {
        return <AccessDenied cause={AccessDeniedCause.NOT_AUTHORIZED} />
    }

    return (
        <CommunityContextProvider
            value={{
                isMember,
                meta: communityMeta,
            }}
        >
            <CommunityLayout
                baseUrl={baseUrl}
                meta={communityMeta}
            >
                <Outlet />
                <Routes>
                    {childRoutes}
                </Routes>
            </CommunityLayout>
        </CommunityContextProvider>
    )
}

export default CommunityLoader
