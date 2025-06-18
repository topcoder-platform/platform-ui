import { FC, FocusEvent } from 'react'
import { UseFormRegisterReturn } from 'react-hook-form'

import { FormInputAutocompleteOption } from '../form-input-autcomplete-option.enum'
import { InputWrapper } from '../input-wrapper'

import styles from './InputTextarea.module.scss'

interface InputTextareaProps {
    readonly className?: string
    readonly autocomplete?: FormInputAutocompleteOption
    readonly dirty?: boolean
    readonly disabled?: boolean
    readonly error?: string
    readonly hideInlineErrors?: boolean
    readonly hint?: string
    readonly label?: string
    readonly name: string
    readonly onBlur?: (event: FocusEvent<HTMLTextAreaElement>) => void
    readonly onChange: (event: FocusEvent<HTMLTextAreaElement>) => void
    readonly placeholder?: string
    readonly spellCheck?: boolean
    readonly tabIndex?: number
    readonly value?: string | number
    readonly inputControl?: UseFormRegisterReturn
}

const InputTextarea: FC<InputTextareaProps> = (props: InputTextareaProps) => (
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
            value={props.inputControl ? undefined : props.value ?? ''}
            disabled={!!props.disabled}
            placeholder={props.placeholder}
            spellCheck={!!props.spellCheck}
            tabIndex={props.tabIndex ?? -1}
            {...(props.inputControl ?? {})}
            onBlur={props.inputControl ? props.inputControl.onBlur : props.onBlur}
            onChange={props.inputControl ? props.inputControl.onChange : props.onChange}
            name={props.inputControl ? props.inputControl.name : props.name}
        />
    </InputWrapper>
)

export default InputTextarea
