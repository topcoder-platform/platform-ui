/* eslint-disable react/button-has-type */
import { ButtonHTMLAttributes, EventHandler, FC, MouseEvent, ReactNode } from 'react'
import classNames from 'classnames'

import styles from './Button.module.scss'

export enum ButtonSize {
    small = 'sm',
    medium = 'md',
    large = 'lg',
    xLarge = 'xl',
}
export enum ButtonVariants {
    danger = 'danger',
    warning = 'warning',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children?: ReactNode
    className?: string
    disabled?: boolean
    label?: ReactNode
    loading?: boolean
    onClick?: EventHandler<MouseEvent>
    primary?: boolean
    secondary?: boolean
    negative?: boolean
    size?: ButtonSize
    fullWidth?: boolean
    variant?: ButtonVariants
}

const Button: FC<ButtonProps> = props => {

    const className: string = classNames(styles.btn, props.className, {
        'btn-disabled': props.disabled,
        'btn-loading': props.loading,
        'btn-size-full': props.fullWidth,
        [`btn-size-${props.size}`]: !!props.size,
        'btn-type-negative': props.negative,
        'btn-type-primary': props.primary,
        'btn-type-secondary': props.secondary,
        [`btn-variant-${props.variant}`]: !!props.variant,
    })

    return (
        <button
            className={className}
            type={props.type ?? 'button'}
            disabled={props.disabled}
            onClick={props.onClick}
        >
            {props.label ?? props.children}
        </button>
    )
}

export default Button
