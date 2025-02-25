import { StrictMode } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Auth0Provider } from '@auth0/auth0-react'

import { PlatformApp } from '~/apps/platform'

const root: Root = createRoot(document.getElementById('root') as Element)

root.render(
  <StrictMode>
    <BrowserRouter>
      <Auth0Provider
        domain="https://accounts-auth0.topcoder-dev.com"          // e.g. "dev-abc123.us.auth0.com"
        clientId="305384"       // e.g. "abc123XYZ"
        // redirectUri={window.location.origin}
      >
        <PlatformApp />
      </Auth0Provider>
    </BrowserRouter>
  </StrictMode>,
)
