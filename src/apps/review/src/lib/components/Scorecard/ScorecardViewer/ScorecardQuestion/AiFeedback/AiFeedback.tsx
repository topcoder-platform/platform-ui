import { FC, useCallback, useMemo, useState } from 'react'
import { mutate } from 'swr'

import { IconAiReview } from '~/apps/review/src/lib/assets/icons'
import { ReviewsContextModel, ScorecardQuestion } from '~/apps/review/src/lib/models'
import { createFeedbackComment } from '~/apps/review/src/lib/services'
import { useReviewsContext } from '~/apps/review/src/pages/reviews/ReviewsContext'
import { EnvironmentConfig } from '~/config'
import { Tooltip } from '~/libs/ui'

import { ScorecardViewerContextValue, useScorecardViewerContext } from '../../ScorecardViewer.context'
import { ScorecardQuestionRow } from '../ScorecardQuestionRow'
import { ScorecardScore } from '../../ScorecardScore'
import { MarkdownReview } from '../../../../MarkdownReview'
import { AiFeedbackActions } from '../AiFeedbackActions/AiFeedbackActions'
import { AiFeedbackComments } from '../AiFeedbackComments/AiFeedbackComments'
import { AiFeedbackReply } from '../AiFeedbackReply/AiFeedbackReply'

import styles from './AiFeedback.module.scss'

interface AiFeedbackProps {
    question: ScorecardQuestion
}

const AiFeedback: FC<AiFeedbackProps> = props => {
    const { aiFeedbackItems, scoreMap }: ScorecardViewerContextValue = useScorecardViewerContext()
    const feedback: any = useMemo(() => (
        aiFeedbackItems?.find((r: any) => r.scorecardQuestionId === props.question.id)
    ), [props.question.id, aiFeedbackItems])
    const { workflowId, workflowRun }: ReviewsContextModel = useReviewsContext()
    const [showReply, setShowReply] = useState(false)

    const commentsArr: any[] = (feedback?.comments) || []

    const onShowReply = useCallback(() => {
        setShowReply(!showReply)
    }, [])

    const onSubmitReply = useCallback(async (content: string) => {
        await createFeedbackComment(workflowId as string, workflowRun?.id as string, feedback?.id, {
            content,
        })
        await mutate(`${EnvironmentConfig.API.V6}/workflows/${workflowId}/runs/${workflowRun?.id}/items?[${workflowRun?.status}]`)
        setShowReply(false)
    }, [workflowId, workflowRun?.id, feedback?.id])

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
            <p>
                <strong>
                    {isYesNo && (feedback.questionScore ? 'Yes' : 'No')}
                    {!isYesNo && (
                        <Tooltip
                            content={`On a scale of ${props.question.scaleMin} to ${props.question.scaleMax}`}
                            triggerOn='hover'
                        >
                            <span>
                                {feedback.questionScore}
                            </span>
                        </Tooltip>
                    )}
                </strong>
            </p>

            <MarkdownReview
                className={styles.mdReview}
                value={feedback.content}
            />

            <AiFeedbackActions
                feedback={feedback}
                actionType='runItem'
                onPressReply={commentsArr.length === 0 ? onShowReply : undefined}
            />

            {
                showReply && (
                    <AiFeedbackReply
                        onSubmitReply={onSubmitReply}
                        onCloseReply={function closeReply() {
                            setShowReply(false)
                        }}
                    />
                )
            }

            {commentsArr.length > 0 && (
                <AiFeedbackComments comments={commentsArr} feedback={feedback} isRoot />
            )}
        </ScorecardQuestionRow>
    )
}

export default AiFeedback
