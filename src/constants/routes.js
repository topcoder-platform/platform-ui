import { AppSubdomain, EnvironmentConfig } from "../../src-ts/config"

// Need to re-define this in here, otherwise if we're loading it from tools/work/work.routes
// it creates a circular dependency within webpack somehow and it breaks the build
export const rootRoute = EnvironmentConfig.SUBDOMAIN === AppSubdomain.work ? '' : `/${AppSubdomain.work}`
export const selfServiceRootRoute = `${rootRoute}/self-service`
