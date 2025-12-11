import { AppSubdomain, EnvironmentConfig } from '~/config'

export const rootRoute: string
    = EnvironmentConfig.SUBDOMAIN === AppSubdomain.leaveTracker
        ? ''
        : `/${AppSubdomain.leaveTracker}`

export const personalCalendarRouteId = 'personal-calendar'
export const teamCalendarRouteId = 'team-calendar'
