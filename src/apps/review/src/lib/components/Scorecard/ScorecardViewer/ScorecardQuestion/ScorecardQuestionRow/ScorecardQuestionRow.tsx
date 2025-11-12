import { FC, PropsWithChildren, ReactNode } from 'react'
import classNames from 'classnames'

import styles from './ScorecardQuestionRow.module.scss'

interface ScorecardQuestionRowProps extends PropsWithChildren {
    className?: string
    icon?: ReactNode
    index?: string
    score?: ReactNode
}

const ScorecardQuestionRow: FC<ScorecardQuestionRowProps> = props => (
    <div className={classNames(props.className, styles.wrap)}>
        <span className={styles.icon}>{props.icon}</span>
        <span className={styles.index}>{props.index}</span>
        <span className={styles.content}>{props.children}</span>
        <span className={styles.score}>{props.score}</span>
    </div>
)

export default ScorecardQuestionRow
