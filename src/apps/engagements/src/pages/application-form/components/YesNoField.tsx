import { ChangeEvent, FC, useCallback } from 'react'

import type { YesNoAnswer } from '../application-form.types'
import styles from '../ApplicationFormPage.module.scss'

interface YesNoFieldProps {
    /** Base id of the field; used for the radio names and the error message id. */
    id: string
    /** Question shown above the Yes / No options. */
    question: string
    value?: YesNoAnswer
    onChange: (value: YesNoAnswer) => void
    onBlur?: () => void
    disabled?: boolean
    errorMessage?: string
}

const OPTIONS: { label: string, value: YesNoAnswer }[] = [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
]

/**
 * Required Yes / No question rendered as a radio group, used by the availability questions.
 */
const YesNoField: FC<YesNoFieldProps> = (props: YesNoFieldProps) => {
    const onChange = props.onChange
    const errorId = `${props.id}-error`

    const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        onChange(event.target.value as YesNoAnswer)
    }, [onChange])

    return (
        <div
            className={styles.yesNoField}
            role='radiogroup'
            aria-labelledby={`${props.id}-label`}
            aria-invalid={!!props.errorMessage}
            aria-describedby={props.errorMessage ? errorId : undefined}
        >
            <div className={styles.yesNoQuestion} id={`${props.id}-label`}>
                {props.question}
                <span className={styles.requiredIndicator} aria-hidden='true'>*</span>
            </div>
            <div className={styles.yesNoOptions}>
                {OPTIONS.map(option => (
                    <label className={styles.yesNoOption} key={option.value}>
                        <input
                            type='radio'
                            name={props.id}
                            value={option.value}
                            checked={props.value === option.value}
                            onChange={handleChange}
                            onBlur={props.onBlur}
                            disabled={props.disabled}
                        />
                        {option.label}
                    </label>
                ))}
            </div>
            {props.errorMessage && (
                <div className={styles.fieldError} id={errorId}>
                    {props.errorMessage}
                </div>
            )}
        </div>
    )
}

export default YesNoField
