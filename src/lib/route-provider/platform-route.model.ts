import { FC, SVGProps } from 'react'

import { PlatformRouteType } from './platform-route-type.enum'

export interface PlatformRoute {
    children: Array<PlatformRoute>
    element: JSX.Element
    enabled: boolean
    icon?: FC<SVGProps<SVGSVGElement>>
    route: string
    title: string
    type: PlatformRouteType
}
