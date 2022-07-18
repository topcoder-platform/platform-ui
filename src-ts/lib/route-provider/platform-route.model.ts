export interface PlatformRoute {
    alternativePaths?: Array<string>
    children?: Array<PlatformRoute>
    customerOnly?: boolean
    disabled?: boolean
    element: JSX.Element
    memberOnly?: boolean
    requireAuth?: boolean
    route: string
    title?: string
}
