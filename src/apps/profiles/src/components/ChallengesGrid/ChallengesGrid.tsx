import { FC } from 'react'
import classNames from 'classnames'
import { SERMChallengeStats } from '~/libs/core'

import styles from './ChallengesGrid.module.scss'

interface ChallengesGridProps {
    challengesData: Array<SERMChallengeStats>
}

const ChallengesGrid: FC<ChallengesGridProps> = (props: ChallengesGridProps) => {
    const { challengesData } = props
    const l1 = challengesData.find((d) => d.levelName === 'Level One')
    const l2 = challengesData.find((d) => d.levelName === 'Level Two')
    const l3 = challengesData.find((d) => d.levelName === 'Level Three')
    const totalCreated = (l1?.challenges || 0) + (l2?.challenges || 0) + (l3?.challenges || 0)
    const totalFailed = (l1?.failedChallenges || 0) + (l2?.failedChallenges || 0) + (l3?.failedChallenges || 0)
    const totalSuccess = Math.ceil(((1 - (totalFailed / totalCreated)) * 100) || 0)
    const l1Success = Math.ceil(((1 - ((l1?.failedChallenges || 0) / (l1?.challenges || 0))) * 100) || 0)
    const l2Success = Math.ceil(((1 - ((l2?.failedChallenges || 0) / (l2?.challenges || 0))) * 100) || 0)
    const l3Success = Math.ceil(((1 - ((l3?.failedChallenges || 0) / (l3?.challenges || 0))) * 100) || 0)

    return (
        <div className={styles.challengesGrid}>
            <p className="body-medium-bold">Challenges</p>
            <p className={styles.gridHead}>SUCCESS</p>
            <p className={styles.gridHead}>CREATED</p>
            <p className={styles.gridHead}>FAILED</p>
            <p className={classNames(styles.gridLeftSidebar, styles.blue)}>TOTAL</p>
            <p className={classNames(styles.gridCell, styles.blue)}>{totalSuccess}%</p>
            <p className={classNames(styles.gridCell, styles.blue)}>{totalCreated}</p>
            <p className={classNames(styles.gridCell, styles.blue)}>{totalFailed}</p>
            <p className={styles.gridLeftSidebar}>Level One</p>
            <p className={styles.gridCell}>{l1Success}%</p>
            <p className={styles.gridCell}>{l1?.challenges}</p>
            <p className={styles.gridCell}>{l1?.failedChallenges}</p>
            <p className={styles.gridLeftSidebar}>Level Two</p>
            <p className={styles.gridCell}>{l2Success}%</p>
            <p className={styles.gridCell}>{l2?.challenges}</p>
            <p className={styles.gridCell}>{l2?.failedChallenges}</p>
            <p className={styles.gridLeftSidebar}>Level Three</p>
            <p className={styles.gridCell}>{l3Success}%</p>
            <p className={styles.gridCell}>{l3?.challenges}</p>
            <p className={styles.gridCell}>{l3?.failedChallenges}</p>
        </div>
    )
}

export default ChallengesGrid
