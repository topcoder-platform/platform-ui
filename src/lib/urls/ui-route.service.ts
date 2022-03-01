
export class UiRoute {

    readonly home: string = '/'

    get designLib(): string { return `${this.home}design-lib` }
    get designLibFonts(): string { return `${this.designLib}/fonts` }
    get selfService(): string { return `${this.home}self-service` }
    get tool(): string { return `${this.home}tool` }

    isActive(currentPath: string, pathName: string): boolean {
        return currentPath?.startsWith(pathName)
            && (pathName !== this.home || currentPath === this.home)
    }

    isHome(pathName: string): boolean {
        return pathName === this.home
    }
}
