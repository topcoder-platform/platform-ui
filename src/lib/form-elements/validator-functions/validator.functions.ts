export function emailValidator(value: string | undefined): string | undefined {

    // tslint:disable-next-line: no-useless-escape
    const emailRegex: RegExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

    // if there is no value, do not set the error
    // b/c this is an email validator, not a required
    // validator
    if (!value) {
        return undefined
    }

    return !emailRegex.test(value) ? 'invalid email' : undefined
}

export function requiredValidator(value: string | undefined): string | undefined {
    return !value ? 'required' : undefined
}
