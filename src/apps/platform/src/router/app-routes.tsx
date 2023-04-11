import { PlatformRoute } from '~/libs/core'
import { learnRoutes as topcoderAcademyRoutes } from '~/apps/learn'
import { devCenterRoutes } from '~/apps/dev-center'
import { gamificationAdminRoutes } from '~/apps/gamification-admin'
import { earnRoutes } from '~/apps/earn'
import { selfServiceRoutes } from '~/apps/self-service'

import { platformRoutes } from '../platform.routes'

export const appRoutes: Array<PlatformRoute> = [
    // NOTE: Order matters here bc the active tool
    // is determined by finding the first route
    // that matches the current path
    ...selfServiceRoutes,
    ...devCenterRoutes,
    ...earnRoutes,
    ...topcoderAcademyRoutes,
    ...gamificationAdminRoutes,
    ...platformRoutes,
]
