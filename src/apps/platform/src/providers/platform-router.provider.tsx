import { FC, ReactNode } from 'react'

import { learnRootRoute } from '~/apps/learn'
import { RouterProvider } from '~/libs/core'

import { platformRoutes } from '../platform.routes'

interface PlatformRouterProviderProps {
    children: ReactNode
}

export const PlatformRouterProvider: FC<PlatformRouterProviderProps> = props => (
    <RouterProvider
        rootCustomer={learnRootRoute}
        rootLoggedOut={learnRootRoute}
        rootMember={learnRootRoute}
        allRoutes={platformRoutes}
    >
        {props.children}
    </RouterProvider>
)
