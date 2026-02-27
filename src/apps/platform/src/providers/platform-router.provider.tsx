import { FC, ReactNode } from 'react'

import { communityRootRoute } from '~/apps/community'
import { learnRootRoute } from '~/apps/learn'
import { RouterProvider } from '~/libs/core'

import { platformRoutes } from '../platform.routes'

interface PlatformRouterProviderProps {
    children: ReactNode
}

export const PlatformRouterProvider: FC<PlatformRouterProviderProps> = props => (
    <RouterProvider
        rootCustomer={learnRootRoute ?? communityRootRoute}
        rootLoggedOut={learnRootRoute ?? communityRootRoute}
        rootMember={learnRootRoute ?? communityRootRoute}
        allRoutes={platformRoutes}
    >
        {props.children}
    </RouterProvider>
)
