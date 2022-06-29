import { FC, SVGProps } from 'react'

export interface PlatformRoute {
    children: Array<PlatformRoute>
    element: JSX.Element
    enabled: boolean
    hide?: boolean
    icon?: FC<SVGProps<SVGSVGElement>>
    requireAuth?: boolean
    route: string
    title: string
}
