import { FormInputAutocompleteOption } from './form-groups'
import { InputEvent } from './form-input.event'
import { ValidatorFn } from './validator-functions'

export interface FormRadioButtonOption {
    checked: boolean
    children: JSX.Element
    id: string
  }

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
    options?: ReadonlyArray<FormRadioButtonOption>
    readonly placeholder?: string
    readonly spellCheck?: boolean
    readonly title?: string
    touched?: boolean
    readonly type: 'checkbox' | 'password' | 'radio' | 'rating' | 'text' | 'textarea'
    readonly validators?: ReadonlyArray<ValidatorFn>
    value?: string
}
