import { FC, FocusEvent } from 'react'
import cn from 'classnames'

import { FormInputTooltipOptions, InputValue } from '../../../form-input.model'
import { FormInputAutocompleteOption } from '../form-input-autcomplete-option.enum'
import { InputWrapper } from '../input-wrapper'
import { Tooltip } from '../../../../tooltip'

import styles from './InputText.module.scss'

export type InputTextTypes = 'checkbox' | 'password' | 'text' | 'number'

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
    readonly readonly?: boolean
    readonly spellCheck?: boolean
    readonly tabIndex?: number
    readonly tooltip?: FormInputTooltipOptions
    readonly type: InputTextTypes
    readonly value?: InputValue
    readonly autoFocus?: boolean
    readonly forceUpdateValue?: boolean
}

const InputText: FC<InputTextProps> = (props: InputTextProps) => {

    const defaultValue: string | number | undefined = props.type === 'checkbox' && !!props.checked
        ? 'on'
        : props.value as string | number | undefined

    const renderInput: () => JSX.Element = () => (
        <input
            autoComplete={props.autocomplete}
            checked={defaultValue === 'on'}
            className={cn(styles['form-input-text'], styles[props.type])}
            defaultValue={
                props.forceUpdateValue
                    ? undefined
                    : defaultValue
            }
            value={
                props.forceUpdateValue
                    ? (props.value as string | ReadonlyArray<string> | number | undefined)
                    : undefined
            }
            disabled={!!props.disabled}
            onBlur={props.onBlur}
            onChange={props.onChange}
            name={props.name}
            placeholder={props.placeholder}
            readOnly={props.readonly}
            spellCheck={!!props.spellCheck}
            tabIndex={props.tabIndex ?? -1}
            type={props.type || 'text'}
        />
    )

    return (
        <InputWrapper
            {...props}
            dirty={!!props.dirty}
            disabled={!!props.disabled}
            label={props.label || props.name}
            hideInlineErrors={props.hideInlineErrors}
        >
            {
                props.tooltip ? (
                    <Tooltip {...props.tooltip}>{renderInput()}</Tooltip>
                ) : (
                    renderInput()
                )
            }
        </InputWrapper>
    )
}

export default InputText
