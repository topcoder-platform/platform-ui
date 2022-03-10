export class DesignLibRouteConfigService {

    private readonly root: string = '/'

    readonly buttons: string = `buttons`
    readonly fonts: string = 'fonts'
    readonly home: string = `${this.root}design-lib`
    readonly icons: string = `icons`

    rooted(route: string): string {
        return `${this.home}/${route}`
    }
}
