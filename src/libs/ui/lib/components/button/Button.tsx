/* eslint-disable react/button-has-type */
import { FC, ReactNode } from 'react'

import { BaseButton, BaseButtonProps } from './base-button'
import { IconButton, IconButtonProps } from './icon-button'

export type ButtonSize = 'sm'| 'md'| 'lg'| 'xl'
export enum ButtonVariants {
    danger = 'danger',
    warning = 'warning',
}

export interface ButtonProps extends IconButtonProps, BaseButtonProps {
    children?: ReactNode
}

const Button: FC<ButtonProps> = props => {
    const ButtonComponent: FC<IconButtonProps> | FC<BaseButtonProps> = props.icon ? IconButton : BaseButton

    return (
        <ButtonComponent {...props} />
    )
}

export default Button
