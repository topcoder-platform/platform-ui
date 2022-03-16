import { getFormInput } from '../form-functions'

export function email(value: string | undefined): string | undefined {

    const emailRegex: RegExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

    // if there is no value, do not set the error
    // b/c this is an email validator, not a required
    // validator
    if (!value) {
        return undefined
    }

    return !emailRegex.test(value) ? 'invalid email' : undefined
}

export function required(value: string | undefined): string | undefined {
    return !value ? 'required' : undefined
}

export function requiredIfOther(value: string | undefined, formElements?: HTMLFormControlsCollection, otherFieldName?: string): string | undefined {

    // if there are no form values or an other field name, we have a problem
    if (!formElements || !otherFieldName) {
        throw new Error(`Cannot use the required if other validator if there isn't both formValues (${formElements}) and an otherFieldName (${otherFieldName})`)
    }

    // if there is a value, there's no need to check the other input
    if (!!value) {
        return undefined
    }

    // get the other form field
    const otherField: HTMLInputElement = getFormInput(formElements, otherFieldName)

    // if there is no other field, we have a problem
    if (!otherField) {
        throw new Error(`Cannot use the required if other validator if the otherField (${otherFieldName}) doesn't exist on the form`)
    }

    // if the other field doesn't have a value, then we're good
    if (!otherField.value) {
        return undefined
    }

    // get the label of the dependent field
    const otherFieldLabel: string = otherField.labels?.[0].firstChild?.nodeValue || otherFieldName

    return `required when ${otherFieldLabel} is not blank`
}
