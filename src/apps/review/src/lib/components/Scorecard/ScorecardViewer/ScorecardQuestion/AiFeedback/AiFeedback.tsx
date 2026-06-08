import { ChangeEvent, FC, useCallback, useMemo, useState } from 'react'
import { mutate } from 'swr'

import { IconAiReview } from '~/apps/review/src/lib/assets/icons'
import { ReviewsContextModel, ScorecardQuestion } from '~/apps/review/src/lib/models'
import { createFeedbackComment, updateRunItemScore } from '~/apps/review/src/lib/services'
import { getAiWorkflowRunsCacheKey } from '~/apps/review/src/lib/hooks/useFetchAiWorkflowRuns'
import { getAiReviewDecisionsCacheKey } from '~/apps/review/src/lib/services/aiReview.service'
import { useReviewsContext } from '~/apps/review/src/pages/reviews/ReviewsContext'
import { EnvironmentConfig } from '~/config'
import { Tooltip, IconOutline, Button } from '~/libs/ui'
import { useRole } from '~/apps/review/src/lib/hooks'
import { handleError } from '~/libs/shared/lib/utils/handle-error'

import { getScoreResponseOptions } from '~/apps/review/src/lib/utils'
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
    const {
        workflowId,
        workflowRun,
        challengeInfo,
        submissionId,
        aiReviewConfig,
    }: ReviewsContextModel = useReviewsContext()
    const { isPrivilegedRole } = useRole()
    const [showReply, setShowReply] = useState(false)
    const [isUpdatingScore, setIsUpdatingScore] = useState(false)
    const [isEditingScore, setIsEditingScore] = useState(false)
    const [editedScore, setEditedScore] = useState<string>('')

    const isApprovalPhaseOpen = useMemo(
        () => (challengeInfo?.phases ?? []).some(
            (p) => (p.name || '').toLowerCase() === 'approval' && Boolean(p.isOpen),
        ),
        [challengeInfo?.phases],
    )

    const commentsArr: any[] = (feedback?.comments) || []

    const onShowReply = useCallback(() => {
        setShowReply(prevShowReply => !prevShowReply)
    }, [])

    const onSubmitReply = useCallback(async (content: string) => {
        await createFeedbackComment(workflowId as string, workflowRun?.id as string, feedback?.id, {
            content,
        })
        // eslint-disable-next-line max-len
        await mutate(`${EnvironmentConfig.API.V6}/workflows/${workflowId}/runs/${workflowRun?.id}/items?[${workflowRun?.status}]`)
        setShowReply(false)
    }, [workflowId, workflowRun?.id, workflowRun?.status, feedback?.id])

    const isYesNo = props.question.type === 'YES_NO'
    const hasQuestionScoreEditAccess = isPrivilegedRole
        && !!workflowId
        && !!workflowRun?.id
        && !!feedback?.id
        && isApprovalPhaseOpen

    const scoreOptions = useMemo(() => getScoreResponseOptions(props.question), [props.question])

    const handleStartEditing = useCallback(() => {
        setIsEditingScore(true)

        if (isYesNo) {
            setEditedScore(feedback?.questionScore ? 'Yes' : 'No')
        } else {
            setEditedScore(String(feedback?.questionScore ?? ''))
        }
    }, [feedback?.questionScore, isYesNo])

    const handleScoreChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
        setEditedScore(event.target.value)
    }, [])

    const handleCancelEditing = useCallback(() => {
        setIsEditingScore(false)
    }, [])

    const handleSaveScore = useCallback(async (content: string) => {
        if (!hasQuestionScoreEditAccess || isUpdatingScore) {
            return
        }

        if (!workflowId || !workflowRun?.id || !feedback?.id) {
            return
        }

        let questionScore = Number(editedScore)
        if (isYesNo) {
            if (editedScore === 'Yes') {
                questionScore = 1
            } else if (editedScore === 'No') {
                questionScore = 0
            }
        }

        if (!Number.isFinite(questionScore)) {
            return
        }

        setIsUpdatingScore(true)
        const itemsKey = `${EnvironmentConfig.API.V6}/workflows/${workflowId}/runs/${workflowRun.id}/items?[${workflowRun?.status}]`

        try {
            await updateRunItemScore(workflowId, workflowRun.id, feedback.id, {
                questionScore,
                comment: content.trim(),
            })

            await mutate(itemsKey)
            if (submissionId) {
                await mutate(getAiWorkflowRunsCacheKey(submissionId))
            }
            if (aiReviewConfig?.id) {
                await mutate(getAiReviewDecisionsCacheKey(aiReviewConfig.id))
            }
            setIsEditingScore(false)
        } catch (err) {
            handleError(err)
        } finally {
            setIsUpdatingScore(false)
        }
    }, [editedScore, feedback?.id, hasQuestionScoreEditAccess, isYesNo, isUpdatingScore, workflowId, workflowRun?.id, workflowRun?.status])

    if (!aiFeedbackItems?.length || !feedback) {
        return <></>
    }

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
            <div className={styles.feedbackEditRow}>
                <strong>
                    {isEditingScore ? (
                        <select
                            className={styles.scoreEditSelect}
                            value={editedScore}
                            onChange={handleScoreChange}
                            disabled={isUpdatingScore}
                        >
                            {scoreOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        isYesNo ? (feedback.questionScore ? 'Yes' : 'No') : (
                            <Tooltip
                                content={`On a scale of ${props.question.scaleMin} to ${props.question.scaleMax}`}
                                triggerOn='hover'
                            >
                                <span>
                                    {feedback.questionScore}
                                </span>
                            </Tooltip>
                        )
                    )}
                </strong>

                {hasQuestionScoreEditAccess && !isEditingScore && (
                    <div className={styles.editActions}>
                        <Button
                            secondary
                            size='sm'
                            onClick={handleStartEditing}
                            label='Edit'
                            icon={IconOutline.PencilIcon}
                        />
                    </div>
                )}
            </div>

            {isEditingScore && (
                <AiFeedbackReply
                    submitLabel='Save'
                    onSubmitReply={async (content: string) => {
                        await handleSaveScore(content)
                    }}
                    onCloseReply={handleCancelEditing}
                />
            )}

            <MarkdownReview
                className={styles.mdReview}
                value={feedback.content}
            />

            <AiFeedbackActions
                feedback={feedback}
                actionType='runItem'
                onPressReply={onShowReply}
            />

            {commentsArr.length > 0 && (
                <AiFeedbackComments comments={commentsArr} feedback={feedback} isRoot />
            )}

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
        </ScorecardQuestionRow>
    )
}

export default AiFeedback
