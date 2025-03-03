/* eslint-disable react/button-has-type */
import { ButtonHTMLAttributes, EventHandler, FC, MouseEvent, ReactNode } from 'react'
import { pickBy } from 'lodash'
import classNames from 'classnames'

import styles from './BaseButton.module.scss'

export type ButtonSize = 'sm'| 'md'| 'lg'| 'xl'
export type ButtonVariants = 'danger' | 'warning' | 'linkblue' | 'round' | 'tc-green'
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
    light?: boolean
    size?: ButtonSize
    fullWidth?: boolean
    variant?: ButtonVariants
    active?: boolean
    customRadius?: boolean
    noCaps?: boolean
    leftAlignText?: boolean
    textWrap?: boolean
}

const BaseButton: FC<BaseButtonProps> = props => {
    // allow data-props to be passed down to the button
    const dataProps: Partial<BaseButtonProps> = pickBy(props, (v, k) => k.startsWith('data-'))

    const className: string = classNames(styles.btn, props.className, {
        'btn-active': props.active,
        'btn-custom-radius': props.customRadius,
        'btn-disabled': props.disabled,
        'btn-left-align-text': props.leftAlignText,
        'btn-light': props.light,
        'btn-loading': props.loading,
        'btn-no-caps': props.noCaps,
        'btn-size-full': props.fullWidth,
        [`btn-size-${props.size}`]: !!props.size,
        'btn-style-link': props.link,
        'btn-style-primary': props.primary,
        'btn-style-secondary': props.secondary,
        [`btn-variant-${props.variant}`]: !!props.variant,
        'btn-text-wrap': props.textWrap,
    })

    return (
        <button
            {...dataProps}
            title={props.title}
            name={props.name}
            value={props.value}
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
