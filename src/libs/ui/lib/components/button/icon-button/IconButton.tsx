import { FC, ReactNode, SVGProps } from 'react'
import { omit } from 'lodash'
import classNames from 'classnames'

import { BaseButton, BaseButtonProps } from '../base-button'

import styles from './IconButton.module.scss'

export interface IconButtonProps extends BaseButtonProps {
    icon?: FC<SVGProps<SVGSVGElement>>
    iconToLeft?: boolean
    iconToRight?: boolean
}

const IconButton: FC<IconButtonProps> = props => {
    const buttonProps: BaseButtonProps = omit(props, [
        'icon',
        'iconToLeft',
        'iconToRight',
        'label',
        'children',
    ])

    const Icon: FC<SVGProps<SVGSVGElement>> = props.icon as unknown as FC<SVGProps<SVGSVGElement>>
    const icon: ReactNode = !!props.icon && (
        <div className='btn-icon'>
            <Icon />
        </div>
    )

    return (
        <BaseButton
            {...buttonProps}
            className={classNames(props.className, styles['icon-btn'])}
        >
            {(props.iconToLeft || !props.iconToRight) && icon}
            {!!props.label && <span>{props.label}</span>}
            {!!props.children && <span>{props.children}</span>}
            {props.iconToRight && icon}
        </BaseButton>
    )
}

export default IconButton
