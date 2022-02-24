// disable alpha member ordering for this file
// so we can use prior constants to form new constants
// tslint:disable: member-ordering
export class UiRoute {

    // home
    readonly home: string = '/'

    // design lib
    readonly designLib: string = `${this.home}design-lib`
    readonly designLibFonts: string = `${this.designLib}/fonts`

    // profile
    readonly login: string = `https://accounts-auth0.topcoder-dev.com?retUrl=${encodeURIComponent(window.location.href.match(/[^?]*/)?.[0] || this.home)}`
    readonly signup: string = `${this.login}&regSource=tcBusiness&mode=signUp`
}
