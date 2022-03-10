import { PlatformRoute } from '../../lib'

import { SelfService } from './'

export const routes: Array<PlatformRoute> = [
    {
        children: [],
        element: <SelfService />,
        enabled: true,
        route: 'self-service',
        title: 'Self Service',
    },
]
