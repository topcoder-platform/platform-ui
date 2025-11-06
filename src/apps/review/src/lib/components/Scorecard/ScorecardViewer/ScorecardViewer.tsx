import { FC } from 'react'

import styles from './ScorecardViewer.module.scss'
import { AiFeedbackItem, Scorecard } from '../../../models'
import { ScorecardGroup } from './ScorecardGroup'
import { ScorecardViewerContextProvider } from './ScorecardViewer.context'
import { ScorecardTotal } from './ScorecardTotal'

interface ScorecardViewerProps {
    scorecard: Scorecard
    aiFeedback?: AiFeedbackItem[]
    score?: number
}

const ScorecardViewer: FC<ScorecardViewerProps> = props => {

    return (
        <div className={styles.wrap}>
            <ScorecardViewerContextProvider
                scorecard={props.scorecard}
                aiFeedbackItems={props.aiFeedback}
            >
                {props.scorecard.scorecardGroups.map((group, index) => (
                    <ScorecardGroup key={group.id} group={group} index={index+1} />
                ))}
                <ScorecardTotal score={props.score} />
            </ScorecardViewerContextProvider>
        </div>
    )
}

export default ScorecardViewer
