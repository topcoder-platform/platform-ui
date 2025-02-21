/* eslint-disable ordered-imports/ordered-imports */
import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'
import { learnRoutes } from '~/apps/learn'
import { devCenterRoutes } from '~/apps/dev-center'
import { gamificationAdminRoutes } from '~/apps/gamification-admin'
import { profilesRoutes } from '~/apps/profiles'
import { talentSearchRoutes } from '~/apps/talent-search'
import { accountsRoutes } from '~/apps/accounts'
import { onboardingRoutes } from '~/apps/onboarding'
import { skillsManagerRoutes } from '~/apps/skills-manager'
import { walletRoutes } from '~/apps/wallet'
import { walletAdminRoutes } from '~/apps/wallet-admin'
import { copilotsRoutes } from '~/apps/copilots'
import { adminRoutes } from '~/apps/admin'

const Home: LazyLoadedComponent = lazyLoad(
    () => import('./routes/home'),
    'HomePage',
)

const homeRoutes: ReadonlyArray<PlatformRoute> = [
    {
        element: <Home />,
        id: 'Home page',
        route: '',
    },
]

export const platformRoutes: Array<PlatformRoute> = [
    // NOTE: Order matters here bc the active tool
    // is determined by finding the first route
    // that matches the current path
    ...onboardingRoutes,
    ...devCenterRoutes,
    ...copilotsRoutes,
    ...learnRoutes,
    ...gamificationAdminRoutes,
    ...talentSearchRoutes,
    ...profilesRoutes,
    ...walletRoutes,
    ...walletAdminRoutes,
    ...accountsRoutes,
    ...skillsManagerRoutes,
    ...homeRoutes,
    ...adminRoutes,
]
