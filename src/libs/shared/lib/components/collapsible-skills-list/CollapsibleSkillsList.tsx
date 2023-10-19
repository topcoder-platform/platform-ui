import { FC, ReactNode } from 'react'
import classNames from 'classnames'

import styles from './CollapsibleSkillsList.module.scss'

interface CollapsibleSkillsListProps {
    children?: ReactNode[]
    header?: ReactNode
    containerClass?: string
    headerClass?: string
    contentClass?: string
}

const CollapsibleSkillsList: FC<CollapsibleSkillsListProps> = (props: CollapsibleSkillsListProps) => (
    <div className={classNames(styles.container, props.containerClass)}>
        <div className={classNames(styles.header, props.headerClass)}>
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

export default CollapsibleSkillsList
