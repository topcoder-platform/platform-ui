import { FC } from 'react'

import { AiFeedbackItem, Scorecard } from '../../../models'

import { ScorecardGroup } from './ScorecardGroup'
import { ScorecardViewerContextProvider } from './ScorecardViewer.context'
import { ScorecardTotal } from './ScorecardTotal'
import styles from './ScorecardViewer.module.scss'

interface ScorecardViewerProps {
    scorecard: Scorecard
    aiFeedback?: AiFeedbackItem[]
    score?: number
}

const ScorecardViewer: FC<ScorecardViewerProps> = props => (
    <div className={styles.wrap}>
        <ScorecardViewerContextProvider
            scorecard={props.scorecard}
            aiFeedbackItems={props.aiFeedback}
        >
            {!!props.score && (
                <div className={styles.conclusion}>
                    <strong>Conclusion</strong>
                    <p>
                        Congratulations! You earned a score of
                        {' '}
                        <strong>
                            {props.score.toFixed(2)}
                        </strong>
                        {' '}
                        out of the maximum of
                        {' '}
                        <strong>
                            {props.scorecard.maxScore.toFixed(2)}
                        </strong>
                        .
                        You did a good job on passing the scorecard criteria.
                        Please check the below sections to see if there is any place for improvement.
                    </p>
                </div>
            )}
            {props.scorecard.scorecardGroups.map((group, index) => (
                <ScorecardGroup key={group.id} group={group} index={index + 1} />
            ))}
            <ScorecardTotal score={props.score} />
        </ScorecardViewerContextProvider>
    </div>
)

export default ScorecardViewer
