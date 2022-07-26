export interface PlatformRoute {
    alternativePaths?: Array<string>
    authRequired?: boolean
    children?: Array<PlatformRoute>
    customerOnly?: boolean
    disabled?: boolean
    element: JSX.Element
    hidden?: boolean
    memberOnly?: boolean
    route: string
    title?: string
}
