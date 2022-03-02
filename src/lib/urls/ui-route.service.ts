export class UiRoute {

    readonly home: string = '/'

    get designLib(): string { return `${this.home}design-lib` }
    get selfService(): string { return `${this.home}self-service` }
    get tool(): string { return `${this.home}tool` }
    get toolSelections(): string { return `${this.home}tool-selections` }

    isActive(currentPath: string, pathName: string): boolean {
        return currentPath?.startsWith(pathName)
            && (pathName !== this.home || currentPath === this.home)
    }

    isHome(pathName: string): boolean {
        return pathName === this.home
    }

    isToolsSelection(pathName: string): boolean {
        return pathName === this.toolSelections
    }
}
