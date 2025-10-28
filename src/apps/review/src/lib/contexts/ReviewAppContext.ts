/**
 * Review app context definition.
 */
import { Context, createContext } from 'react'
import { noop } from 'lodash'

import { ReviewAppContextModel } from '../models'

export const ReviewAppContext: Context<ReviewAppContextModel>
    = createContext<ReviewAppContextModel>({
        cancelLoadChallengeRelativeInfos: noop,
        challengeRelativeInfosMapping: {},
        loadChallengeRelativeInfos: noop,
        loginUserInfo: undefined,
        resourceRoleMapping: undefined,
        resourceRoleReviewer: undefined,
        resourceRoleSubmitter: undefined,
    })
