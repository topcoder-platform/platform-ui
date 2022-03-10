export const routeRoot: string = '/'

export const routeIsActive: (activePath: string, pathName: string, rootPath?: string) => boolean
    = (activePath: string, pathName: string, rootPath: string = '/') => {
        return activePath?.startsWith(pathName)
            && (pathName !== rootPath || activePath === rootPath)
    }
