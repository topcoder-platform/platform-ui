import { FC, useMemo } from 'react'

import { IconAiReview } from '~/apps/review/src/lib/assets/icons'
import { ScorecardQuestion } from '~/apps/review/src/lib/models'

import { ScorecardViewerContextValue, useScorecardViewerContext } from '../../ScorecardViewer.context'
import { ScorecardQuestionRow } from '../ScorecardQuestionRow'
import { ScorecardScore } from '../../ScorecardScore'
import { MarkdownReview } from '../../../../MarkdownReview'
import { AiFeedbackActions } from '../AiFeedbackActions/AiFeedbackActions'
import { AiFeedbackComments } from '../AiFeedbackComments/AiFeedbackComments'

import styles from './AiFeedback.module.scss'

interface AiFeedbackProps {
    question: ScorecardQuestion
}

const AiFeedback: FC<AiFeedbackProps> = props => {
    const { aiFeedbackItems, scoreMap }: ScorecardViewerContextValue = useScorecardViewerContext()
    const feedback: any = useMemo(() => (
        aiFeedbackItems?.find((r: any) => r.scorecardQuestionId === props.question.id)
    ), [props.question.id, aiFeedbackItems])

    const commentsArr: any[] = (feedback?.comments) || []

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
                    score={scoreMap.get(props.question.id as string) ?? 0}
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

            <AiFeedbackActions feedback={feedback} actionType='runItem' />

            {commentsArr.length > 0 && (
                <AiFeedbackComments comments={commentsArr} feedback={feedback} />
            )}
        </ScorecardQuestionRow>
    )
}

export default AiFeedback
