export interface DesignLibRouteConfigModel {
    readonly buttons: string
    readonly fonts: string
    readonly home: string
    readonly icons: string
    readonly rooted: (route: string) => string
}
