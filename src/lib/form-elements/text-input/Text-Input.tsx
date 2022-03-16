import { FC } from 'react'

import { FormFieldWrapper } from '../form-field-wrapper'

import styles from './Text-Input.module.scss'

interface TextInputProps {
    dirty?: boolean
    disabled?: boolean
    error?: string
    label?: string
    name: string
    placeholder?: string
    preventAutocomplete?: boolean
    tabIndex: number
    type: 'password' | 'text'
    value?: string
}

const TextInput: FC<TextInputProps> = (props: TextInputProps) => {
    return (
        <FormFieldWrapper
            disabled={!!props.disabled}
            label={props.label || props.name}
            error={props.error}
        >
            <input
                autoComplete={!!props.preventAutocomplete ? 'off' : undefined}
                className={styles['form-input-text']}
                defaultValue={props.value}
                disabled={!!props.disabled}
                name={props.name}
                placeholder={props.placeholder}
                type={props.type || 'text'}
            />
        </FormFieldWrapper>
    )
}

export default TextInput
