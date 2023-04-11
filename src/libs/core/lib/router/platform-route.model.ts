export interface PlatformRoute {
    alternativePaths?: Array<string>
    authRequired?: boolean
    children?: Array<PlatformRoute>
    disabled?: boolean
    element: JSX.Element
    hidden?: boolean
    id?: string
    rolesRequired?: Array<string>
    route: string
    title?: string
}
