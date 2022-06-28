export const routeRoot: string = '/work'

export function routeIsActive(activePath: string, pathName: string, rootPath?: string): boolean {
    return activePath?.startsWith(pathName)
        && (pathName !== rootPath || activePath === rootPath)
}
