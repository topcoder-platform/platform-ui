import { contactSupportPath, lazyLoad, PlatformRoute } from '../../lib'

export const toolTitle: string = 'Contact Support'

const ContactSupport = lazyLoad(() => import('./ContactSupport'));

export const contactSupportRoutes: Array<PlatformRoute> = [
    {
        children: [],
        element: <ContactSupport />,
        route: contactSupportPath,
        title: toolTitle,
    },
]
