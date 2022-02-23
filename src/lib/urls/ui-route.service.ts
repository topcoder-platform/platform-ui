// disable alpha member ordering for this file
// so we can use prior constants to form new constants
// tslint:disable: member-ordering
export class UiRoute {

    // home
    readonly home: string = '/'

    // design lib
    readonly designLib: string = `${this.home}'/design-lib'`
    readonly designLibFonts: string = `${this.designLib}/fonts`
}
