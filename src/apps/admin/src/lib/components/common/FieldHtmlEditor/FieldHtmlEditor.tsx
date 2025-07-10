import { FC, FocusEvent, useEffect, useState } from 'react'

import { FormInputAutocompleteOption, InputWrapper } from '~/libs/ui'

import { Editor } from './Editor'
import styles from './FieldHtmlEditor.module.scss'

interface FieldHtmlEditorProps {
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
    readonly onChange: (event: string) => void
    readonly placeholder?: string
    readonly spellCheck?: boolean
    readonly tabIndex?: number
    readonly value?: string | number
    readonly classNameWrapper?: string
}

const FieldHtmlEditor: FC<FieldHtmlEditorProps> = (
    props: FieldHtmlEditorProps,
) => {
    const [initValue, setInitValue] = useState('')

    useEffect(() => {
        if (!initValue) {
            setInitValue(props.value as string)
        }
    }, [props.value])

    return (
        <InputWrapper
            {...props}
            dirty={!!props.dirty}
            disabled={!!props.disabled}
            label={props.label || props.name}
            type='textarea'
            hideInlineErrors={props.hideInlineErrors}
        >
            <Editor
                initialValue={initValue}
                className={styles['form-input-textarea']}
                placeholder={props.placeholder}
                onBlur={props.onBlur}
                onChange={props.onChange}
                error={props.error}
                disabled={!!props.disabled}
            />
        </InputWrapper>
    )
}

export default FieldHtmlEditor
