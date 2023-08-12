import { FC } from 'react'
import { toast, ToastContainer } from 'react-toastify'

import { AnalyticsBrowser } from '@segment/analytics-next'
import { useViewportUnitsFix } from '~/libs/shared'
import { EnvironmentConfig } from '~/config'

import { AppFooter } from './components/app-footer'
import { AppHeader } from './components/app-header'
import { Providers } from './providers'
import { PlatformRouter } from './platform-router'

if (EnvironmentConfig.SEGMENT_ANALYTICS_KEY) {
    window.tcSegment = AnalyticsBrowser.load({ writeKey: EnvironmentConfig.SEGMENT_ANALYTICS_KEY }) as any
}

const PlatformApp: FC<{}> = () => {
    useViewportUnitsFix()

    return (
        <Providers>
            <AppHeader />
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
            <AppFooter />
        </Providers>
    )
}

export default PlatformApp
