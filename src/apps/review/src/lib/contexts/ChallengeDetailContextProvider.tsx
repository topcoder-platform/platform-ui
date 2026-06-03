/**
 * Context provider for challenge detail page
 */
import { FC, PropsWithChildren, useCallback, useContext, useMemo } from 'react'
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
        error: challengeInfoError,
        isLoading: isLoadingChallengeInfo,
        retry: retryChallengeInfo,
    }: useFetchChallengeInfoProps = useFetchChallengeInfo(challengeId)

    // fetch challenge resources
    const {
        resources,
        registrants,
        reviewers,
        myResources,
        myRoles,
        error: challengeResourcesError,
        isLoading: isLoadingChallengeResources,
        retry: retryChallengeResources,
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
        [challengeInfo],
    )
    const {
        challengeSubmissions,
        error: challengeSubmissionsError,
        isLoading: isLoadingChallengeSubmissions,
        retry: retryChallengeSubmissions,
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
    const challengeScopedFetchError = useMemo(
        () => challengeInfoError ?? challengeResourcesError ?? challengeSubmissionsError,
        [challengeInfoError, challengeResourcesError, challengeSubmissionsError],
    )
    const retryChallengeScopedFetches = useCallback((): void => {
        Promise.resolve(retryChallengeInfo())
            .catch(() => undefined)
        Promise.resolve(retryChallengeResources())
            .catch(() => undefined)
        Promise.resolve(retryChallengeSubmissions())
            .catch(() => undefined)
    }, [
        retryChallengeInfo,
        retryChallengeResources,
        retryChallengeSubmissions,
    ])

    const value = useMemo<ChallengeDetailContextModel>(
        () => ({
            aiReviewConfig,
            aiReviewDecisionsBySubmissionId,
            challengeId,
            challengeInfo: enrichedChallengeInfo,
            challengeInfoError,
            challengeResourcesError,
            challengeScopedFetchError,
            challengeSubmissions,
            challengeSubmissionsError,
            hasChallengeScopedFetchError: !!challengeScopedFetchError,
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
            retryChallengeScopedFetches,
            reviewers,
        }),
        [
            challengeId,
            enrichedChallengeInfo,
            challengeInfoError,
            challengeResourcesError,
            challengeScopedFetchError,
            challengeSubmissions,
            challengeSubmissionsError,
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
            retryChallengeScopedFetches,
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
