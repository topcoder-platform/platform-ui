import { FC } from 'react'
import { toast, ToastContainer } from 'react-toastify'

import { AnalyticsTracker } from '~/libs/core/lib/analytics/AnalyticsTracker'
import { NotificationsContainer, useViewportUnitsFix } from '~/libs/shared'

import { AppFooter } from './components/app-footer'
import { AppHeader } from './components/app-header'
import { TopgearAccessGate } from './components/topgear-access-gate/TopgearAccessGate'
import { Providers } from './providers'
import { PlatformRouter } from './platform-router'

const PlatformApp: FC<{}> = () => {
    useViewportUnitsFix()

    return (
        <Providers>
            <AnalyticsTracker />
            <AppHeader />
            <NotificationsContainer />
            <div className='root-container'>
                <TopgearAccessGate>
                    <PlatformRouter />
                </TopgearAccessGate>
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
            <AppFooter />
        </Providers>
    )
}

export default PlatformApp
