import cn from 'classnames'
import { FC, FocusEvent } from 'react'

import { FormInputAutocompleteOption } from '../form-input-autcomplete-option.enum'
import { InputWrapper } from '../input-wrapper'

import styles from './InputText.module.scss'

export type InputTextTypes = 'checkbox' | 'password' | 'text'

export interface InputTextProps {
    readonly autocomplete?: FormInputAutocompleteOption
    readonly checked?: boolean
    readonly className?: string
    readonly dirty?: boolean
    readonly disabled?: boolean
    readonly error?: string
    readonly hideInlineErrors?: boolean
    readonly hint?: string
    readonly label?: string | JSX.Element
    readonly name: string
    readonly onBlur?: (event: FocusEvent<HTMLInputElement>) => void
    readonly onChange: (event: FocusEvent<HTMLInputElement>) => void
    readonly placeholder?: string
    readonly spellCheck?: boolean
    readonly tabIndex: number
    readonly type: InputTextTypes
    readonly value?: string | number | boolean
}

const InputText: FC<InputTextProps> = (props: InputTextProps) => {

    const defaultValue: string | number | undefined = props.type === 'checkbox' && !!props.checked
        ? 'on'
        : props.value as string | number | undefined

    return (
        <InputWrapper
            {...props}
            dirty={!!props.dirty}
            disabled={!!props.disabled}
            label={props.label || props.name}
            hideInlineErrors={props.hideInlineErrors}
        >
            <input
                autoComplete={props.autocomplete}
                checked={defaultValue === 'on'}
                className={cn(styles['form-input-text'], styles[props.type])}
                defaultValue={defaultValue}
                disabled={!!props.disabled}
                onBlur={props.onBlur}
                onChange={props.onChange}
                name={props.name}
                placeholder={props.placeholder}
                spellCheck={!!props.spellCheck}
                tabIndex={props.tabIndex}
                type={props.type || 'text'}
            />
        </InputWrapper>
    )
}

export default InputText
