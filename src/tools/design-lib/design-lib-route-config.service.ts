import { RouteConfig } from '../../config'

export class DesignLibRouteConfigService {

    private readonly root: string = '/'

    readonly home: string = RouteConfig.designLib

    get buttons(): string { return `buttons` }
    get fonts(): string { return `fonts` }
    get icons(): string { return `icons` }

    rooted(route: string): string {
        return `${RouteConfig.designLib}/${route}`
    }
}
