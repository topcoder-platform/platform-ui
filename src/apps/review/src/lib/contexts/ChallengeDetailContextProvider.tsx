/**
 * Context provider for challenge detail page
 */
import { Context, createContext, FC, PropsWithChildren, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { ChallengeDetailContextModel } from '../models'
import {
    useFetchChallengeInfo,
    useFetchChallengeInfoProps,
    useFetchChallengeResources,
    useFetchChallengeResourcesProps,
} from '../hooks'

export const ChallengeDetailContext: Context<ChallengeDetailContextModel>
    = createContext<ChallengeDetailContextModel>({
        challengeId: undefined,
        challengeInfo: undefined,
        isLoadingChallengeInfo: false,
        isLoadingChallengeResources: false,
        myResources: [],
        myRoles: [],
        registrants: [],
        resourceMemberIdMapping: {},
        reviewers: [],
    })

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
        registrants,
        reviewers,
        myResources,
        myRoles,
        isLoading: isLoadingChallengeResources,
        resourceMemberIdMapping,
    }: useFetchChallengeResourcesProps = useFetchChallengeResources(challengeId)

    const value = useMemo(
        () => ({
            challengeId,
            challengeInfo,
            isLoadingChallengeInfo,
            isLoadingChallengeResources,
            myResources,
            myRoles,
            registrants,
            resourceMemberIdMapping,
            reviewers,
        }),
        [
            challengeId,
            challengeInfo,
            isLoadingChallengeInfo,
            myResources,
            myRoles,
            registrants,
            reviewers,
            isLoadingChallengeResources,
            resourceMemberIdMapping,
        ],
    )

    return (
        <ChallengeDetailContext.Provider value={value}>
            {props.children}
        </ChallengeDetailContext.Provider>
    )
}
