export interface FormInputModel {
    readonly dependentField?: string
    dirty?: boolean
    disabled?: boolean
    error?: string
    readonly hint?: string
    readonly label?: string
    readonly name: string
    readonly notTabbable?: boolean
    readonly placeholder?: string
    readonly preventAutocomplete?: boolean
    readonly type: 'password' | 'text'
    readonly validators: Array<(value: string | undefined, formValues?: HTMLFormControlsCollection, otherField?: string) => string | undefined>
    value?: string
}
