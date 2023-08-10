import { FC } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import ReactHeap from 'reactjs-heap'

import { useViewportUnitsFix } from '~/libs/shared'
import { EnvironmentConfig } from '~/config'

import { AppFooter } from './components/app-footer'
import { AppHeader } from './components/app-header'
import { Providers } from './providers'
import { PlatformRouter } from './platform-router'

console.log(`Initializing HEAP: ${EnvironmentConfig.HEAP_ANALYTICS_KEY}`)
if (EnvironmentConfig.HEAP_ANALYTICS_KEY) {
    ReactHeap.initialize(EnvironmentConfig.HEAP_ANALYTICS_KEY)
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
