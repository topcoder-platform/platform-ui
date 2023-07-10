/**
 * InputTextAutoSave
 *
 * A Form Field Is a wrapper for input to add the label to it
 */
import { FC, FocusEvent, useEffect, useState } from 'react'

import { InputText, InputValue } from '~/libs/ui'
import { InputTextTypes } from '~/libs/ui/lib/components/form/form-groups/form-input/input-text/InputText'

export interface InputTextProps {
    readonly checked?: boolean
    readonly className?: string
    readonly dirty?: boolean
    readonly disabled?: boolean
    readonly error?: string
    readonly hideInlineErrors?: boolean
    readonly hint?: string
    readonly label?: string | JSX.Element
    readonly name: string
    readonly onChange: (value?: string) => void
    readonly placeholder?: string
    readonly readonly?: boolean
    readonly spellCheck?: boolean
    readonly tabIndex: number
    readonly value?: InputValue
    readonly type: InputTextTypes
}

const InputTextAutoSave: FC<InputTextProps> = (props: InputTextProps) => {
    const [value, setValue] = useState<InputValue>('')
    useEffect(() => {
        setValue(props.value)
    }, [props.value])

    return (
        <InputText
            {...props}
            value={value}
            onChange={function onChange(event: FocusEvent<HTMLInputElement>) {
                setValue(event.target.value)
            }}
            onBlur={function onBlur() {
                props.onChange(`${value}`)
            }}
        />
    )
}

export default InputTextAutoSave
