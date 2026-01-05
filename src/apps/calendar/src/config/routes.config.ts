import { AppSubdomain, EnvironmentConfig } from '~/config'

export const rootRoute: string
    = EnvironmentConfig.SUBDOMAIN === AppSubdomain.calendar
        ? ''
        : `/${AppSubdomain.calendar}`

export const personalCalendarRouteId = 'personal-calendar'
export const teamCalendarRouteId = 'team-calendar'
