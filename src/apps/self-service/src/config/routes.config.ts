import { AppSubdomain, EnvironmentConfig } from '~/config'

export const rootRoute: string = EnvironmentConfig.SUBDOMAIN === AppSubdomain.work ? '' : `/${AppSubdomain.work}`
export const workRootRoute: string = rootRoute
export const workDashboardRoute: string = `${workRootRoute}/dashboard`

export const selfServiceRootRoute: string = `${workRootRoute}/self-service`
export const selfServiceStartRoute: string = `${selfServiceRootRoute}/wizard`

export const bugHuntRoute: string = 'bug-hunt/'
