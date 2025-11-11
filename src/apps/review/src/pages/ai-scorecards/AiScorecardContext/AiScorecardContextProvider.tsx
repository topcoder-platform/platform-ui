/**
 * Context provider for challenge detail page
 */
import { Context, createContext, FC, PropsWithChildren, useContext, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

import { ChallengeDetailContext } from '../../../lib'
import { AiScorecardContextModel, ChallengeDetailContextModel } from '../../../lib/models'
import { AiWorkflowRunsResponse, useFetchAiWorkflowsRuns } from '../../../lib/hooks'

export const AiScorecardContext: Context<AiScorecardContextModel>
    = createContext<AiScorecardContextModel>({} as AiScorecardContextModel)

export const AiScorecardContextProvider: FC<PropsWithChildren> = props => {
    const { submissionId: submissionIdParam = '' }: {
        submissionId?: string,
    } = useParams<{
        submissionId: string,
    }>()
    const [params] = useSearchParams()
    const workflowId = params.get('workflowId') ?? ''
    const reviewId = params.get('reviewId') ?? ''

    const [submissionId, setSubmissionId] = useState(submissionIdParam);

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

    const value = useMemo<AiScorecardContextModel>(
        () => ({
            ...challengeDetailsCtx,
            isLoading: isLoadingCtxData,
            scorecard,
            submissionId,
            workflow,
            workflowId,
            workflowRun,
            workflowRuns,
            setSubmissionId,
        }),
        [
            challengeDetailsCtx,
            isLoadingCtxData,
            scorecard,
            submissionId,
            workflow,
            workflowId,
            workflowRun,
            workflowRuns,
        ],
    )

    return (
        <AiScorecardContext.Provider value={value}>
            {props.children}
        </AiScorecardContext.Provider>
    )
}

export const useAiScorecardContext = (): AiScorecardContextModel => useContext(AiScorecardContext)
