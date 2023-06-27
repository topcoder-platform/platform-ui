/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable unicorn/no-null */
/**
 * InputTextAutoSave
 *
 * A Form Field Is a wrapper for input to add the label to it
 */
import React, { FC } from 'react'
import { InputText } from '~/libs/ui'
import { InputTextProps } from '~/libs/ui/lib/components/form/form-groups/form-input/input-text/InputText'

const InputTextAutoSave: FC<InputTextProps> = (props: InputTextProps) => {
    return (
        <InputText
            {...props}
        />
    )
}

export default InputTextAutoSave
