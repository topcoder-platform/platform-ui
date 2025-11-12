/**
 * Context provider for challenge detail page
 */
import { Context, createContext, FC, PropsWithChildren, useContext, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

import { ChallengeDetailContext } from '../../../lib'
import { ChallengeDetailContextModel, ReviewCtxStatus, ReviewsContextModel } from '../../../lib/models'
import { AiWorkflowRunsResponse, useFetchAiWorkflowsRuns } from '../../../lib/hooks'

export const ReviewsContext: Context<ReviewsContextModel>
    = createContext<ReviewsContextModel>({} as ReviewsContextModel)

export const ReviewsContextProvider: FC<PropsWithChildren> = props => {
    const { submissionId = '' }: {
        submissionId?: string,
    } = useParams<{
        submissionId: string,
    }>()
    const [searchParams] = useSearchParams()
    const workflowId = searchParams.get('workflowId') ?? ''
    const reviewId = searchParams.get('reviewId') ?? ''

    const [reviewStatus, setReviewStatus] = useState({} as ReviewCtxStatus);

    const challengeDetailsCtx = useContext(ChallengeDetailContext)
    const { challengeInfo }: ChallengeDetailContextModel = challengeDetailsCtx
    const aiReviewers = useMemo(() => (
        (challengeInfo?.reviewers ?? []).filter(r => !!r.aiWorkflowId)
    ), [challengeInfo?.reviewers])
    const aiWorkflowIds = useMemo(() => aiReviewers?.map(r => r.aiWorkflowId as string), [aiReviewers])

    const { runs: workflowRuns, isLoading: aiWorkflowRunsLoading }: AiWorkflowRunsResponse
        = useFetchAiWorkflowsRuns(submissionId, aiWorkflowIds)

    const isLoadingCtxData
        = challengeDetailsCtx.isLoadingChallengeInfo
        && challengeDetailsCtx.isLoadingChallengeResources
        && challengeDetailsCtx.isLoadingChallengeSubmissions
        && aiWorkflowRunsLoading

    const workflowRun = useMemo(
        () => workflowRuns.find(w => w.workflow.id === workflowId),
        [workflowRuns, workflowId],
    )
    const workflow = useMemo(() => workflowRun?.workflow, [workflowRuns, workflowId])
    const scorecard = useMemo(() => workflow?.scorecard, [workflow])

    const value = useMemo<ReviewsContextModel>(
        () => ({
            ...challengeDetailsCtx,
            isLoading: isLoadingCtxData,
            reviewId,
            reviewStatus,
            scorecard,
            setReviewStatus,
            submissionId,
            workflow,
            workflowId,
            workflowRun,
            workflowRuns,
        }),
        [
            challengeDetailsCtx,
            isLoadingCtxData,
            reviewId,,
            scorecard,
            submissionId,
            workflow,
            workflowId,
            workflowRun,
            workflowRuns,
            reviewStatus,
        ],
    )

    return (
        <ReviewsContext.Provider value={value}>
            {props.children}
        </ReviewsContext.Provider>
    )
}

export const useReviewsContext = (): ReviewsContextModel => useContext(ReviewsContext)
