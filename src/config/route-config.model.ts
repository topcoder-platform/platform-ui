export interface RouteConfigModel {
    readonly designLib: string
    readonly home: string
    readonly isActive: (activePath: string, pathName: string, rootPath: string) => boolean
    readonly isHome: (pathName: string) => boolean
    readonly selfService: string
    readonly tool: string
}
