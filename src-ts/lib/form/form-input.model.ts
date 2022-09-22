import { FormInputAutocompleteOption } from './form-groups'
import { InputEvent } from './form-input.event'
import { ValidatorFn } from './validator-functions'

export interface FormRadioButtonOption {
    checked: boolean
    children: JSX.Element
    id: string
}

export interface FormCard {
    id: string,
    price: number,
    sections: Array<{
        rows: Array<{ icon?: string, label?: string, text?: string }>
    }>,
    title: string
}

export type InputValue = string | boolean | FileList | undefined

export interface FormInputModel {
    readonly accept?: string
    readonly autocomplete?: FormInputAutocompleteOption
    readonly cards?: ReadonlyArray<FormCard>
    checked?: boolean
    readonly className?: string
    readonly dependentFields?: Array<string>
    dirty?: boolean
    disabled?: boolean
    error?: string
    readonly events?: ReadonlyArray<InputEvent>
    readonly files?: FileList
    readonly hideInlineErrors?: boolean
    readonly hint?: string
    readonly id?: string
    readonly instructions?: string
    readonly label?: string
    readonly name: string
    readonly notTabbable?: boolean
    options?: ReadonlyArray<FormRadioButtonOption>
    readonly placeholder?: string
    readonly size?: number
    readonly spellCheck?: boolean
    readonly title?: string
    touched?: boolean
    readonly type: 'card-set' | 'checkbox' | 'password' | 'radio' | 'rating' | 'text' | 'textarea' | 'image-picker'
    readonly validators?: ReadonlyArray<ValidatorFn>
    value?: InputValue
}
