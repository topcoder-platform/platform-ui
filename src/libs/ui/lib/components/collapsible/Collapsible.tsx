import { Dispatch, FC, ReactNode, SetStateAction, useState } from 'react'
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
}

const Collapsible: FC<CollapsibleProps> = (props: CollapsibleProps) => {
    const [isCollapsed, setIsCollapsed]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    function toggleCollapse(): void {
        setIsCollapsed(!isCollapsed)
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
