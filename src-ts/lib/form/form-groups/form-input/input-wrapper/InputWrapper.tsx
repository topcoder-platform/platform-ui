import classNames from 'classnames'
import { Dispatch, FC, ReactNode, SetStateAction, useState } from 'react'

import { IconSolid } from '../../../../svgs'

import styles from './InputWrapper.module.scss'

export const optional: string = '(optional)'

interface InputWrapperProps {
    readonly children: ReactNode
    readonly className?: string
    readonly dirty?: boolean
    readonly disabled: boolean
    readonly error?: string
    readonly hideInlineErrors?: boolean
    readonly hint?: string
    readonly label: string
    readonly tabIndex: number
    readonly type: 'password' | 'rating' | 'text' | 'textarea'
}

const InputWrapper: FC<InputWrapperProps> = (props: InputWrapperProps) => {

    const [focusStyle, setFocusStyle]: [string | undefined, Dispatch<SetStateAction<string | undefined>>] = useState<string | undefined>()

    const isShowError: () => boolean = () => !!props.error && !!props.dirty && !!!props.hideInlineErrors
    const showError: boolean = isShowError()
    const formFieldClasses: string = classNames(
        styles.input,
        styles[props.type],
        props.disabled ? styles.disabled : undefined,
        focusStyle,
        showError ? styles['input-error'] : undefined,
        props.className
    )

    return (
        <div
            className={classNames(styles['input-wrapper'], styles[props.type])}
            tabIndex={props.type === 'rating' ? props.tabIndex : -1}
        >

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

export default InputWrapper
