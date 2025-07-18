import {
    Dispatch,
    forwardRef,
    ForwardRefExoticComponent,
    ReactNode,
    SetStateAction,
    useState,
} from 'react'
import classNames from 'classnames'

import { IconSolid } from '../../../../svgs'

import styles from './InputWrapper.module.scss'

export const optional: string = '(optional)'

interface InputWrapperProps {
    readonly children: ReactNode
    readonly className?: string
    readonly classNameWrapper?: string
    readonly dirty?: boolean
    readonly disabled: boolean
    readonly error?: string
    readonly hideInlineErrors?: boolean
    readonly hint?: string
    readonly label: string | JSX.Element
    readonly tabIndex?: number
    readonly type: 'checkbox' | 'password' | 'rating' | 'text' | 'textarea' | 'number'
    readonly forceFocusStyle?: boolean
}

const InputWrapper: ForwardRefExoticComponent<InputWrapperProps & { ref?: React.Ref<HTMLDivElement> }>
= forwardRef<HTMLDivElement, InputWrapperProps>((props: InputWrapperProps, ref) => {

    const [focusStyle, setFocusStyle]: [string | undefined, Dispatch<SetStateAction<string | undefined>>]
        = useState<string | undefined>()

    const isShowError: () => boolean = () => !!props.error && !!props.dirty && !props.hideInlineErrors
    const showError: boolean = isShowError()
    const formFieldClasses: string = classNames(
        styles.input,
        'input-el',
        styles[props.type],
        props.disabled ? styles.disabled : undefined,
        focusStyle,
        showError ? styles['input-error'] : undefined,
        props.className,
        {
            [styles.focus]: props.forceFocusStyle,
        },
    )

    const renderCheckboxLabel: () => JSX.Element | boolean = () => props.type === 'checkbox' && (
        <div className={styles['checkbox-label']}>
            {props.label}
        </div>
    )

    function clearFocusStyle(): void {
        setFocusStyle(undefined)
    }

    function setStyleForFocus(): void {
        setFocusStyle(styles.focus)
    }

    return (
        <div
            className={classNames(styles['input-wrapper'], 'input-wrapper', styles[props.type], props.classNameWrapper)}
            tabIndex={props.type === 'rating' ? (props.tabIndex ?? -1) : -1}
            ref={ref}
        >

            <div
                className={formFieldClasses}
                onBlur={clearFocusStyle}
                onFocus={setStyleForFocus}
            >
                <label
                    className={styles.label}
                    role='presentation'
                >
                    {
                        props.type !== 'checkbox' && (
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
                        )
                    }

                    {props.children}

                    {renderCheckboxLabel()}
                </label>
            </div>

            {showError && (
                <div className={classNames(styles.error, 'input-error')}>
                    <IconSolid.ExclamationIcon />
                    {props.error}
                </div>
            )}
        </div>
    )
})

export default InputWrapper
