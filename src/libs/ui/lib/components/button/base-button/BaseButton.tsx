/* eslint-disable react/button-has-type */
import { ButtonHTMLAttributes, EventHandler, FC, MouseEvent, ReactNode } from 'react'
import classNames from 'classnames'

import styles from './BaseButton.module.scss'

export type ButtonSize = 'sm'| 'md'| 'lg'| 'xl'
export type ButtonVariants = 'danger' | 'warning'
export type ButtonTypes = 'primary' | 'secondary'

export interface BaseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children?: ReactNode
    className?: string
    disabled?: boolean
    label?: ReactNode
    loading?: boolean
    onClick?: EventHandler<MouseEvent>
    primary?: boolean
    secondary?: boolean
    link?: boolean
    negative?: boolean
    size?: ButtonSize
    fullWidth?: boolean
    variant?: ButtonVariants
}

const BaseButton: FC<BaseButtonProps> = props => {

    const className: string = classNames(styles.btn, props.className, {
        'btn-disabled': props.disabled,
        'btn-loading': props.loading,
        'btn-negative': props.negative,
        'btn-size-full': props.fullWidth,
        [`btn-size-${props.size}`]: !!props.size,
        'btn-type-link': props.link,
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

export default BaseButton
