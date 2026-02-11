import {
    FC,
    useCallback,
} from 'react'
import {
    useController,
    UseControllerReturn,
    useFormContext,
} from 'react-hook-form'

import { FieldMarkdownEditor } from '~/apps/review/src/lib/components/FieldMarkdownEditor'

import { uploadChallengeAttachment } from '../../../services'
import { FormFieldWrapper } from '../FormFieldWrapper'

import styles from './FormMarkdownEditor.module.scss'

export interface FormMarkdownEditorProps {
    className?: string
    disabled?: boolean
    hint?: string
    label: string
    maxCharacters?: number
    name: string
    onBlur?: () => void
    placeholder?: string
    required?: boolean
    uploadCategory?: string
}

export const FormMarkdownEditor: FC<FormMarkdownEditorProps> = (props: FormMarkdownEditorProps) => {
    const className = props.className
    const disabled = props.disabled
    const hint = props.hint
    const label = props.label
    const maxCharacters = props.maxCharacters
    const name = props.name
    const onBlur = props.onBlur
    const placeholder = props.placeholder
    const required = props.required
    const uploadCategory = props.uploadCategory

    const formContext = useFormContext()
    const {
        field,
        fieldState,
    }: UseControllerReturn = useController({
        control: formContext.control,
        name,
    })

    const challengeId = formContext.watch('id') as string | undefined
    const value = typeof field.value === 'string'
        ? field.value
        : ''
    const editorKey = `${name}-${challengeId || 'new'}`

    const handleBlur = useCallback(
        (): void => {
            field.onBlur()
            onBlur?.()
        },
        [field, onBlur],
    )

    const handleUploadAttachment = useCallback(
        (file: File, options: any): Promise<any> => uploadChallengeAttachment(file, {
            ...options,
            category: uploadCategory || options?.category,
            challengeId: challengeId || options?.challengeId,
        }),
        [challengeId, uploadCategory],
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
                <FieldMarkdownEditor
                    ariaLabel={label}
                    disabled={disabled}
                    error={fieldState.error?.message}
                    initialValue={value}
                    key={editorKey}
                    maxCharactersAllowed={maxCharacters}
                    onBlur={handleBlur}
                    onChange={field.onChange}
                    placeholder={placeholder}
                    showBorder
                    uploadAttachment={handleUploadAttachment}
                    uploadCategory={uploadCategory}
                />
            </div>
        </FormFieldWrapper>
    )
}

export default FormMarkdownEditor
