export interface TextInputModel {
    dependentFields?: Array<string>
    dirty?: boolean
    disabled?: boolean
    error?: string
    label?: string
    name: string
    placeholder?: string
    preventAutocomplete?: boolean
    requiredIfField?: string
    type: 'password' | 'text'
    validators: Array<(value: string | undefined, formValues?: HTMLFormControlsCollection, otherField?: string) => string | undefined>
    value?: string
}
