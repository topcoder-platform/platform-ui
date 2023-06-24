/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable unicorn/no-null */
/**
 * FormField
 *
 * A Form Field Is a wrapper for input to add the label to it
 */
import React, { FC } from 'react'
import classNames from 'classnames'

import { IconSolid } from '~/libs/ui'

import styles from './styles.module.scss'

interface FormFieldProps {
    children?: any
    className?: string
    label?: string
    error?: string
}

const FormField: FC<FormFieldProps> = ({
    children,
    className,
    label,
    ...props
}: FormFieldProps) => {
    const handleClick: any = (e: any) => {
        // focus on input label click
        const inputElement: any = e.target.closest('.form-field')
            .querySelector('input')
        inputElement?.focus()
    }

    return (
        <div
            className={classNames(styles['form-field-wrapper'], className || '')}
        >
            <div className={classNames(styles['form-field'])} {...props}>
                <div className={styles.label} onClick={handleClick}>
                    {label}
                </div>
                {children}
            </div>
            <div className={classNames(styles.error, 'd-flex align-items-center')}>
                {props.error ? (<IconSolid.ExclamationIcon width={12} height={12} />) : null}
                {props.error}
            </div>
        </div>
    )
}

export default FormField
