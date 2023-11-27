import { FC, useMemo } from 'react'
import classNames from 'classnames'

import { IconOutline } from '~/libs/ui'

import { ActionsMenu, ActionsMenuItem } from '../../actions-menu'

import styles from './AccordionItem.module.scss'

export interface AccordionItemProps {
    label?: string
    badgeCount?: number
    open?: boolean
    toggle?: () => void
    children: JSX.Element[] | JSX.Element | (() => JSX.Element[] | JSX.Element)
    menuActions: ActionsMenuItem[]
    onMenuAction: (a: string) => void
}

const AccordionItem: FC<AccordionItemProps> = props => {
    const content = useMemo(() => (!props.open ? <></> : (
        <div className={styles.content}>
            {typeof props.children === 'function' ? props.children.call(undefined) : props.children}
        </div>
    )), [props.children, props.open])

    return (
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
                    {props.menuActions?.length > 0 && (
                        <ActionsMenu
                            items={props.menuActions}
                            onAction={props.onMenuAction}
                            className={styles.menu}
                        >
                            <IconOutline.DotsVerticalIcon className='icon-lg' />
                        </ActionsMenu>
                    )}
                </div>
            </div>
            {content}
        </div>
    )
}

export default AccordionItem
