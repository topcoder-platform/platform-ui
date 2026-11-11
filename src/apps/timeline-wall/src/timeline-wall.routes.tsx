import { FC } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'
import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'

const TimelineWall: LazyLoadedComponent = lazyLoad(() => import('./TimelineWall'))
export const timelineWallRoot = EnvironmentConfig.SUBDOMAIN === AppSubdomain.timelineWall ? '' : '/timeline-wall'

const LegacyTimelineRedirect: FC = () => {
    const location = useLocation()
    return <Navigate replace to={`/timeline-wall${location.search}${location.hash}`} />
}

export const timelineWallRoutes: ReadonlyArray<PlatformRoute> = [
    {
        domain: AppSubdomain.timelineWall,
        element: <TimelineWall />,
        id: ToolTitle.timelineWall,
        route: timelineWallRoot,
        title: ToolTitle.timelineWall,
    },
    {
        element: <LegacyTimelineRedirect />,
        id: 'Legacy timeline wall',
        route: '/community/timeline-wall',
    },
]
