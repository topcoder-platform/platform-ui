import { FC, ReactNode } from 'react'
import { omit } from 'lodash'
import classNames from 'classnames'

import Button, { ButtonProps } from '../Button'

import styles from './IconButton.module.scss'

export interface IconButtonProps extends ButtonProps {
    icon: ReactNode
    iconToLeft?: boolean
    iconToRight?: boolean
}

const IconButton: FC<IconButtonProps> = props => {
    const buttonProps: ButtonProps = omit(props, [
        'icon',
        'iconToLeft',
        'iconToRight',
        'label',
        'children',
    ])

    const icon: ReactNode = !!props.icon && (
        <div className='btn-icon'>
            {props.icon}
        </div>
    )

    return (
        <Button
            {...buttonProps}
            className={classNames(props.className, styles['icon-btn'])}
        >
            {props.iconToLeft && icon}
            {!!props.label && <span>{props.label}</span>}
            {!props.iconToLeft && !props.iconToRight && icon}
            {props.iconToRight && icon}
        </Button>
    )
}

export default IconButton
