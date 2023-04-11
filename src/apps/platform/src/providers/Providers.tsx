import { FC, ReactNode } from 'react'

import { ProfileProvider } from '~/libs/core'

import { AppRouterProvider } from '../router/App-router.provider'

interface ProvidersProps {
    children: ReactNode
}

const Providers: FC<ProvidersProps> = props => (
    <ProfileProvider>
        <AppRouterProvider>
            {props.children}
        </AppRouterProvider>
    </ProfileProvider>
)

export default Providers
