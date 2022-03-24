import { FC } from 'react'

import { FormFieldWrapper } from '../form-field-wrapper'

import styles from './InputTextarea.module.scss'


interface InputTextareaProps {
    readonly dirty?: boolean
    readonly disabled?: boolean
    readonly error?: string
    readonly hint?: string
    readonly label?: string
    readonly name: string
    readonly placeholder?: string
    readonly preventAutocomplete?: boolean
    readonly tabIndex: number
    readonly value?: string | number
}

const InputTextarea: FC<InputTextareaProps> = (props: InputTextareaProps) => {
    return (
        <FormFieldWrapper
            dirty={!!props.dirty}
            disabled={!!props.disabled}
            error={props.error}
            hint={props.hint}
            label={props.label || props.name}
            name={props.name}
        >
            <textarea
                autoComplete={!!props.preventAutocomplete ? 'off' : undefined}
                className={styles['form-input-textarea']}
                defaultValue={props.value}
                disabled={!!props.disabled}
                name={props.name}
                placeholder={props.placeholder}
                tabIndex={props.tabIndex}
            />
        </FormFieldWrapper>
    )
}

export default InputTextarea
