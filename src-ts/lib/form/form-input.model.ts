import { InputEvent } from './form-input.event'
import { FormInputAutocompleteOption } from './form-inputs'
import { ValidatorFn } from './validator-functions'

export interface FormInputModel {
    readonly autocomplete?: FormInputAutocompleteOption
    readonly className?: string
    readonly dependentFields?: Array<string>
    dirty?: boolean
    disabled?: boolean
    error?: string
    readonly events?: ReadonlyArray<InputEvent>
    readonly hint?: string
    readonly id?: string
    readonly instructions?: string
    readonly label?: string
    readonly name: string
    readonly notTabbable?: boolean
    readonly placeholder?: string
    readonly spellCheck?: boolean
    readonly title?: string
    touched?: boolean
    readonly type: 'password' | 'rating' | 'text' | 'textarea'
    readonly validators?: ReadonlyArray<ValidatorFn>
    value?: string
}
