/**
 * Review app context model
 */
import { TokenModel } from '~/libs/core'

import { BackendResourceRole } from './BackendResourceRole.model'
import { ChallengeRealtiveInfosMapping } from './ChallengeRealtiveInfosMapping.type'

export interface ReviewAppContextModel {
    challengeRelativeInfosMapping: ChallengeRealtiveInfosMapping // from challenge id to challenge relative infos
    loadChallengeRelativeInfos: (challengeId: string) => void
    cancelLoadChallengeRelativeInfos: () => void
    loginUserInfo: TokenModel | undefined
    resourceRoleMapping?: {
        [key: string]: BackendResourceRole
    }
    resourceRoleReviewer?: BackendResourceRole
    resourceRoleSubmitter?: BackendResourceRole
}
