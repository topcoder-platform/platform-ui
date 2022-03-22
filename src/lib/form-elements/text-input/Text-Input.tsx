import { FC } from 'react'

import { FormFieldWrapper } from '../form-field-wrapper'

import styles from './Text-Input.module.scss'

interface TextInputProps {
    dirty?: boolean
    disabled?: boolean
    error?: string
    hint?: string
    label?: string
    name: string
    placeholder?: string
    preventAutocomplete?: boolean
    tabIndex: number
    type: 'password' | 'text'
    value?: string | number
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
