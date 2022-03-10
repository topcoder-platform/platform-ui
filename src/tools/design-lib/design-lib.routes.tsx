import { IconOutline, PlatformRoute } from '../../lib'

import { Buttons } from './buttons'
import DesignLib, { toolTitle } from './DesignLib'
import { Fonts } from './fonts'
import { Home } from './home'
import { Icons } from './icons'

export const designLibRoutes: Array<PlatformRoute> = [
    {
        children: [
            {
                children: [],
                element: <Home />,
                enabled: true,
                icon: IconOutline.MailIcon,
                route: '',
                title: 'Home',
            },
            {
                children: [],
                element: <Buttons />,
                enabled: true,
                icon: IconOutline.TicketIcon,
                route: 'buttons',
                title: 'Buttons',
            },
            {
                children: [],
                element: <Fonts />,
                enabled: true,
                icon: IconOutline.ChatIcon,
                route: 'fonts',
                title: 'Fonts',
            },
            {
                children: [],
                element: <Icons />,
                enabled: true,
                icon: IconOutline.EyeIcon,
                route: 'icons',
                title: 'Icons',
            },
        ],
        element: <DesignLib />,
        enabled: true,
        route: '/design-lib',
        title: toolTitle,
    },
]
