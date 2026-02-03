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
    useFetchChallengeInfo,
    useFetchChallengeInfoProps,
    useFetchChallengeResources,
    useFetchChallengeResourcesProps,
    useFetchChallengeSubmissions,
    useFetchChallengeSubmissionsProps,
} from '../hooks'

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
    const {
        challengeSubmissions,
        isLoading: isLoadingChallengeSubmissions,
    }: useFetchChallengeSubmissionsProps = useFetchChallengeSubmissions(
        challengeId,
        submissionViewer,
    )

    const submissionInfos = useMemo<SubmissionInfo[]>(
        () => challengeSubmissions.map(s => convertBackendSubmissionToSubmissionInfo(s, registrants)),
        [challengeSubmissions, registrants],
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
            challengeId,
            challengeInfo: enrichedChallengeInfo,
            challengeSubmissions,
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
