import classNames from 'classnames'
import { noop } from 'lodash'
import { Dispatch, FC, ReactNode, SetStateAction, useCallback, useState } from 'react'

import { IconSolid } from '../../../../lib'

import styles from './CollapsiblePane.module.scss'

interface CollapsiblePaneProps {
    children: ReactNode
    onToggle?: (isOpen: boolean) => void
    position?: 'to-left'|'to-right'
    title: string
}

const CollapsiblePane: FC<CollapsiblePaneProps> = (props: CollapsiblePaneProps) => {
    const {onToggle = noop}: CollapsiblePaneProps = props
    const [isOpen, setIsOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const toggle: () => void = useCallback(() => {
      setIsOpen(!isOpen)
      onToggle(!isOpen)
    }, [isOpen, onToggle])

    return (
        <div className={
            classNames(
                styles['wrap'],
                props.position ?? 'to-left',
                isOpen ? 'open' : 'collapsed',
            )
        }>
            <div className={styles['pane-outline']} onClick={toggle}>
                {isOpen ? <IconSolid.ChevronDoubleLeftIcon /> : <IconSolid.ChevronDoubleRightIcon />}
                {props.title}
            </div>
            <div className={styles['content']}>
                {props.children}
            </div>
        </div>
    )
}

export default CollapsiblePane
