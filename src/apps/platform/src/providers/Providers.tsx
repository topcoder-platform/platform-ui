import { FC, ReactNode } from 'react'

import { ProfileProvider } from '~/libs/core'

import { PlatformRouterProvider } from './platform-router.provider'

interface ProvidersProps {
    children: ReactNode
}

const Providers: FC<ProvidersProps> = props => (
    <ProfileProvider>
        <PlatformRouterProvider>
            {props.children}
        </PlatformRouterProvider>
    </ProfileProvider>
)

export default Providers
