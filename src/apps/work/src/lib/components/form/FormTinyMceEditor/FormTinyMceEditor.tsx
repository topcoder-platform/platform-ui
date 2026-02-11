import {
    FC,
    useCallback,
} from 'react'
import {
    useController,
    UseControllerReturn,
    useFormContext,
} from 'react-hook-form'

import { BundledEditor } from '~/libs/shared/lib/components/field-html-editor/BundledEditor'

import { FormFieldWrapper } from '../FormFieldWrapper'

import styles from './FormTinyMceEditor.module.scss'

const DEFAULT_TOOLBAR = 'undo redo | formatselect | bold italic underline strikethrough |'
    + ' forecolor backcolor | link | alignleft aligncenter alignright alignjustify |'
    + ' numlist bullist outdent indent | table | removeformat'

export interface FormTinyMceEditorProps {
    className?: string
    disabled?: boolean
    hint?: string
    label: string
    name: string
    onBlur?: () => void
    placeholder?: string
    required?: boolean
    toolbar?: string
}

export const FormTinyMceEditor: FC<FormTinyMceEditorProps> = (props: FormTinyMceEditorProps) => {
    const className = props.className
    const disabled = props.disabled
    const hint = props.hint
    const label = props.label
    const name = props.name
    const onBlur = props.onBlur
    const placeholder = props.placeholder
    const required = props.required
    const toolbar = props.toolbar

    const formContext = useFormContext()
    const {
        field,
        fieldState,
    }: UseControllerReturn = useController({
        control: formContext.control,
        name,
    })

    const value = typeof field.value === 'string'
        ? field.value
        : ''

    const handleBlur = useCallback(
        (): void => {
            field.onBlur()
            onBlur?.()
        },
        [field, onBlur],
    )

    return (
        <FormFieldWrapper
            className={className}
            error={fieldState.error?.message}
            hint={hint}
            label={label}
            name={name}
            required={required}
        >
            <div className={styles.editor}>
                <BundledEditor
                    disabled={disabled}
                    id={name}
                    init={{
                        browser_spellcheck: true,
                        content_style:
                            'body {'
                            + 'font-family: "Roboto", Arial, Helvetica, sans-serif;'
                            + 'font-size: 14px; line-height: 22px;'
                            + '}',
                        height: 400,
                        menubar: false,
                        placeholder,
                        plugins: ['table', 'link', 'textcolor', 'contextmenu'],
                        source_view: true,
                        statusbar: false,
                        toolbar: toolbar || DEFAULT_TOOLBAR,
                    }}
                    onBlur={handleBlur}
                    onEditorChange={field.onChange}
                    value={value}
                />
            </div>
        </FormFieldWrapper>
    )
}

export default FormTinyMceEditor
