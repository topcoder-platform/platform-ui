/**
 * Context provider for challenge detail page
 */
import { Context, createContext, FC, PropsWithChildren, useContext, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { ChallengeDetailContext } from '../../../lib'
import { AiScorecardContextModel, ChallengeDetailContextModel } from '../../../lib/models'

import { AiWorkflowRunsResponse, useFetchAiWorkflowsRuns } from '../../../lib/hooks'

export const AiScorecardContext: Context<AiScorecardContextModel>
    = createContext<AiScorecardContextModel>({} as AiScorecardContextModel)

export const AiScorecardContextProvider: FC<PropsWithChildren> = props => {
    const { workflowId = '', submissionId = '' }: {
        submissionId?: string,
        workflowId?: string,
    } = useParams<{
        submissionId: string,
        workflowId: string,
    }>()

    const challengeDetailsCtx = useContext(ChallengeDetailContext)
    const { challengeInfo }: ChallengeDetailContextModel = challengeDetailsCtx;
    const aiReviewers = useMemo(() => (challengeInfo?.reviewers ?? []).filter(r => !!r.aiWorkflowId), [challengeInfo?.reviewers])
    const aiWorkflowIds = useMemo(() => aiReviewers?.map(r => r.aiWorkflowId as string), [aiReviewers])

    const { runs: workflowRuns, isLoading: aiWorkflowRunsLoading }: AiWorkflowRunsResponse = useFetchAiWorkflowsRuns(submissionId, aiWorkflowIds)

    const isLoadingCtxData =
        challengeDetailsCtx.isLoadingChallengeInfo &&
        challengeDetailsCtx.isLoadingChallengeResources &&
        challengeDetailsCtx.isLoadingChallengeSubmissions &&
        aiWorkflowRunsLoading

    const workflow = useMemo(() => (
        workflowRuns.map(r => r.workflow).find(w => w.id === workflowId)
    ), [workflowRuns, workflowId])

    const scorecard = useMemo(() => workflow?.scorecard, [workflow])

    const value = useMemo<AiScorecardContextModel>(
        () => ({
            ...challengeDetailsCtx,
            submissionId,
            workflowId,
            workflowRuns,
            workflow,
            scorecard,
            isLoading: isLoadingCtxData,
        }),
        [
            challengeDetailsCtx,
            submissionId,
            workflowId,
            workflowRuns,
            isLoadingCtxData,
            workflow,
            scorecard,
        ],
    )

    return (
        <AiScorecardContext.Provider value={value}>
            {props.children}
        </AiScorecardContext.Provider>
    )
}

export const useAiScorecardContext = () => useContext(AiScorecardContext)
