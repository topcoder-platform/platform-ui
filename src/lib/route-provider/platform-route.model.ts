export interface PlatformRoute {
    children: Array<PlatformRoute>
    element: JSX.Element
    enabled: boolean
    route: string
    title: string
}
