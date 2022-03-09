export class RouteConfigService {

    private readonly root: string = '/'

    get designLib(): string { return `${this.root}design-lib` }
    get home(): string { return this.root }
    get selfService(): string { return `${this.root}self-service` }
    get tool(): string { return `${this.root}tool` }

    isActive(activePath: string, pathName: string, rootPath: string = this.root): boolean {
        return activePath?.startsWith(pathName)
            && (pathName !== rootPath || activePath === rootPath)
    }

    isHome(pathName: string): boolean {
        return pathName === this.root
    }
}
