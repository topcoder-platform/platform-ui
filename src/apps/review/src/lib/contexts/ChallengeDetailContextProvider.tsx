/**
 * Context provider for challenge detail page
 */
import { FC, PropsWithChildren, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { convertBackendSubmissionToSubmissionInfo } from '../models'
import type { ChallengeDetailContextModel, SubmissionInfo } from '../models'
import {
    useFetchChallengeInfo,
    useFetchChallengeInfoProps,
    useFetchChallengeResources,
    useFetchChallengeResourcesProps,
    useFetchChallengeSubmissions,
    useFetchChallengeSubmissionsProps,
} from '../hooks'

import { ChallengeDetailContext } from './ChallengeDetailContext'

export const ChallengeDetailContextProvider: FC<PropsWithChildren> = props => {
    const { challengeId = '' }: { challengeId?: string } = useParams<{
        challengeId: string
    }>()
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
    const {
        challengeSubmissions,
        isLoading: isLoadingChallengeSubmissions,
    }: useFetchChallengeSubmissionsProps = useFetchChallengeSubmissions(challengeId)

    const submissionInfos = useMemo<SubmissionInfo[]>(
        () => challengeSubmissions.map(convertBackendSubmissionToSubmissionInfo),
        [challengeSubmissions],
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
        () => isLoadingChallengeInfo || isLoadingChallengeSubmissions,
        [isLoadingChallengeInfo, isLoadingChallengeSubmissions],
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
