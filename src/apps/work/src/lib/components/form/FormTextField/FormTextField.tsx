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
    disabled?: boolean
    hint?: string
    label: string
    maxLength?: number
    name: string
    placeholder?: string
    required?: boolean
    sanitize?: (value: string) => string
    type?: 'number' | 'text'
}

export const FormTextField: FC<FormTextFieldProps> = (props: FormTextFieldProps) => {
    const className = props.className
    const disabled = props.disabled
    const hint = props.hint
    const label = props.label
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

            field.onChange(nextValue)
        },
        [field, sanitize],
    )

    const value = typeof field.value === 'string'
        ? field.value
        : ''

    return (
        <FormFieldWrapper
            className={className}
            error={fieldState.error?.message}
            hint={hint}
            label={label}
            name={name}
            required={required}
        >
            <div className={styles.inputContainer}>
                <input
                    className={classNames(
                        styles.input,
                        fieldState.error ? styles.error : undefined,
                    )}
                    disabled={disabled}
                    id={name}
                    maxLength={maxLength}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    type={inputType}
                    value={value}
                />
                {maxLength
                    ? (
                        <div className={styles.counter}>
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
