import { IconOutline, PlatformRoute, PlatformRouteType } from '../../lib'

import { Buttons } from './buttons'
import { default as DesignLibRouteConfig } from './design-lib-route.config'
import DesignLib, { toolTitle } from './DesignLib'
import { Fonts } from './fonts'
import { Home } from './home'
import { Icons } from './icons'

export const routes: Array<PlatformRoute> = [
    {
        children: [
            {
                children: [],
                element: <Home />,
                enabled: true,
                icon: IconOutline.MailIcon,
                route: '',
                title: 'Home',
                type: PlatformRouteType.tool,
            },
            {
                children: [],
                element: <Buttons />,
                enabled: true,
                icon: IconOutline.TicketIcon,
                route: DesignLibRouteConfig.buttons,
                title: 'Buttons',
                type: PlatformRouteType.tool,
            },
            {
                children: [],
                element: <Fonts />,
                enabled: true,
                icon: IconOutline.ChatIcon,
                route: DesignLibRouteConfig.fonts,
                title: 'Fonts',
                type: PlatformRouteType.tool,
            },
            {
                children: [],
                element: <Icons />,
                enabled: true,
                icon: IconOutline.EyeIcon,
                route: DesignLibRouteConfig.icons,
                title: 'Icons',
                type: PlatformRouteType.tool,
            },
        ],
        element: <DesignLib />,
        enabled: true,
        route: DesignLibRouteConfig.home,
        title: toolTitle,
        type: PlatformRouteType.tool,
    },
]
