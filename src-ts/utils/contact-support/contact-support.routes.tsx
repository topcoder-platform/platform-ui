import { Navigate } from 'react-router-dom'

import { PlatformRoute } from '../../lib'
import { routeRootLoggedOut } from '../../tools'

import { default as ContactSupport, toolTitle } from './ContactSupport'

const supportPath: string = '/support'

export const contactSupportRoutes: Array<PlatformRoute> = [
    {
        children: [],
        element: <ContactSupport />,
        enabled: true,
        route: supportPath,
        title: toolTitle,
    },
    {
        children: [],
        element: <Navigate to={supportPath} />,
        enabled: true,
        route: `${routeRootLoggedOut}${supportPath}`,
        title: 'Obsolete Self Service Support page',
    },
]
