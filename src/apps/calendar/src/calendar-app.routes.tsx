import { AppSubdomain, ToolTitle } from '~/config'
import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'
import { UserRole } from '~/libs/core/lib/profile/profile-functions/profile-factory/user-role.enum'

import { personalCalendarRouteId, rootRoute, teamCalendarRouteId } from './config/routes.config'

const CalendarApp: LazyLoadedComponent = lazyLoad(() => import('./CalendarApp'))
const PersonalCalendarPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/personal-calendar'),
    'PersonalCalendarPage',
)
const TeamCalendarPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/team-calendar'),
    'TeamCalendarPage',
)

export const toolTitle: string = ToolTitle.calendar

export const calendarRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: true,
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
        domain: AppSubdomain.calendar,
        element: <CalendarApp />,
        id: toolTitle,
        rolesRequired: [UserRole.topcoderStaff, UserRole.administrator],
        route: rootRoute,
        title: toolTitle,
    },
]
