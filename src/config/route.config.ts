export class RouteConfig {

    readonly home: string = '/'

    get designLib(): string { return `${this.home}design-lib` }
    get selfService(): string { return `${this.home}self-service` }
    get tool(): string { return `${this.home}tool` }
    get toolSelectors(): string { return `${this.home}tool-selectors` }

    isActive(currentPath: string, pathName: string, routePath: string): boolean {
        return currentPath?.startsWith(pathName)
            && (pathName !== routePath || currentPath === routePath)
    }

    isHome(pathName: string): boolean {
        return pathName === this.home
    }

    isToolsSelection(pathName: string): boolean {
        return pathName === this.toolSelectors
    }
}
