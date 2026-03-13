/**
 * Context provider for challenge detail page
 */
import { FC, PropsWithChildren, useContext, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { convertBackendSubmissionToSubmissionInfo } from '../models'
import type {
    ChallengeDetailContextModel,
    ReviewAppContextModel,
    SubmissionInfo,
} from '../models'
import {
    useFetchAiReviewConfig,
    UseFetchAiReviewConfigResult,
    useFetchAiReviewDecisions,
    UseFetchAiReviewDecisionsResult,
    useFetchChallengeInfo,
    useFetchChallengeInfoProps,
    useFetchChallengeResources,
    useFetchChallengeResourcesProps,
    useFetchChallengeSubmissions,
    useFetchChallengeSubmissionsProps,
} from '../hooks'
import type { ChallengeVisibilityFlags } from '../hooks/useFetchChallengeSubmissions'

import { ChallengeDetailContext } from './ChallengeDetailContext'
import { ReviewAppContext } from './ReviewAppContext'

export const ChallengeDetailContextProvider: FC<PropsWithChildren> = props => {
    const { challengeId = '' }: { challengeId?: string } = useParams<{
        challengeId: string
    }>()
    const { loginUserInfo }: ReviewAppContextModel = useContext(ReviewAppContext)
    // fetch challenge info
    const {
        challengeInfo,
        isLoading: isLoadingChallengeInfo,
    }: useFetchChallengeInfoProps = useFetchChallengeInfo(challengeId)

    // fetch challenge resources
    const {
        resources,
        registrants,
        reviewers,
        myResources,
        myRoles,
        isLoading: isLoadingChallengeResources,
        resourceMemberIdMapping,
    }: useFetchChallengeResourcesProps = useFetchChallengeResources(challengeId)
    const submissionViewer = useMemo(
        () => ({
            roles: myRoles,
            tokenRoles: loginUserInfo?.roles,
            userId: loginUserInfo?.userId,
        }),
        [loginUserInfo?.roles, loginUserInfo?.userId, myRoles],
    )
    const challengeVisibility = useMemo<ChallengeVisibilityFlags | undefined>(
        () => {
            if (!challengeInfo) {
                return undefined
            }

            const trackName = (challengeInfo.track?.name ?? '')
                .toString()
                .toLowerCase()
            const status = (challengeInfo.status ?? '')
                .toString()
                .toLowerCase()
            const isDesign = trackName === 'design'
            const isCompleted = status === 'completed'
            const submissionsViewable = Boolean(
                challengeInfo.metadata?.some(
                    m => m.name === 'submissionsViewable'
                        && String(m.value)
                            .toLowerCase() === 'true',
                ),
            )

            return { isCompleted, isDesign, submissionsViewable }
        },
        [
            challengeInfo?.track?.name,
            challengeInfo?.status,
            challengeInfo?.metadata,
        ],
    )
    const {
        challengeSubmissions,
        isLoading: isLoadingChallengeSubmissions,
    }: useFetchChallengeSubmissionsProps = useFetchChallengeSubmissions(
        challengeId,
        submissionViewer,
        challengeVisibility,
    )

    const submissionInfos = useMemo<SubmissionInfo[]>(
        () => challengeSubmissions.map(s => convertBackendSubmissionToSubmissionInfo(s, registrants)),
        [challengeSubmissions, registrants],
    )

    const {
        aiReviewConfig,
        isLoading: isLoadingAiReviewConfig,
    }: UseFetchAiReviewConfigResult = useFetchAiReviewConfig(challengeId)

    const {
        decisions: aiReviewDecisions,
        isLoading: isLoadingAiReviewDecisions,
    }: UseFetchAiReviewDecisionsResult = useFetchAiReviewDecisions(aiReviewConfig?.id)

    const aiReviewDecisionsBySubmissionId = useMemo(
        () => aiReviewDecisions.reduce<Record<string, typeof aiReviewDecisions[number]>>((result, decision) => {
            if (decision.submissionId) {
                result[decision.submissionId] = decision
            }

            return result
        }, {}),
        [aiReviewDecisions],
    )

    const enrichedChallengeInfo = useMemo(
        () => (challengeInfo
            ? {
                ...challengeInfo,
                submissions: submissionInfos,
            }
            : challengeInfo),
        [challengeInfo, submissionInfos],
    )

    const isLoadingChallengeInfoCombined = useMemo(
        () => isLoadingChallengeInfo,
        [isLoadingChallengeInfo],
    )

    const value = useMemo<ChallengeDetailContextModel>(
        () => ({
            aiReviewConfig,
            aiReviewDecisionsBySubmissionId,
            challengeId,
            challengeInfo: enrichedChallengeInfo,
            challengeSubmissions,
            isLoadingAiReviewConfig,
            isLoadingAiReviewDecisions,
            isLoadingChallengeInfo: isLoadingChallengeInfoCombined,
            isLoadingChallengeResources,
            isLoadingChallengeSubmissions,
            myResources,
            myRoles,
            registrants,
            resourceMemberIdMapping,
            resources,
            reviewers,
        }),
        [
            challengeId,
            enrichedChallengeInfo,
            challengeSubmissions,
            isLoadingChallengeInfoCombined,
            isLoadingChallengeResources,
            isLoadingChallengeSubmissions,
            aiReviewConfig,
            aiReviewDecisionsBySubmissionId,
            isLoadingAiReviewConfig,
            isLoadingAiReviewDecisions,
            myResources,
            myRoles,
            registrants,
            resourceMemberIdMapping,
            resources,
            reviewers,
        ],
    )

    return (
        <ChallengeDetailContext.Provider value={value}>
            {props.children}
        </ChallengeDetailContext.Provider>
    )
}

export const useChallengeDetailsContext = (): ChallengeDetailContextModel => useContext(ChallengeDetailContext)
