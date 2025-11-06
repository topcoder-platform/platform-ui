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
        <span>{props.icon}</span>
        <span>{props.index}</span>
        <span className={styles.content}>{props.children}</span>
        <span>{props.score}</span>
    </div>
)

export default ScorecardQuestionRow
