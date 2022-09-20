import cn from 'classnames'
import { ChangeEvent, Dispatch, FC, FocusEvent, SetStateAction, useState } from 'react'

import { InputWrapper } from '../input-wrapper'

import styles from './InputCheckbox.module.scss'

export type InputCheckboxTypes = 'checkbox' | 'password' | 'text'

interface InputCheckboxProps {
    readonly checked?: boolean
    readonly className?: string
    readonly dirty?: boolean
    readonly disabled?: boolean
    readonly error?: string
    readonly hideInlineErrors?: boolean
    readonly hint?: string
    readonly label?: string | JSX.Element
    readonly name: string
    readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void
    readonly tabIndex: number
    readonly type: InputCheckboxTypes
}

const InputCheckbox: FC<InputCheckboxProps> = (props: InputCheckboxProps) => {

    const [checked, setChecked]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(props.checked || false)

    return (
        <InputWrapper
            {...props}
            dirty={!!props.dirty}
            disabled={!!props.disabled}
            label={props.label || props.name}
            hideInlineErrors={props.hideInlineErrors}
        >
            <input
                className={cn(styles['form-input-checkbox'], styles[props.type])}
                disabled={!!props.disabled}
                onChange={(event) => {
                    setChecked(!checked)
                    props.onChange(event)
                }}
                name={props.name}
                tabIndex={props.tabIndex}
                type={'checkbox'}
                checked={checked}
            />
        </InputWrapper>
    )
}

export default InputCheckbox
