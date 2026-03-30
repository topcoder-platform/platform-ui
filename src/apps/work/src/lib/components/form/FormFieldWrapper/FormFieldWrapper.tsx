import {
    FC,
    PropsWithChildren,
} from 'react'
import {
    FieldErrors,
    FieldValues,
    useFormContext,
} from 'react-hook-form'
import classNames from 'classnames'
import get from 'lodash/get'

import styles from './FormFieldWrapper.module.scss'

interface FormFieldWrapperProps {
    className?: string
    error?: string
    hint?: string
    label: string
    name: string
    required?: boolean
}

function getFieldErrorMessage(
    errors: FieldErrors<FieldValues>,
    fieldName: string,
): string | undefined {
    const fieldError = get(errors, fieldName) as { message?: string } | undefined

    return fieldError?.message
}

export const FormFieldWrapper: FC<PropsWithChildren<FormFieldWrapperProps>>
    = (props: PropsWithChildren<FormFieldWrapperProps>) => {
        const formContext = useFormContext()
        const errorMessage = props.error || getFieldErrorMessage(formContext.formState.errors, props.name)

        return (
            <div className={classNames(styles.container, props.className)}>
                <label className={styles.label} htmlFor={props.name}>
                    {props.label}
                    {props.required
                        ? <span className={styles.required}>*</span>
                        : undefined}
                </label>

                {props.children}

                {props.hint
                    ? <div className={styles.hint}>{props.hint}</div>
                    : undefined}

                {errorMessage
                    ? <div className={styles.error}>{errorMessage}</div>
                    : undefined}
            </div>
        )
    }

export default FormFieldWrapper
