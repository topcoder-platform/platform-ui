import {
    FC,
    useCallback,
    useMemo,
} from 'react'
import {
    useController,
    UseControllerReturn,
    useFormContext,
} from 'react-hook-form'
import classNames from 'classnames'

import { FormFieldWrapper } from '../FormFieldWrapper'

import styles from './FormRadioGroup.module.scss'

export interface FormRadioOption<T extends boolean | string = string> {
    label: string
    value: T
}

interface FormRadioGroupProps {
    disabled?: boolean
    label: string
    name: string
    onChange?: (value: boolean | string) => void
    options: FormRadioOption<boolean | string>[]
    required?: boolean
}

export const FormRadioGroup: FC<FormRadioGroupProps> = (props: FormRadioGroupProps) => {
    const formContext = useFormContext()
    const controller: UseControllerReturn = useController({
        control: formContext.control,
        name: props.name,
    })
    const field = controller.field
    const fieldState = controller.fieldState

    const handleOptionChange = useCallback(
        (optionValue: boolean | string): void => {
            field.onChange(optionValue)
            props.onChange?.(optionValue)
        },
        [
            field,
            props,
        ],
    )

    const optionIds = useMemo(
        () => props.options.map((_, index) => `${props.name}-${index}`),
        [props.name, props.options],
    )

    const optionChangeHandlers = useMemo(
        () => props.options.map(option => () => {
            handleOptionChange(option.value)
        }),
        [
            handleOptionChange,
            props.options,
        ],
    )

    return (
        <FormFieldWrapper
            error={fieldState.error?.message}
            label={props.label}
            name={props.name}
            required={props.required}
        >
            <div className={styles.group}>
                {props.options.map((option, index) => {
                    const optionId = optionIds[index]

                    return (
                        <label
                            className={classNames(
                                styles.option,
                                props.disabled
                                    ? styles.disabled
                                    : undefined,
                            )}
                            htmlFor={optionId}
                            key={optionId}
                        >
                            <input
                                checked={field.value === option.value}
                                className={styles.radio}
                                disabled={props.disabled}
                                id={optionId}
                                name={props.name}
                                onBlur={field.onBlur}
                                onChange={optionChangeHandlers[index]}
                                type='radio'
                                value={String(option.value)}
                            />
                            <span>{option.label}</span>
                        </label>
                    )
                })}
            </div>
        </FormFieldWrapper>
    )
}

export default FormRadioGroup
