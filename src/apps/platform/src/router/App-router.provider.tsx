import { FC, ReactNode } from 'react'

import { learnRootRoute } from '~/apps/learn'
import { RouterProvider } from '~/libs/core'
import { selfServiceRootRoute } from '~/apps/self-service'

import { appRoutes } from './app-routes'

interface AppRouterProviderProps {
    children: ReactNode
}

export const AppRouterProvider: FC<AppRouterProviderProps> = props => (
    <RouterProvider
        rootCustomer={learnRootRoute}
        rootLoggedOut={selfServiceRootRoute}
        rootMember={learnRootRoute}
        allRoutes={appRoutes}
    >
        {props.children}
    </RouterProvider>
)
