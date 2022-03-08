export class RouteConfig {

    readonly home: string = '/'

    get designLib(): string { return `${this.home}design-lib` }
    get selfService(): string { return `${this.home}self-service` }
    get tool(): string { return `${this.home}tool` }
    get toolSelectors(): string { return `${this.home}tool-selectors` }

    isActive(activePath: string, pathName: string, rootPath: string = this.home): boolean {
        return activePath?.startsWith(pathName)
            && (pathName !== rootPath || activePath === rootPath)
    }

    isHome(pathName: string): boolean {
        return pathName === this.home
    }

    isToolsSelection(pathName: string): boolean {
        return pathName === this.toolSelectors
    }
}
