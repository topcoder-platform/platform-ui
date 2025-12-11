import { AppSubdomain, ToolTitle } from '~/config'
import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'
import { UserRole } from '~/libs/core/lib/profile/profile-functions/profile-factory/user-role.enum'

import { personalCalendarRouteId, rootRoute, teamCalendarRouteId } from './config/routes.config'

const LeaveTrackerApp: LazyLoadedComponent = lazyLoad(() => import('./LeaveTrackerApp'))
const PersonalCalendarPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/personal-calendar'),
)
const TeamCalendarPage: LazyLoadedComponent = lazyLoad(() => import('./pages/team-calendar'))

export const toolTitle: string = ToolTitle.leaveTracker

export const leaveTrackerRoutes: ReadonlyArray<PlatformRoute> = [
    {
        domain: AppSubdomain.leaveTracker,
        element: <LeaveTrackerApp />,
        id: toolTitle,
        route: rootRoute,
        title: toolTitle,
        authRequired: true,
        rolesRequired: [UserRole.topcoderStaff, UserRole.administrator],
        children: [
            {
                element: <PersonalCalendarPage />,
                id: personalCalendarRouteId,
                route: '',
                title: 'Personal Calendar',
            },
            {
                element: <TeamCalendarPage />,
                id: teamCalendarRouteId,
                route: 'team-calendar',
                title: 'Team Calendar',
            },
        ],
    },
]
