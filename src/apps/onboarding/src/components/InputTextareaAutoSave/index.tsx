/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable unicorn/no-null */
/**
 * InputTextareaAutoSave
 *
 * A Form Field Is a wrapper for input to add the label to it
 */
import React, { FC, FocusEvent } from 'react'
import { InputTextarea } from '~/libs/ui'


export interface InputTextareaProps {
    readonly dirty?: boolean
    readonly disabled?: boolean
    readonly error?: string
    readonly hideInlineErrors?: boolean
    readonly hint?: string
    readonly label?: string
    readonly name: string
    readonly onChange: (event: FocusEvent<HTMLTextAreaElement>) => void
    readonly placeholder?: string
    readonly spellCheck?: boolean
    readonly tabIndex: number
    readonly value?: string | number
}

const InputTextareaAutoSave: FC<InputTextareaProps> = (props: InputTextareaProps) => {
    return (
        <InputTextarea
            {...props}
            onBlur={() => { }}
        />
    )
}

export default InputTextareaAutoSave
