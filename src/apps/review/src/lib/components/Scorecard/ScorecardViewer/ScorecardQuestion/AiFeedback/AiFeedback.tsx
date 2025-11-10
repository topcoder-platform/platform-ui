import { FC, useMemo } from 'react'

import { IconAiReview } from '~/apps/review/src/lib/assets/icons'
import { ScorecardQuestion } from '~/apps/review/src/lib/models'

import { ScorecardViewerContextValue, useScorecardContext } from '../../ScorecardViewer.context'
import { ScorecardQuestionRow } from '../ScorecardQuestionRow'
import { ScorecardScore } from '../../ScorecardScore'

import styles from './AiFeedback.module.scss'
import { MarkdownReview } from '../../../../MarkdownReview'

interface AiFeedbackProps {
    question: ScorecardQuestion
}

const AiFeedback: FC<AiFeedbackProps> = props => {
    const { aiFeedbackItems }: ScorecardViewerContextValue = useScorecardContext()
    const feedback = useMemo(() => (
        aiFeedbackItems?.find(r => r.scorecardQuestionId === props.question.id)
    ), [props.question.id, aiFeedbackItems])

    if (!aiFeedbackItems?.length || !feedback) {
        return <></>
    }

    const isYesNo = props.question.type === 'YES_NO'

    return (
        <ScorecardQuestionRow
            icon={<IconAiReview />}
            index='AI Feedback'
            className={styles.wrap}
            score={(
                <ScorecardScore
                    score={feedback.questionScore}
                    scaleMax={props.question.scaleMax}
                    weight={props.question.weight}
                />
            )}
        >
            {isYesNo && (
                <p>
                    <strong>{feedback.questionScore ? 'Yes' : 'No'}</strong>
                </p>
            )}
            <MarkdownReview value={feedback.content} />
        </ScorecardQuestionRow>
    )
}

export default AiFeedback
