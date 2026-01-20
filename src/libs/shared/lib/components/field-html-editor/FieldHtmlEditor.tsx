import { FC, FocusEvent, useEffect, useRef, useState } from 'react'

import { FormInputAutocompleteOption, InputWrapper } from '~/libs/ui'

import { BundledEditor } from './BundledEditor'

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
    readonly toolbar?: string
}

const FieldHtmlEditor: FC<FieldHtmlEditorProps> = (
    props: FieldHtmlEditorProps,
) => {
    const editorRef = useRef<any>(null)
    const [initValue, setInitValue] = useState('')

    useEffect(() => {
        if (!initValue) {
            setInitValue(props.value as string)
        }
    }, [props.value])

    const defaultToolbar = 'undo redo | formatselect | bold italic underline strikethrough |'
        + ' forecolor backcolor | link | alignleft aligncenter alignright alignjustify |'
        + ' numlist bullist outdent indent | table | removeformat'

    return (
        <InputWrapper
            {...props}
            dirty={!!props.dirty}
            disabled={!!props.disabled}
            label={props.label || props.name}
            type='textarea'
            hideInlineErrors={props.hideInlineErrors}
        >
            <BundledEditor
                onInit={function onInit(_evt: any, editor: any) {
                    (editorRef.current = editor)
                }}
                onChange={function onChange() {
                    props.onChange(editorRef.current.getContent())
                }}
                onBlur={props.onBlur}
                initialValue={initValue}
                init={{
                    browser_spellcheck: true,
                    content_style:
                        'body {'
                        + 'font-family: "Roboto", Arial, Helvetica, sans-serif;'
                        + 'font-size: 14px; line-height: 22px;'
                        + '}',
                    height: 400,
                    menubar: false,
                    plugins: ['table', 'link', 'textcolor', 'contextmenu'],
                    source_view: true,
                    statusbar: false,
                    toolbar: props.toolbar || defaultToolbar,
                }}
            />
        </InputWrapper>
    )
}

export default FieldHtmlEditor
