export interface TextInputModel {
    dirty?: boolean
    disabled?: boolean
    error?: string
    label?: string
    name: string
    placeholder?: string
    preventAutocomplete?: boolean
    type: 'password' | 'text'
    validators: Array<(value: string | undefined) => string | undefined>
    value?: string
}
