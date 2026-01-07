import { FC, useCallback } from 'react'
import { Control, Controller, FieldErrors, useFieldArray } from 'react-hook-form'
import classNames from 'classnames'

import { ApplicationFormData } from '../application-form.types'
import styles from '../ApplicationFormPage.module.scss'

interface PortfolioUrlsFieldProps {
    control: Control<ApplicationFormData>
    errors: FieldErrors<ApplicationFormData>
    disabled?: boolean
}

const MAX_URLS = 10

const PortfolioUrlsField: FC<PortfolioUrlsFieldProps> = ({ control, errors, disabled }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'portfolioUrls',
    })

    const handleAdd = useCallback(() => {
        if (fields.length >= MAX_URLS) {
            return
        }
        append('')
    }, [append, fields.length])

    return (
        <div className={styles.fieldGroup}>
            <div>
                <div className={styles.fieldLabel}>Portfolio URLs</div>
                <div className={styles.fieldHint}>Add up to {MAX_URLS} links.</div>
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
                                render={({ field: inputField }) => (
                                    <input
                                        id={inputId}
                                        type='url'
                                        placeholder='https://'
                                        className={classNames(
                                            styles.inputField,
                                            errorMessage && styles.inputError,
                                        )}
                                        value={inputField.value ?? ''}
                                        onChange={event => {
                                            const nextValue = event.target.value
                                            inputField.onChange(nextValue || undefined)
                                        }}
                                        aria-invalid={!!errorMessage}
                                        aria-describedby={errorMessage ? `${inputId}-error` : undefined}
                                        aria-label={`Portfolio URL ${index + 1}`}
                                        disabled={disabled}
                                    />
                                )}
                            />
                            <div className={styles.portfolioActions}>
                                <button
                                    type='button'
                                    className={styles.removeButton}
                                    onClick={() => remove(index)}
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
