import { Dispatch, FC, ReactNode, SetStateAction, useState } from 'react'
import classNames from 'classnames'

import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/outline'

import { Button } from '../button'

import styles from './CollapsibleSkillsList.module.scss'

interface CollapsibleSkillsListProps {
    children?: ReactNode[]
    header?: ReactNode
    containerClass?: string
    headerClass?: string
    contentClass?: string
}

const CollapsibleSkillsList: FC<CollapsibleSkillsListProps> = (props: CollapsibleSkillsListProps) => {
    const [isCollapsed, setIsCollapsed]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(true)

    function toggleCollapse(): void {
        setIsCollapsed(!isCollapsed)
    }

    return (
        <div className={classNames(styles.container, props.containerClass, isCollapsed ? styles.collapsed : '')}>
            <div className={classNames(styles.header, props.headerClass)} onClick={toggleCollapse}>
                {
                    !isCollapsed
                        ? <Button icon={ChevronUpIcon} size='md' className={styles.btn} />
                        : <Button icon={ChevronDownIcon} size='md' className={styles.btn} />
                }
                <div className={styles.title}>{props.header}</div>
                <div className={styles.badgeCount}>
                    {props.children && props.children.length}
                </div>
            </div>

            <div className={classNames(styles.content, props.contentClass)}>
                {props.children}
            </div>
        </div>
    )
}

export default CollapsibleSkillsList
