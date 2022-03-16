import classNames from 'classnames'
import { Dispatch, FC, ReactNode, SetStateAction, useState } from 'react'

import { IconSolid } from '../../svgs'

import styles from './Form-Field-Wrapper.module.scss'

interface FormFieldWrapperProps {
    children: ReactNode
    disabled: boolean
    error?: string
    label: string
}

const FormFieldWrapper: FC<FormFieldWrapperProps> = (props: FormFieldWrapperProps) => {

    const [focusStyle, setFocusStyle]: [string | undefined, Dispatch<SetStateAction<string | undefined>>] = useState<string | undefined>()
    const formFieldClasses: string = classNames(
        styles['form-field'],
        props.disabled ? styles.disabled : undefined,
        focusStyle,
        !!props.error ? styles['form-field-error'] : undefined
    )

    return (
        <div className={styles['form-field-wrapper']}>

            <div
                className={formFieldClasses}
                onBlur={() => setFocusStyle(undefined)}
                onFocus={() => setFocusStyle(styles.focus)}
            >
                <div
                    className={styles.label}
                    role='presentation'
                >
                    {props.label}
                </div>
                {props.children}
            </div>

            {!!props.error && (
                <div className={styles.error}>
                    <IconSolid.ExclamationIcon />
                    {props.error}
                </div>
            )}
        </div>
    )
}

export default FormFieldWrapper
