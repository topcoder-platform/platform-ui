import classNames from 'classnames'
import { Dispatch, FC, ReactNode, SetStateAction, useState } from 'react'

import { IconSolid } from '../..'

import styles from './Form-Field.module.scss'

interface FormFieldProps {
    children: ReactNode
    className?: string
    disabled?: boolean
    label: string
    props?: { [attr: string]: string }
    tabIndex: number
}

const FormField: FC<FormFieldProps> = (props: FormFieldProps) => {

    const [focusStyle, setFocusStyle]: [string | undefined, Dispatch<SetStateAction<string | undefined>>] = useState<string | undefined>()
    const formFieldClasses: string = classNames(
        styles['form-field'],
        props.disabled ? styles.disabled : undefined,
        focusStyle,
        props.props?.error ? styles['form-field-error'] : undefined
    )

    return (
        <div className={styles['form-field-container']}>

            <div
                className={formFieldClasses}
                onBlur={() => setFocusStyle(undefined)}
                onFocus={() => setFocusStyle(styles.focus)}
                {...props}
            >
                <div
                    className={styles.label}
                    role='presentation'
                >
                    {props.label}
                </div>
                {props.children}
            </div>

            {!!props.props?.error && (
                <div className={styles.error}>
                    <IconSolid.ExclamationIcon />
                    {props.props.error}
                </div>
            )}
        </div>
    )
}

export default FormField
