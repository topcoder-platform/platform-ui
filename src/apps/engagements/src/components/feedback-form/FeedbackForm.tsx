import { ChangeEvent, FC, useCallback, useMemo, useState } from 'react'
import { Controller, type ControllerRenderProps, useForm } from 'react-hook-form'
import classNames from 'classnames'

import { Button, LoadingSpinner } from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'

import type { CreateFeedbackRequest } from '../../lib/models'

import type { FeedbackFormData } from './feedback-form.types'
import { feedbackFormSchema } from './feedback-form.schema'
import styles from './FeedbackForm.module.scss'

interface FeedbackFormProps {
    onSubmit: (data: CreateFeedbackRequest) => Promise<void>
    onCancel?: () => void
    disabled?: boolean
    submitLabel?: string
}

const FeedbackForm: FC<FeedbackFormProps> = (props: FeedbackFormProps) => {
    const onSubmit = props.onSubmit
    const onCancel = props.onCancel
    const disabled = props.disabled ?? false
    const submitLabel = props.submitLabel ?? 'Submit Feedback'

    const [submitting, setSubmitting] = useState<boolean>(false)
    const [submitError, setSubmitError] = useState<string | undefined>(undefined)

    const form = useForm<FeedbackFormData>({
        defaultValues: {
            feedbackText: '',
            rating: undefined,
        },
        mode: 'all',
        resolver: yupResolver(feedbackFormSchema),
    })

    const control = form.control
    const errors = form.formState.errors
    const handleSubmit = form.handleSubmit
    const isValid = form.formState.isValid
    const feedbackTextValue = form.watch('feedbackText') ?? ''

    const characterCounterClassName = useMemo(() => {
        const ratio = 2000 > 0 ? feedbackTextValue.length / 2000 : 0
        const isWarning = ratio >= 0.9 && ratio < 1
        const isLimit = ratio >= 1

        return classNames(
            styles.characterCounter,
            isWarning && styles.characterCounterWarning,
            isLimit && styles.characterCounterLimit,
        )
    }, [feedbackTextValue.length])

    const handleFormSubmit = useCallback(async (data: FeedbackFormData): Promise<void> => {
        if (submitting) {
            return
        }

        setSubmitting(true)
        setSubmitError(undefined)

        try {
            const trimmedFeedback = data.feedbackText?.trim() || ''
            const request: CreateFeedbackRequest = {
                feedbackText: trimmedFeedback,
                rating: data.rating ?? undefined,
            }

            await onSubmit(request)
        } catch (err: any) {
            const message = err?.response?.data?.message
                || err?.message
                || 'Unable to submit feedback. Please try again.'
            setSubmitError(message)
        } finally {
            setSubmitting(false)
        }
    }, [onSubmit, submitting])

    const handleFeedbackTextChange = useCallback(
        (field: ControllerRenderProps<FeedbackFormData, 'feedbackText'>) => (
            (event: ChangeEvent<HTMLTextAreaElement>): void => {
                field.onChange(event.target.value)
            }
        ),
        [],
    )

    const handleRatingChange = useCallback(
        (field: ControllerRenderProps<FeedbackFormData, 'rating'>) => (
            (event: ChangeEvent<HTMLInputElement>): void => {
                const nextValue = event.target.value
                const parsedValue = nextValue ? Number(nextValue) : undefined
                field.onChange(Number.isNaN(parsedValue) ? undefined : parsedValue)
            }
        ),
        [],
    )

    const isFormDisabled = disabled || submitting
    const isSubmitDisabled = isFormDisabled || !isValid

    const renderFeedbackTextField = useCallback(
        (renderProps: { field: ControllerRenderProps<FeedbackFormData, 'feedbackText'> }): JSX.Element => (
            <textarea
                id='feedback-text'
                className={classNames(
                    styles.inputField,
                    styles.textareaField,
                    errors.feedbackText && styles.inputError,
                )}
                maxLength={2000}
                placeholder='Share your feedback...'
                value={renderProps.field.value ?? ''}
                onChange={handleFeedbackTextChange(renderProps.field)}
                disabled={isFormDisabled}
                aria-invalid={!!errors.feedbackText}
                aria-describedby={errors.feedbackText ? 'feedback-text-error' : undefined}
            />
        ),
        [errors.feedbackText, handleFeedbackTextChange, isFormDisabled],
    )

    const renderRatingField = useCallback(
        (renderProps: { field: ControllerRenderProps<FeedbackFormData, 'rating'> }): JSX.Element => (
            <input
                id='feedback-rating'
                type='number'
                min={1}
                max={5}
                step={1}
                className={classNames(
                    styles.inputField,
                    errors.rating && styles.inputError,
                )}
                placeholder='1-5'
                value={renderProps.field.value ?? ''}
                onChange={handleRatingChange(renderProps.field)}
                disabled={isFormDisabled}
                aria-invalid={!!errors.rating}
                aria-describedby={errors.rating ? 'feedback-rating-error' : undefined}
            />
        ),
        [errors.rating, handleRatingChange, isFormDisabled],
    )

    return (
        <form className={styles.form} onSubmit={handleSubmit(handleFormSubmit)}>
            <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor='feedback-text'>Feedback</label>
                <Controller
                    name='feedbackText'
                    control={control}
                    render={renderFeedbackTextField}
                />
                <div className={styles.fieldMeta}>
                    <div className={characterCounterClassName}>
                        {`${feedbackTextValue.length} / 2000 characters`}
                    </div>
                </div>
                {errors.feedbackText && (
                    <div className={styles.fieldError} id='feedback-text-error'>
                        {errors.feedbackText.message}
                    </div>
                )}
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor='feedback-rating'>Rating (optional)</label>
                <Controller
                    name='rating'
                    control={control}
                    render={renderRatingField}
                />
                {errors.rating && (
                    <div className={styles.fieldError} id='feedback-rating-error'>
                        {errors.rating.message}
                    </div>
                )}
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

export default FeedbackForm
