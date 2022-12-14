import { ToolTitle } from '../../config'
import { contactSupportPath, lazyLoad, LazyLoadedComponent, PlatformRoute } from '../../lib'

const ContactSupport: LazyLoadedComponent = lazyLoad(() => import('./ContactSupport'))

export const contactSupportRoutes: ReadonlyArray<PlatformRoute> = [
    {
        children: [],
        element: <ContactSupport />,
        id: ToolTitle.support,
        route: contactSupportPath,
    },
]
