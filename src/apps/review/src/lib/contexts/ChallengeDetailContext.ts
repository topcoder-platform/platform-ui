/**
 * Challenge detail context definition.
 */
import { Context, createContext } from 'react'

import { ChallengeDetailContextModel } from '../models'

export const ChallengeDetailContext: Context<ChallengeDetailContextModel>
    = createContext<ChallengeDetailContextModel>({
        aiReviewDecisionsBySubmissionId: {},
        challengeId: undefined,
        challengeInfo: undefined,
        challengeSubmissions: [],
        isLoadingAiReviewConfig: false,
        isLoadingAiReviewDecisions: false,
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
