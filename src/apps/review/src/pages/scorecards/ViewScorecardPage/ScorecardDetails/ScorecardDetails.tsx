import { FC } from 'react'
import cn from 'classnames'

import { ProjectTypeLabels, Scorecard, ScorecardStatusLabels, ScorecardTypeLabels } from '~/apps/review/src/lib/models'

import styles from './ScorecardDetails.module.scss'

interface ScorecardDetailsProps {
    scorecard: Scorecard
}

const ScorecardDetails: FC<ScorecardDetailsProps> = (props: ScorecardDetailsProps) => {
    const getStatusClassname = (): string => styles[ScorecardStatusLabels[props.scorecard.status]?.toLowerCase()]
    return (
        <div className={styles.container}>
            <div className={styles.left}>
                <div className={styles.item}>
                    <div className={styles.label}>Version</div>
                    <div className={styles.value}>{props.scorecard.version}</div>
                </div>
                <div className={styles.item}>
                    <div className={styles.label}>Type</div>
                    <div className={styles.value}>{ScorecardTypeLabels[props.scorecard.type]}</div>
                </div>
                <div className={styles.item}>
                    <div className={styles.label}>Project Type</div>
                    <div className={styles.value}>{ProjectTypeLabels[props.scorecard.challengeTrack]}</div>
                </div>
            </div>
            <div className={styles.right}>
                <div className={styles.item}>
                    <div className={styles.label}>Category</div>
                    <div className={styles.value}>{props.scorecard.challengeType}</div>
                </div>
                <div className={styles.item}>
                    <div className={styles.label}>Status</div>
                    <div
                        className={cn(styles.value, getStatusClassname())}
                    >
                        {ScorecardStatusLabels[props.scorecard.status]}
                    </div>
                </div>
                <div className={styles.item}>
                    <div className={styles.label}>Min - Max. Score</div>
                    <div className={styles.value}>{`${props.scorecard.minScore} - ${props.scorecard.maxScore}`}</div>
                </div>
            </div>
        </div>
    )
}

export default ScorecardDetails
