import { FC } from 'react'

import { FormFieldWrapper } from '../form-field-wrapper'

import styles from './Text-Input.module.scss'

interface TextInputProps {
    readonly dirty?: boolean
    readonly disabled?: boolean
    readonly error?: string
    readonly hint?: string
    readonly label?: string
    readonly name: string
    readonly placeholder?: string
    readonly preventAutocomplete?: boolean
    readonly tabIndex: number
    readonly type: 'password' | 'text'
    readonly value?: string | number
}

const TextInput: FC<TextInputProps> = (props: TextInputProps) => {
    return (
        <FormFieldWrapper
            dirty={!!props.dirty}
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
                name={props.name}
                placeholder={props.placeholder}
                tabIndex={props.tabIndex}
                type={props.type || 'text'}
            />
        </FormFieldWrapper>
    )
}

export default TextInput
