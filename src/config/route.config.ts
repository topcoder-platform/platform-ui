export class RouteConfig {

    readonly home: string = '/'

    get designLib(): string { return `${this.home}design-lib` }
    get selfService(): string { return `${this.home}self-service` }
    get tool(): string { return `${this.home}tool` }
    get toolSelectors(): string { return `${this.home}tool-selectors` }

    isActive(currentPath: string, pathName: string): boolean {
        return currentPath?.startsWith(pathName)
            && (pathName !== this.home || currentPath === this.home)
    }

    isHome(pathName: string): boolean {
        return pathName === this.home
    }

    isToolsSelection(pathName: string): boolean {
        return pathName === this.toolSelectors
    }
}
