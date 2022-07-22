import { contactSupportPath, PlatformRoute } from '../../lib'

import { default as ContactSupport, toolTitle } from './ContactSupport'

export const contactSupportRoutes: Array<PlatformRoute> = [
    {
        children: [],
        element: <ContactSupport />,
        route: contactSupportPath,
        title: toolTitle,
    },
]
