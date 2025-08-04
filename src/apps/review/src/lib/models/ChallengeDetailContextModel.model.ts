import { BackendResource } from './BackendResource.model'
import { ChallengeInfo } from './ChallengeInfo.model'
import { RegistrationInfo } from './RegistrationInfo.model'

/**
 * Model for challenge detail context
 */
export interface ChallengeDetailContextModel {
    challengeId?: string
    isLoadingChallengeInfo: boolean
    isLoadingChallengeResources: boolean
    challengeInfo?: ChallengeInfo
    myResources: BackendResource[]
    myRoles: string[]
    registrants: RegistrationInfo[]
}
