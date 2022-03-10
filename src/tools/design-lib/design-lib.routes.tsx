import { PlatformRoute } from '../../lib'

import { Buttons } from './buttons'
import { default as DesignLibRouteConfig } from './design-lib-route.config'
import DesignLib from './DesignLib'
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
                route: '',
                title: 'Home',
            },
            {
                children: [],
                element: <Buttons />,
                enabled: true,
                route: DesignLibRouteConfig.buttons,
                title: 'Buttons',
            },
            {
                children: [],
                element: <Fonts />,
                enabled: true,
                route: DesignLibRouteConfig.fonts,
                title: 'Fonts',
            },
            {
                children: [],
                element: <Icons />,
                enabled: true,
                route: DesignLibRouteConfig.icons,
                title: 'Icons',
            },
        ],
        element: <DesignLib />,
        enabled: true,
        route: DesignLibRouteConfig.home,
        title: 'Design Library',
    },
]
