import { FC, SVGProps } from 'react'

export interface PlatformRoute {
    children: Array<PlatformRoute>
    disabled?: boolean
    element: JSX.Element
    hide?: boolean
    requireAuth?: boolean
    route: string
    title: string
}
