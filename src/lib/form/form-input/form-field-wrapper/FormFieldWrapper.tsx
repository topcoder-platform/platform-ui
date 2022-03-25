import classNames from 'classnames'
import { Dispatch, FC, ReactNode, SetStateAction, useState } from 'react'

import { IconSolid } from '../../../svgs'

import styles from './FormFieldWrapper.module.scss'

export const optionalHint: string = '(optional)'

interface FormFieldWrapperProps {
    readonly children: ReactNode
    readonly dirtyOrTouched?: boolean
    readonly disabled: boolean
    readonly error?: string
    readonly hint?: string
    readonly label: string
    readonly name: string
}

const FormFieldWrapper: FC<FormFieldWrapperProps> = (props: FormFieldWrapperProps) => {

    const [focusStyle, setFocusStyle]: [string | undefined, Dispatch<SetStateAction<string | undefined>>] = useState<string | undefined>()

    const showError: boolean = !!props.error && !!props.dirtyOrTouched
    const formFieldClasses: string = classNames(
        styles['form-field'],
        props.disabled ? styles.disabled : undefined,
        focusStyle,
        showError ? styles['form-field-error'] : undefined
    )

    return (
        <div className={styles['form-field-wrapper']}>

            <div
                className={formFieldClasses}
                onBlur={() => setFocusStyle(undefined)}
                onFocus={() => setFocusStyle(styles.focus)}
            >
                <label
                    className={styles.label}
                    role='presentation'
                >
                    <div className={styles['label-and-hint']}>
                        <div>
                            {props.label}
                        </div>
                        {!!props.hint && (
                            <div className={styles.hint}>
                                {props.hint}
                            </div>
                        )}
                    </div>

                    {props.children}
                </label>
            </div>

            {showError && (
                <div className={styles.error}>
                    <IconSolid.ExclamationIcon />
                    {props.error}
                </div>
            )}
        </div>
    )
}

export default FormFieldWrapper
