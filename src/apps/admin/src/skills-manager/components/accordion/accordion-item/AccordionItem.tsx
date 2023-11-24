import { FC } from 'react'
import classNames from 'classnames'

import { IconOutline } from '~/libs/ui'

import styles from './AccordionItem.module.scss'

export interface AccordionItemProps {
    label?: string
    badgeCount?: number
    open?: boolean
    toggle?: () => void
    children: JSX.Element[] | JSX.Element | (() => JSX.Element[] | JSX.Element)
}

const AccordionItem: FC<AccordionItemProps> = props => (
    <div className={classNames(styles.wrap, props.open && styles.open)}>
        <div className={styles.itemHeader}>
            <span className={styles.icon} onClick={props.toggle}>
                <IconOutline.ChevronDownIcon className='icon-lg' />
            </span>
            <div className={styles.titleBar}>
                {props.label && (
                    <div className={styles.textLabel} onClick={props.toggle}>
                        {props.label}
                    </div>
                )}
                {props.badgeCount !== undefined && (
                    <div className={styles.badge}>
                        {props.badgeCount}
                    </div>
                )}
            </div>
        </div>
        {props.open && (
            <div className={styles.content}>
                {typeof props.children === 'function' ? props.children() : props.children}
            </div>
        )}
    </div>
)

export default AccordionItem
