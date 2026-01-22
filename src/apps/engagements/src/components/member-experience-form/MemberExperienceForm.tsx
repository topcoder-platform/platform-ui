import { FC, useCallback, useEffect, useState } from 'react'
import { Controller, type ControllerRenderProps, useForm } from 'react-hook-form'

import { Button, LoadingSpinner } from '~/libs/ui'
import { FieldMarkdownEditor } from '~/apps/review/src/lib/components/FieldMarkdownEditor/FieldMarkdownEditor'
import type { ReviewAttachmentUploadOptions } from '~/apps/review/src/lib/services'
import { yupResolver } from '@hookform/resolvers/yup'

import type {
    CreateMemberExperienceRequest,
    UpdateMemberExperienceRequest,
} from '../../lib/models'
import { uploadEngagementAttachment } from '../../lib/services'

import type { MemberExperienceFormData } from './member-experience-form.types'
import { memberExperienceFormSchema } from './member-experience-form.schema'
import styles from './MemberExperienceForm.module.scss'

interface MemberExperienceFormProps {
    engagementId: string
    assignmentId: string
    initialValue?: string
    experienceId?: string
    onSubmit: (
        data: CreateMemberExperienceRequest | UpdateMemberExperienceRequest,
    ) => Promise<void>
    onCancel?: () => void
    disabled?: boolean
    submitLabel?: string
}

const MAX_CHARACTERS = 10000

const MemberExperienceForm: FC<MemberExperienceFormProps> = (props: MemberExperienceFormProps) => {
    const engagementId = props.engagementId
    const assignmentId = props.assignmentId
    const initialValue = props.initialValue
    const experienceId = props.experienceId
    const onSubmit = props.onSubmit
    const onCancel = props.onCancel
    const disabled = props.disabled ?? false

    const submitLabel = props.submitLabel
        ?? (experienceId ? 'Update Experience' : 'Save Experience')

    const [submitting, setSubmitting] = useState<boolean>(false)
    const [submitError, setSubmitError] = useState<string | undefined>(undefined)

    const form = useForm<MemberExperienceFormData>({
        defaultValues: {
            experienceText: initialValue ?? '',
        },
        mode: 'all',
        resolver: yupResolver(memberExperienceFormSchema),
    })

    const resetForm = form.reset

    const control = form.control
    const errors = form.formState.errors
    const handleSubmit = form.handleSubmit
    const isValid = form.formState.isValid

    useEffect(() => {
        resetForm({ experienceText: initialValue ?? '' })
    }, [initialValue, resetForm])

    const isFormDisabled = disabled || submitting
    const isSubmitDisabled = isFormDisabled || !isValid

    const uploadAttachment = useCallback(
        (file: File, options: ReviewAttachmentUploadOptions = {}) => uploadEngagementAttachment(file, {
            assignmentId,
            category: options.category,
            engagementId,
            onProgress: options.onProgress,
        }),
        [assignmentId, engagementId],
    )

    const handleFormSubmit = useCallback(async (data: MemberExperienceFormData): Promise<void> => {
        if (submitting) {
            return
        }

        setSubmitting(true)
        setSubmitError(undefined)

        try {
            const trimmedExperience = data.experienceText?.trim() || ''
            const request: CreateMemberExperienceRequest = {
                experienceText: trimmedExperience,
            }

            await onSubmit(request)
        } catch (err: any) {
            const message = err?.response?.data?.message
                || err?.message
                || 'Unable to save experience. Please try again.'
            setSubmitError(message)
        } finally {
            setSubmitting(false)
        }
    }, [onSubmit, submitting])

    const renderExperienceField = useCallback(
        (renderProps: { field: ControllerRenderProps<MemberExperienceFormData, 'experienceText'> }): JSX.Element => (
            <FieldMarkdownEditor
                className={styles.editor}
                initialValue={initialValue ?? ''}
                onChange={renderProps.field.onChange}
                onBlur={renderProps.field.onBlur}
                error={errors.experienceText?.message}
                disabled={isFormDisabled}
                showBorder
                uploadCategory='member-experience'
                maxCharactersAllowed={MAX_CHARACTERS}
                uploadAttachment={uploadAttachment}
                textareaId='member-experience-text'
                ariaLabel='Member experience'
            />
        ),
        [
            errors.experienceText?.message,
            initialValue,
            isFormDisabled,
            uploadAttachment,
        ],
    )

    return (
        <form className={styles.form} onSubmit={handleSubmit(handleFormSubmit)}>
            <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor='member-experience-text'>Experience</label>
                <Controller
                    name='experienceText'
                    control={control}
                    render={renderExperienceField}
                />
            </div>

            {submitError && (
                <div className={styles.submitError}>{submitError}</div>
            )}

            <div className={styles.actions}>
                <Button
                    label={(
                        <span className={styles.submitLabel}>
                            {submitting && (
                                <LoadingSpinner className={styles.submitSpinner} inline />
                            )}
                            {submitLabel}
                        </span>
                    )}
                    type='submit'
                    primary
                    disabled={isSubmitDisabled}
                />
                {onCancel && (
                    <Button
                        label='Cancel'
                        onClick={onCancel}
                        secondary
                        disabled={submitting}
                    />
                )}
            </div>
        </form>
    )
}

export default MemberExperienceForm
