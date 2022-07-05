export interface PlatformRoute {
    children?: Array<PlatformRoute>
    customerOnly?: boolean
    disabled?: boolean
    element: JSX.Element
    hide?: boolean
    memberOnly?: boolean
    requireAuth?: boolean
    route: string
    title: string
}
