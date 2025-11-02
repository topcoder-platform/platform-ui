/**
 * Challenge detail context definition.
 */
import { Context, createContext } from 'react'

import { ChallengeDetailContextModel } from '../models'

export const ChallengeDetailContext: Context<ChallengeDetailContextModel>
    = createContext<ChallengeDetailContextModel>({
        challengeId: undefined,
        challengeInfo: undefined,
        challengeSubmissions: [],
        isLoadingChallengeInfo: false,
        isLoadingChallengeResources: false,
        isLoadingChallengeSubmissions: false,
        myResources: [],
        myRoles: [],
        registrants: [],
        resourceMemberIdMapping: {},
        resources: [],
        reviewers: [],
    })
