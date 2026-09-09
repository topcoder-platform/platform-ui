/** Dedicated Contact host and combined-host entry point; both require an administrator. */
import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'
import { lazyLoad, LazyLoadedComponent, PlatformRoute, UserRole } from '~/libs/core'

const ContactApp: LazyLoadedComponent = lazyLoad(() => import('./ContactApp'))

export const contactRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: true,
        domain: AppSubdomain.contact,
        element: <ContactApp />,
        id: ToolTitle.contact,
        rolesRequired: [UserRole.administrator],
        route: EnvironmentConfig.SUBDOMAIN === AppSubdomain.contact ? '' : '/contact',
        title: ToolTitle.contact,
    },
]
