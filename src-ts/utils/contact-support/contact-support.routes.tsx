import { contactSupportPath, lazyLoad, LazyLoadedComponent, PlatformRoute } from '../../lib'

export const toolTitle: string = 'Contact Support'

const ContactSupport: LazyLoadedComponent = lazyLoad(() => import('./ContactSupport'))

export const contactSupportRoutes: Array<PlatformRoute> = [
    {
        children: [],
        element: <ContactSupport />,
        route: contactSupportPath,
        title: toolTitle,
    },
]
