import { FC, ReactNode } from 'react'

import { learnRootRoute } from '~/apps/learn'
import { RouterProvider } from '~/libs/core'
import { selfServiceRootRoute } from '~/apps/self-service'

import { platformRoutes } from '../platform.routes'

interface PlatformRouterProviderProps {
    children: ReactNode
}

export const PlatformRouterProvider: FC<PlatformRouterProviderProps> = props => (
    <RouterProvider
        rootCustomer={learnRootRoute}
        rootLoggedOut={selfServiceRootRoute}
        rootMember={learnRootRoute}
        allRoutes={platformRoutes}
    >
        {props.children}
    </RouterProvider>
)
