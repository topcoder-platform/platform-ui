import { IconOutline, SectionSelectorProps } from '../../lib'

import { default as DesignLibRouteConfig } from './design-lib-route.config'

export const sections: Array<SectionSelectorProps> = [
    {
        icon: IconOutline.MailIcon,
        rootRoute: DesignLibRouteConfig.home,
        route: DesignLibRouteConfig.home,
        title: 'Home',
    },
    {
        icon: IconOutline.TicketIcon,
        rootRoute: DesignLibRouteConfig.home,
        route: DesignLibRouteConfig.rooted(DesignLibRouteConfig.buttons),
        title: 'Buttons',
    },
    {
        icon: IconOutline.ChatIcon,
        rootRoute: DesignLibRouteConfig.home,
        route: DesignLibRouteConfig.rooted(DesignLibRouteConfig.fonts),
        title: 'Fonts',
    },
    {
        icon: IconOutline.EyeIcon,
        rootRoute: DesignLibRouteConfig.home,
        route: DesignLibRouteConfig.rooted(DesignLibRouteConfig.icons),
        title: 'Icons',
    },
]
