import { UiRoute } from '../../lib'

export class DesignLibRoute {

    readonly root: string = new UiRoute().designLib

    get buttons(): string { return `${this.root}/buttons` }
    get fonts(): string { return `${this.root}/fonts` }
    get icons(): string { return `${this.root}/icons` }
}
