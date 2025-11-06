import { FC, useMemo } from 'react'

import { ScorecardViewerContextValue, useScorecardContext } from '../../ScorecardViewer.context'
import { ScorecardQuestionRow } from '../ScorecardQuestionRow'

import styles from './AiFeedback.module.scss'
import { IconAiReview } from '~/apps/review/src/lib/assets/icons'
import { ScorecardQuestion } from '~/apps/review/src/lib/models'
import { ScorecardScore } from '../../ScorecardScore'

interface AiFeedbackProps {
    question: ScorecardQuestion
}

const AiFeedback: FC<AiFeedbackProps> = props => {
    const { aiFeedbackItems }: ScorecardViewerContextValue = useScorecardContext()
    const feedback = useMemo(() => aiFeedbackItems?.find(r => r.scorecardQuestionId === props.question.id), [props.question.id, aiFeedbackItems])

    if (!aiFeedbackItems?.length || !feedback) {
        return <></>
    }

    const isYesNo = props.question.type === 'YES_NO';

    return (
        <ScorecardQuestionRow
            icon={<IconAiReview />}
            index="AI Feedback"
            className={styles.wrap}
            score={
                <ScorecardScore
                    score={feedback.questionScore}
                    scaleMax={props.question.scaleMax}
                    scaleType={props.question.type}
                    weight={props.question.weight}
                />
            }
        >
            {isYesNo && (
                <p>
                    <strong>{feedback.questionScore ? 'Yes' : 'No'}</strong>
                </p>
            )}
            {feedback.content}
        </ScorecardQuestionRow>
    )
}

export default AiFeedback
