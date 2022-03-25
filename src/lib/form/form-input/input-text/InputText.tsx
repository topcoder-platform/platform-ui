import { FC, FocusEvent } from 'react'

import { ValidatorFn } from '../../validator-functions'
import { FormFieldWrapper } from '../form-field-wrapper'

import styles from './InputText.module.scss'

export const optionalHint: string = '(optional)'

interface InputTextProps {
    readonly dirtyOrTouched?: boolean
    readonly disabled?: boolean
    readonly error?: string
    readonly hint?: string
    readonly label?: string
    readonly name: string
    readonly onBlur: (event: FocusEvent<HTMLInputElement>) => void
    readonly onFocus: (event: FocusEvent<HTMLInputElement>) => void
    readonly placeholder?: string
    readonly preventAutocomplete?: boolean
    readonly tabIndex: number
    readonly type: 'password' | 'text'
    readonly validateOnBlur?: ValidatorFn
    readonly value?: string | number
}

const InputText: FC<InputTextProps> = (props: InputTextProps) => {

    return (
        <FormFieldWrapper
            dirtyOrTouched={!!props.dirtyOrTouched}
            disabled={!!props.disabled}
            error={props.error}
            hint={props.hint}
            label={props.label || props.name}
            name={props.name}
        >
            <input
                autoComplete={!!props.preventAutocomplete ? 'off' : undefined}
                className={styles['form-input-text']}
                defaultValue={props.value}
                disabled={!!props.disabled}
                onBlur={props.onBlur}
                onFocus={props.onFocus}
                name={props.name}
                placeholder={props.placeholder}
                tabIndex={props.tabIndex}
                type={props.type || 'text'}
            />
        </FormFieldWrapper>
    )
}

export default InputText
