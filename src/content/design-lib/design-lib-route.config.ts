import { RouteConfig } from '../../config'

export class DesignLibRouteConfig {

    readonly root: string = new RouteConfig().designLib

    get buttons(): string { return `${this.root}/buttons` }
    get fonts(): string { return `${this.root}/fonts` }
    get icons(): string { return `${this.root}/icons` }
}
