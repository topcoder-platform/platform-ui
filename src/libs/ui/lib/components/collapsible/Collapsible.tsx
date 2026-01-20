import { Dispatch, FC, ReactNode, SetStateAction, useState, useEffect } from 'react'
import classNames from 'classnames'

import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid'

import { Button } from '../button'

import styles from './Collapsible.module.scss'

interface CollapsibleProps {
    children?: ReactNode
    header?: ReactNode
    containerClass?: string
    headerClass?: string
    contentClass?: string
    isCollapsed?: boolean
    onToggle?: (isCollapsed: boolean) => void
}

const Collapsible: FC<CollapsibleProps> = (props: CollapsibleProps) => {
    const [internalIsCollapsed, setInternalIsCollapsed]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(props.isCollapsed ?? false)

    // Sync internal state with prop if controlled
    useEffect(() => {
        if (props.isCollapsed !== undefined) {
            setInternalIsCollapsed(props.isCollapsed)
        }
    }, [props.isCollapsed])

    const isCollapsed = props.isCollapsed !== undefined ? props.isCollapsed : internalIsCollapsed

    function toggleCollapse(): void {
        const newValue = !isCollapsed
        if (props.isCollapsed === undefined) {
            setInternalIsCollapsed(newValue)
        }
        props.onToggle?.(newValue)
    }

    return (
        <div className={classNames(styles.container, props.containerClass)}>
            <div className={classNames(styles.header, props.headerClass)} onClick={toggleCollapse}>
                {props.header}
                {
                    !isCollapsed
                        ? <Button icon={ChevronDownIcon} size='lg' className={styles.btn} />
                        : <Button icon={ChevronUpIcon} size='lg' className={styles.btn} />
                }
            </div>

            <div className={classNames(styles.content, props.contentClass, isCollapsed ? styles.collapsed : '')}>
                {props.children}
            </div>
        </div>
    )
}

export default Collapsible
