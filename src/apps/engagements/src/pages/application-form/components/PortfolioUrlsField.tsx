import { ChangeEvent, FC, useCallback } from 'react'
import { Control, Controller, type ControllerRenderProps, FieldErrors, useFieldArray } from 'react-hook-form'
import classNames from 'classnames'

import type { ApplicationFormData } from '../application-form.types'
import styles from '../ApplicationFormPage.module.scss'

interface PortfolioUrlsFieldProps {
    control: Control<ApplicationFormData>
    errors: FieldErrors<ApplicationFormData>
    disabled?: boolean
}

interface PortfolioUrlInputProps {
    inputId: string
    errorMessage?: string
    index: number
    disabled?: boolean
    field: ControllerRenderProps<ApplicationFormData>
}

const MAX_URLS = 10

const PortfolioUrlInput: FC<PortfolioUrlInputProps> = (props: PortfolioUrlInputProps) => {
    const field = props.field
    const inputId = props.inputId
    const errorMessage = props.errorMessage
    const disabled = props.disabled
    const index = props.index

    function handleChange(event: ChangeEvent<HTMLInputElement>): void {
        const nextValue = event.target.value
        field.onChange(nextValue || undefined)
    }

    return (
        <input
            id={inputId}
            type='url'
            placeholder='https://'
            className={classNames(
                styles.inputField,
                errorMessage && styles.inputError,
            )}
            value={field.value ?? ''}
            onChange={handleChange}
            aria-invalid={!!errorMessage}
            aria-describedby={errorMessage ? `${inputId}-error` : undefined}
            aria-label={`Portfolio URL ${index + 1}`}
            disabled={disabled}
        />
    )
}

const PortfolioUrlsField: FC<PortfolioUrlsFieldProps> = (props: PortfolioUrlsFieldProps) => {
    const control = props.control
    const errors = props.errors
    const disabled = props.disabled
    const fieldArray = useFieldArray({
        control,
        name: 'portfolioUrls',
    })
    const fields = fieldArray.fields
    const append = fieldArray.append
    const remove = fieldArray.remove

    const handleAdd = useCallback(() => {
        if (fields.length >= MAX_URLS) {
            return
        }

        append('')
    }, [append, fields.length])

    const handleRemove = useCallback(
        (index: number) => (): void => {
            remove(index)
        },
        [remove],
    )

    return (
        <div className={styles.fieldGroup}>
            <div>
                <div className={styles.fieldLabel}>Portfolio URLs</div>
                <div className={styles.fieldHint}>{`Add up to ${MAX_URLS} links.`}</div>
            </div>
            <div className={styles.portfolioList}>
                {fields.length === 0 && (
                    <div className={styles.fieldHint}>No portfolio URLs added yet.</div>
                )}
                {fields.map((field, index) => {
                    const errorMessage = errors.portfolioUrls?.[index]?.message as string | undefined
                    const inputId = `portfolio-url-${index}`

                    return (
                        <div className={styles.portfolioItem} key={field.id}>
                            <Controller
                                name={`portfolioUrls.${index}`}
                                control={control}
                                render={function renderPortfolioUrlInput(
                                    renderProps: { field: ControllerRenderProps<ApplicationFormData> },
                                ): JSX.Element {
                                    const inputField = renderProps.field

                                    return (
                                        <PortfolioUrlInput
                                            inputId={inputId}
                                            errorMessage={errorMessage}
                                            index={index}
                                            disabled={disabled}
                                            field={inputField}
                                        />
                                    )
                                }}
                            />
                            <div className={styles.portfolioActions}>
                                <button
                                    type='button'
                                    className={styles.removeButton}
                                    onClick={handleRemove(index)}
                                    disabled={disabled}
                                >
                                    Remove
                                </button>
                            </div>
                            {errorMessage && (
                                <div className={styles.fieldError} id={`${inputId}-error`}>
                                    {errorMessage}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
            <button
                type='button'
                className={styles.addButton}
                onClick={handleAdd}
                disabled={disabled || fields.length >= MAX_URLS}
            >
                Add Portfolio URL
            </button>
        </div>
    )
}

export default PortfolioUrlsField
