import { formGetInput } from '../form-functions'

export function doesNotMatchOther(value: string | undefined, formElements?: HTMLFormControlsCollection, otherFieldName?: string): string | undefined {

    // if there is no value, there's no need to check the other input
    // bc this is a match validator not a required validator
    if (!value) {
        return undefined
    }

    // get the other form field
    const otherField: HTMLInputElement = getOtherField(formElements, otherFieldName)

    // if the other field doesn't match the current value, then we're good
    if (otherField.value !== value) {
        return undefined
    }

    return `cannot match the ${getOtherFieldLabel(otherField, otherFieldName)} value`
}

export function email(value: string | undefined): string | undefined {

    // if there is no value, do not set the error
    // b/c this is an email validator, not a required
    // validator
    if (!value) {
        return undefined
    }

    const emailRegex: RegExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

    return !emailRegex.test(value) ? 'invalid email' : undefined
}

export function password(value: string | undefined): string | undefined {

    // if there is no value, do not set the error
    // b/c this is an email validator, not a required
    // validator
    if (!value) {
        return undefined
    }

    // PASSWORD RULES
    // - min of 8 characters
    // - at least 1 letter
    // - at least 1 symbol or number
    const passwordRegex: RegExp = /^(?=.*[a-zA-Z])(?=.*[#$^+=!*()@%&\d]).{8,}$/g

    return !passwordRegex.test(value) ? 'password must contain >= 8 characters, >= 1 letter, and >= 1 number or symbol' : undefined
}

export function matchOther(value: string | undefined, formElements?: HTMLFormControlsCollection, otherFieldName?: string): string | undefined {

    // if there is no value, there's no need to check the other input
    // bc this is a match validator not a required validator
    if (!value) {
        return undefined
    }

    // get the other form field
    const otherField: HTMLInputElement = getOtherField(formElements, otherFieldName)

    // if the other field matches the current value, then we're good
    if (otherField.value === value) {
        return undefined
    }

    return `does not match the ${getOtherFieldLabel(otherField, otherFieldName)} value`
}

export function required(value: string | undefined): string | undefined {
    return !value ? 'required' : undefined
}

export function requiredIfOther(value: string | undefined, formElements?: HTMLFormControlsCollection, otherFieldName?: string): string | undefined {

    // if there is a value, there's no need to check the other input
    if (!!value) {
        return undefined
    }

    // if the other field doesn't have a value, then we're good
    const otherField: HTMLInputElement = getOtherField(formElements, otherFieldName)
    if (!otherField.value) {
        return undefined
    }

    return `required when ${getOtherFieldLabel(otherField, otherFieldName)} is not blank`
}

export function sslUrl(value: string | undefined): string | undefined {

    // if there's no value, there's nothing to check
    if (!value) {
        return undefined
    }

    try {

        // require https
        return new URL(value).protocol !== 'https:' ? 'links must start with https' : undefined

    } catch {
        return 'invalid url'
    }
}

export type ValidatorFn = Array<(value: string | undefined, formValues?: HTMLFormControlsCollection, otherField?: string)
    => string | undefined | Promise<string | undefined>>

function getOtherField(formElements?: HTMLFormControlsCollection, otherFieldName?: string): HTMLInputElement {

    // if there are no form values or an other field name, we have a problem
    if (!formElements || !otherFieldName) {
        throw new Error(`Cannot use the required if other validator if there isn't both formValues (${formElements}) and an otherFieldName (${otherFieldName})`)
    }

    // get the other form field
    const otherField: HTMLInputElement = formGetInput(formElements, otherFieldName)

    // if there is no other field, we have a problem
    if (!otherField) {
        throw new Error(`Cannot use the required if other validator if the otherField (${otherFieldName}) doesn't exist on the form`)
    }

    return otherField
}

function getOtherFieldLabel(otherField: HTMLInputElement, otherFieldName?: string): string {
    return otherField.labels?.[0].firstChild?.nodeValue || otherFieldName as string
}
