import { FC, FocusEvent } from 'react'

import { ValidatorFn } from '../../../validator-functions'
import { InputWrapper } from '../input-wrapper'

import styles from './InputTextarea.module.scss'

interface InputTextareaProps {
    readonly dirty?: boolean
    readonly disabled?: boolean
    readonly error?: string
    readonly hint?: string
    readonly label?: string
    readonly name: string
    readonly onBlur: (event: FocusEvent<HTMLTextAreaElement>) => void
    readonly onFocus: (event: FocusEvent<HTMLTextAreaElement>) => void
    readonly placeholder?: string
    readonly preventAutocomplete?: boolean
    readonly tabIndex: number
    readonly touched?: boolean
    readonly validateOnBlur?: ValidatorFn
    readonly value?: string | number
}

const InputTextarea: FC<InputTextareaProps> = (props: InputTextareaProps) => {
    return (
        <InputWrapper
            dirty={!!props.dirty}
            disabled={!!props.disabled}
            error={props.error}
            hint={props.hint}
            label={props.label || props.name}
            name={props.name}
            touched={!!props.touched}
        >
            <textarea
                autoComplete={!!props.preventAutocomplete ? 'off' : undefined}
                className={styles['form-input-textarea']}
                defaultValue={props.value}
                disabled={!!props.disabled}
                name={props.name}
                onBlur={props.onBlur}
                onFocus={props.onFocus}
                placeholder={props.placeholder}
                tabIndex={props.tabIndex}
            />
        </InputWrapper>
    )
}

export default InputTextarea
