import { FC, SVGProps } from 'react'

export interface PlatformRoute {
    children: Array<PlatformRoute>
    element: JSX.Element
    enabled: boolean
    icon?: FC<SVGProps<SVGSVGElement>>
    route: string
    title: string
}
