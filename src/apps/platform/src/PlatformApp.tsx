import { FC, useContext } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import { useLocation } from 'react-router-dom'

import { AppSubdomain, EnvironmentConfig } from '~/config'
import { communityRootRoute } from '~/apps/community'
import { routerContext, RouterContextData } from '~/libs/core'
import { NotificationsContainer, useViewportUnitsFix } from '~/libs/shared'

import { AppFooter } from './components/app-footer'
import { AppHeader } from './components/app-header'
import { Providers } from './providers'
import { PlatformRouter } from './platform-router'

const PlatformShell: FC = () => {
    const { activeLayoutVariant }: RouterContextData = useContext(routerContext)
    const location = useLocation()
    const isCommunityRoute: boolean = EnvironmentConfig.SUBDOMAIN === AppSubdomain.community
        || (!!communityRootRoute && (
            location.pathname === communityRootRoute
            || location.pathname.startsWith(`${communityRootRoute}/`)
        ))
    const showPlatformHeaderAndFooter: boolean = activeLayoutVariant === 'standard' && !isCommunityRoute
    const headerNavType: 'tool' | 'community' = activeLayoutVariant === 'community' || isCommunityRoute
        ? 'community'
        : 'tool'

    return (
        <>
            {showPlatformHeaderAndFooter && <AppHeader navType={headerNavType} />}
            <NotificationsContainer />
            <div className='root-container'>
                <PlatformRouter />
            </div>
            <ToastContainer
                position={toast.POSITION.TOP_RIGHT}
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
            {showPlatformHeaderAndFooter && <AppFooter />}
        </>
    )
}

const PlatformApp: FC<{}> = () => {
    useViewportUnitsFix()

    return (
        <Providers>
            <PlatformShell />
        </Providers>
    )
}

export default PlatformApp
