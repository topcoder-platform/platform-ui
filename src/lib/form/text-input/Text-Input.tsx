import { FC } from 'react'

import { FormFieldWrapper } from '../form-field-wrapper'

import styles from './InputText.module.scss'

export const optionalHint: string = '(optional)'

<<<<<<< HEAD:src/lib/form/form-input/input-text/InputText.tsx
interface InputTextProps {
=======
interface TextInputProps {
>>>>>>> PROD-265_work-intake:src/lib/form/text-input/Text-Input.tsx
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

const InputText: FC<InputTextProps> = (props: InputTextProps) => {
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

export default InputText
