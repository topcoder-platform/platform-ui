import { StrictMode } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import { PlatformApp } from '~/apps/platform'

const root: Root = createRoot(document.getElementById('root') as Element)

root.render(
    <StrictMode>
        <BrowserRouter>
            <PlatformApp />
        </BrowserRouter>
    </StrictMode>,
)
