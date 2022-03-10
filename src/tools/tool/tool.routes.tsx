import { PlatformRoute } from '../../lib'

import { Tool } from '.'

export const routes: Array<PlatformRoute> = [
    {
        children: [],
        element: <Tool />,
        enabled: true,
        route: 'tool',
        title: 'tool',
    },
]
