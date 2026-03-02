import { FC, useContext, useEffect, useMemo } from 'react'
import {
    Outlet,
    Routes,
    useLocation,
    useNavigate,
} from 'react-router-dom'

import { AppSubdomain, EnvironmentConfig } from '~/config'
import { routerContext, RouterContextData } from '~/libs/core'

import { resolveCommunityIdFromHost } from './config/community-id.config'
import {
    communityLoaderRouteId,
    rootRoute,
} from './config/routes.config'
import { Layout, type LayoutVariant } from './lib'
import { toolTitle } from './community-app.routes'
import './lib/styles/index.scss'

function withLeadingSlash(path: string): string {
    return path.startsWith('/')
        ? path
        : `/${path}`
}

function normalizePath(path: string): string {
    const collapsed = path.replace(/\/{2,}/g, '/')
    if (collapsed.length > 1 && collapsed.endsWith('/')) {
        return collapsed.slice(0, -1)
    }

    return collapsed || '/'
}

/**
 * Root shell for the community app routes.
 *
 * @returns The app layout and routed child content.
 */
const CommunityApp: FC = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    const location = useLocation()
    const navigate = useNavigate()
    const childRoutes = useMemo(() => getChildRoutes(toolTitle), [getChildRoutes])
    const routedCommunityId = useMemo(
        () => resolveCommunityIdFromHost(window.location.host),
        [],
    )
    const communityBasePath = useMemo(
        () => normalizePath(withLeadingSlash(rootRoute)),
        [],
    )
    const normalizedPath = useMemo(
        () => normalizePath(location.pathname),
        [location.pathname],
    )
    const isCommunityPage = normalizedPath.includes(`/${communityLoaderRouteId}`)

    const variant: LayoutVariant
        = EnvironmentConfig.SUBDOMAIN !== AppSubdomain.community
            && !isCommunityPage
            ? 'standard'
            : 'community'

    useEffect(() => {
        if (!routedCommunityId || isCommunityPage) {
            return
        }

        const isRootPath = normalizedPath === '/'
            || normalizedPath === communityBasePath
        if (!isRootPath) {
            return
        }

        const destination = normalizePath(
            `${communityBasePath}/${communityLoaderRouteId}/${routedCommunityId}`,
        )
        navigate(destination, { replace: true })
    }, [
        communityBasePath,
        isCommunityPage,
        navigate,
        normalizedPath,
        routedCommunityId,
    ])

    useEffect(() => {
        document.body.classList.add('community-app')
        return () => {
            document.body.classList.remove('community-app')
        }
    }, [])

    return (
        <Layout variant={variant}>
            <Outlet />
            {childRoutes.length > 0 && <Routes>{childRoutes}</Routes>}
        </Layout>
    )
}

export default CommunityApp
