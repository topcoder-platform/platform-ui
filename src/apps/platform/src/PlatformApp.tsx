import { FC } from 'react'
import { toast, ToastContainer } from 'react-toastify'

// import '~/libs/ui/lib/styles/index.scss'

import { AppFooter } from './components/app-footer'
import { AppHeader } from './components/app-header'
import { Providers } from './providers'
import { AppRouter } from './router'

const PlatformApp: FC<{}> = () => (
    <Providers>
        <AppHeader />
        <div className='root-container'>
            <AppRouter />
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

export default PlatformApp
