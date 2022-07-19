import { FC, FocusEvent } from 'react'

import { FormInputAutocompleteOption } from '../form-input-autcomplete-option.enum'
import { InputWrapper } from '../input-wrapper'

import styles from './InputTextarea.module.scss'

interface InputTextareaProps {
    readonly autocomplete?: FormInputAutocompleteOption
    readonly dirty?: boolean
    readonly disabled?: boolean
    readonly error?: string
    readonly hideInlineErrors?: boolean
    readonly hint?: string
    readonly label?: string
    readonly name: string
    readonly onBlur: (event: FocusEvent<HTMLTextAreaElement>) => void
    readonly onChange: (event: FocusEvent<HTMLTextAreaElement>) => void
    readonly placeholder?: string
    readonly spellCheck?: boolean
    readonly tabIndex: number
    readonly value?: string | number
}

const InputTextarea: FC<InputTextareaProps> = (props: InputTextareaProps) => {
    return (
        <InputWrapper
            {...props}
            dirty={!!props.dirty}
            disabled={!!props.disabled}
            label={props.label || props.name}
            type='textarea'
            hideInlineErrors={props.hideInlineErrors}
        >
            <textarea
                autoComplete={props.autocomplete}
                className={styles['form-input-textarea']}
                defaultValue={props.value}
                disabled={!!props.disabled}
                name={props.name}
                onBlur={props.onBlur}
                onChange={props.onChange}
                placeholder={props.placeholder}
                spellCheck={!!props.spellCheck}
                tabIndex={props.tabIndex}
            />
        </InputWrapper>
    )
}

export default InputTextarea
