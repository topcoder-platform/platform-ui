import classNames from 'classnames'
import { FC, PropsWithChildren, cloneElement } from 'react'
import { Controller, ControllerFieldState, ControllerRenderProps, FieldError, FieldValues, useFormContext, UseFormStateReturn } from 'react-hook-form'

import styles from './InputWrapper.module.scss'

interface InputWrapperProps extends PropsWithChildren {
    className?: string
    label?: string
    name: string
    placeholder?: string
}

const InputWrapper: FC<InputWrapperProps> = props => {
    const form = useFormContext();

    const renderInput = ({ field, fieldState, formState }: {
        field: ControllerRenderProps<FieldValues, string>;
        fieldState: ControllerFieldState;
        formState: UseFormStateReturn<FieldValues>;
    }) => {
        // Expecting a single React element as children (the input)
        if (!props.children || Array.isArray(props.children)) return <></>;
        const child = props.children as React.ReactElement<any>;

        const showError = fieldState.error && (
            fieldState.isTouched || fieldState.isDirty || formState.submitCount > 0
        )

        return (
            <label className={classNames(styles.inputWrap, props.className, showError && styles.hasError)}>
                {props.label && (
                    <div className={styles.inputWrapLabel}>{props.label}</div>
                )}
                {
                    cloneElement(child, {
                        ...field,
                        className: classNames(child.props.className, styles.inputWrapInput),
                        placeholder: props.placeholder,
                        value: typeof child.props.mapValue === 'function' ? child.props.mapValue(field.value) : field.value,
                        'data-value': typeof child.props.mapValue === 'function' ? child.props.mapValue(field.value) : field.value,
                        onChange: typeof child.props.onChange === 'function' ? (ev: any) => child.props.onChange(ev, field) : field.onChange,
                    })
                }

                <div className={classNames(styles.errorText, 'input-error')}>
                    {fieldState.error?.message}
                </div>
            </label>
        );
    }

    return (
        <Controller
            name={props.name}
            control={form.control}
            render={renderInput}
        />
    )
}

export default InputWrapper
