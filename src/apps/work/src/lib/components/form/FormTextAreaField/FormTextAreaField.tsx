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

import styles from './FormTextAreaField.module.scss'

export interface FormTextAreaFieldProps {
    className?: string
    disabled?: boolean
    hint?: string
    label: string
    maxLength?: number
    name: string
    placeholder?: string
    required?: boolean
    rows?: number
}

export const FormTextAreaField: FC<FormTextAreaFieldProps> = (props: FormTextAreaFieldProps) => {
    const formContext = useFormContext()
    const {
        field,
        fieldState,
    }: UseControllerReturn = useController({
        control: formContext.control,
        name: props.name,
    })

    const handleInputChange = useCallback(
        (event: ChangeEvent<HTMLTextAreaElement>): void => {
            field.onChange(event.target.value)
        },
        [field],
    )

    const value = typeof field.value === 'string'
        ? field.value
        : ''

    return (
        <FormFieldWrapper
            className={props.className}
            error={fieldState.error?.message}
            hint={props.hint}
            label={props.label}
            name={props.name}
            required={props.required}
        >
            <div className={styles.textAreaContainer}>
                <textarea
                    className={classNames(
                        styles.textArea,
                        fieldState.error ? styles.error : undefined,
                    )}
                    disabled={props.disabled}
                    id={props.name}
                    maxLength={props.maxLength}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={handleInputChange}
                    placeholder={props.placeholder}
                    rows={props.rows || 4}
                    value={value}
                />
                {props.maxLength
                    ? (
                        <div className={styles.counter}>
                            {value.length}
                            /
                            {props.maxLength}
                        </div>
                    )
                    : undefined}
            </div>
        </FormFieldWrapper>
    )
}

export default FormTextAreaField
