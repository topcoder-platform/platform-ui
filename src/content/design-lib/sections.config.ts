import { ChatIcon, MailIcon, SectionSelectorProps, TicketIcon } from '../../lib'

import { DesignLibRouteConfig } from './design-lib-route.config'

const routes: DesignLibRouteConfig = new DesignLibRouteConfig()

export const sections: Array<SectionSelectorProps> = [
    {
        icon: MailIcon,
        route: routes.root,
        title: 'Home',
    },
    {
        icon: TicketIcon,
        route: routes.buttons,
        title: 'Buttons',
    },
    {
        icon: ChatIcon,
        route: routes.fonts,
        title: 'Fonts',
    },
    {
        icon: MailIcon,
        route: routes.icons,
        title: 'Icons',
    },
]
