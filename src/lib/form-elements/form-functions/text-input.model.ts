export interface TextInputModel {
    dependentFields?: Array<string>
    dirty?: boolean
    disabled?: boolean
    error?: string
    hint?: string
    label?: string
    name: string
    placeholder?: string
    preventAutocomplete?: boolean
    requiredIfField?: string
    tabIndex: number
    type: 'password' | 'text'
    validators: Array<(value: string | undefined, formValues?: HTMLFormControlsCollection, otherField?: string) => string | undefined>
    value?: string
}
