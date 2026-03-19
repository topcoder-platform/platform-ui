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

import styles from './FormCheckboxField.module.scss'

interface FormCheckboxFieldProps {
    disabled?: boolean
    hint?: string
    label: string
    name: string
    onChange?: (checked: boolean) => void
}

export const FormCheckboxField: FC<FormCheckboxFieldProps> = (props: FormCheckboxFieldProps) => {
    const formContext = useFormContext()
    const controller: UseControllerReturn = useController({
        control: formContext.control,
        name: props.name,
    })
    const field = controller.field
    const fieldState = controller.fieldState

    const checked = field.value === true

    const handleChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>): void => {
            field.onChange(event.target.checked)
            props.onChange?.(event.target.checked)
        },
        [field, props],
    )

    return (
        <FormFieldWrapper
            error={fieldState.error?.message}
            hint={props.hint}
            label={props.label}
            name={props.name}
        >
            <label
                className={classNames(
                    styles.checkboxLabel,
                    props.disabled
                        ? styles.disabled
                        : undefined,
                )}
                htmlFor={props.name}
            >
                <input
                    checked={checked}
                    className={styles.checkbox}
                    disabled={props.disabled}
                    id={props.name}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={handleChange}
                    type='checkbox'
                />
                <span>{props.label}</span>
            </label>
        </FormFieldWrapper>
    )
}

export default FormCheckboxField
