import {
    ChangeEvent,
    FC,
    useCallback,
} from 'react'
import {
    useController,
    UseControllerReturn,
    useFormContext,
} from 'react-hook-form'
import classNames from 'classnames'

import { FormFieldWrapper } from '../FormFieldWrapper'

import styles from './FormTextField.module.scss'

export interface FormTextFieldProps {
    className?: string
    counterPosition?: 'below' | 'inline'
    disabled?: boolean
    hint?: string
    max?: number
    label: string
    min?: number
    maxLength?: number
    name: string
    placeholder?: string
    required?: boolean
    sanitize?: (value: string) => string
    type?: 'number' | 'text'
}

/**
 * Formats the stored form value the same way the text input renders it.
 *
 * @param value current React Hook Form field value.
 * @returns the string value rendered in the input.
 * @throws Does not throw.
 */
function getInputValue(value: unknown): string {
    if (typeof value === 'string') {
        return value
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value)
    }

    return ''
}

export const FormTextField: FC<FormTextFieldProps> = (props: FormTextFieldProps) => {
    const className = props.className
    const counterPosition = props.counterPosition || 'below'
    const disabled = props.disabled
    const hint = props.hint
    const max = props.max
    const label = props.label
    const min = props.min
    const maxLength = props.maxLength
    const name = props.name
    const placeholder = props.placeholder
    const required = props.required
    const sanitize = props.sanitize
    const type = props.type

    const formContext = useFormContext()
    const {
        field,
        fieldState,
    }: UseControllerReturn = useController({
        control: formContext.control,
        name,
    })

    const inputType = type || 'text'

    const handleInputChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>): void => {
            const nextRawValue = event.target.value
            const nextValue = sanitize
                ? sanitize(nextRawValue)
                : nextRawValue

            if (nextValue === getInputValue(field.value)) {
                return
            }

            field.onChange(nextValue)
        },
        [field, sanitize],
    )

    const value = getInputValue(field.value)
    const isCounterInline = !!maxLength && counterPosition === 'inline'

    return (
        <FormFieldWrapper
            className={className}
            error={fieldState.error?.message}
            hint={hint}
            label={label}
            name={name}
            required={required}
        >
            <div
                className={classNames(
                    styles.inputContainer,
                    isCounterInline ? styles.inputContainerInlineCounter : undefined,
                )}
            >
                <input
                    className={classNames(
                        styles.input,
                        isCounterInline ? styles.inputWithInlineCounter : undefined,
                        fieldState.error ? styles.error : undefined,
                    )}
                    disabled={disabled}
                    id={name}
                    max={max}
                    maxLength={maxLength}
                    min={min}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    type={inputType}
                    value={value}
                />
                {maxLength
                    ? (
                        <div
                            className={classNames(
                                styles.counter,
                                isCounterInline ? styles.counterInline : undefined,
                            )}
                        >
                            {value.length}
                            /
                            {maxLength}
                        </div>
                    )
                    : undefined}
            </div>
        </FormFieldWrapper>
    )
}

export default FormTextField
