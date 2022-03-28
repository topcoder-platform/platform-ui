import { ValidatorFn } from './validator-functions'

export interface FormInputModel {
    readonly dependentField?: string
    dirtyOrTouched?: boolean
    disabled?: boolean
    error?: string
    readonly hint?: string
    readonly label?: string
    readonly name: string
    readonly notTabbable?: boolean
    readonly placeholder?: string
    readonly preventAutocomplete?: boolean
    readonly type: 'password' | 'text' | 'textarea'
    readonly validateOnBlur?: ValidatorFn
    readonly validateOnChange?: ValidatorFn
    value?: string
}
