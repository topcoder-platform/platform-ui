import { IconOutline, SectionSelectorProps } from '../../lib'

import { DesignLibRouteConfig } from './design-lib-route.config'

const routes: DesignLibRouteConfig = new DesignLibRouteConfig()

export const sections: Array<SectionSelectorProps> = [
    {
        icon: IconOutline.MailIcon,
        rootRoute: routes.root,
        route: routes.root,
        title: 'Home',
    },
    {
        icon: IconOutline.TicketIcon,
        rootRoute: routes.root,
        route: routes.buttons,
        title: 'Buttons',
    },
    {
        icon: IconOutline.ChatIcon,
        rootRoute: routes.root,
        route: routes.fonts,
        title: 'Fonts',
    },
    {
        icon: IconOutline.EyeIcon,
        rootRoute: routes.root,
        route: routes.icons,
        title: 'Icons',
    },
]
