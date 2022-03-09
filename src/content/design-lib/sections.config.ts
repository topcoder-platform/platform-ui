import { ChatIcon, MailIcon, SectionSelectorProps, TicketIcon } from '../../lib'

import { DesignLibRouteConfig } from './design-lib-route.config'

const routes: DesignLibRouteConfig = new DesignLibRouteConfig()

export const sections: Array<SectionSelectorProps> = [
    {
        icon: MailIcon,
        rootRoute: routes.root,
        route: routes.root,
        title: 'Home',
    },
    {
        icon: TicketIcon,
        rootRoute: routes.root,
        route: routes.buttons,
        title: 'Buttons',
    },
    {
        icon: ChatIcon,
        rootRoute: routes.root,
        route: routes.fonts,
        title: 'Fonts',
    },
    {
        icon: MailIcon,
        rootRoute: routes.root,
        route: routes.icons,
        title: 'Icons',
    },
]
