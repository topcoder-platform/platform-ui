import { FC, ReactNode } from 'react'
import classNames from 'classnames'

import styles from './SkillsList.module.scss'

interface SkillsListProps {
    children?: ReactNode[]
    header?: ReactNode
    containerClass?: string
    headerClass?: string
    contentClass?: string
}

const SkillsList: FC<SkillsListProps> = (props: SkillsListProps) => (
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

export default SkillsList
