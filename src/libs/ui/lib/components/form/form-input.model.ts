import { ReactNode } from 'react'

import { FormInputAutocompleteOption } from './form-groups'
import { InputEvent } from './form-input.event'
import { ValidatorFn } from './validator-functions'
import { InputSelectOption } from './form-groups/form-input'

export interface FormRadioButtonOption {
    checked: boolean
    children: JSX.Element
    id: string
}

export interface FormCard {
    id: string,
    mostPopular?: boolean
    price: number,
    sections: Array<{
        rows: Array<{
            icon?: string,
            infoIcon?: boolean,
            label?: string,
            text?: string,
            tooltipText?: string,
            valueIcon?: string,
        }>
    }>,
    title: string,
}

export type InputValue = string | boolean | FileList | undefined

export type FormInputTooltipOptions = {
    className?: string
    content?: ReactNode
    /** Set clickable=true to allows interactions with the tooltip */
    clickable?: boolean
    disableWrap?: boolean
    place?: 'top' | 'right' | 'bottom' | 'left'
    children?: ReactNode
    triggerOn?: 'click' | 'hover'
    strategy?: 'absolute' | 'fixed'
}

export interface FormInputModel {
    readonly autocomplete?: FormInputAutocompleteOption
    readonly cards?: ReadonlyArray<FormCard>
    checked?: boolean
    readonly className?: string
    readonly dependentFields?: Array<string>
    dirty?: boolean
    disabled?: boolean
    error?: string
    readonly events?: ReadonlyArray<InputEvent>
    readonly fileConfig?: {
        readonly acceptFileType?: string
        readonly maxFileSize?: number
    }
    readonly files?: FileList
    readonly hideInlineErrors?: boolean
    readonly hint?: string
    readonly id?: string
    readonly instructions?: string
    readonly label?: string
    readonly name: string
    readonly notTabbable?: boolean
    options?: ReadonlyArray<FormRadioButtonOption|InputSelectOption>
    readonly placeholder?: string
    readonly readonly?: boolean
    readonly spellCheck?: boolean
    readonly title?: string
    readonly creatable?: boolean
    tooltip?: FormInputTooltipOptions
    touched?: boolean
    // eslint-disable-next-line max-len
    readonly type: 'card-set'| 'checkbox' | 'password' | 'radio' | 'rating' | 'select' | 'text' | 'textarea' | 'image-picker' | 'toggle'
    readonly validators?: ReadonlyArray<ValidatorFn>
    value?: InputValue
}
