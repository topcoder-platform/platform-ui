import { FC, ReactNode } from 'react'

import { authUrlLogout, ProfileProvider } from '~/libs/core'
import { ConfigContextProvider } from '~/libs/shared'

import { PlatformRouterProvider } from './platform-router.provider'

interface ProvidersProps {
    children: ReactNode
}

const Providers: FC<ProvidersProps> = props => (
    <ConfigContextProvider logoutUrl={authUrlLogout}>
        <ProfileProvider>
            <PlatformRouterProvider>
                {props.children}
            </PlatformRouterProvider>
        </ProfileProvider>
    </ConfigContextProvider>
)

export default Providers
