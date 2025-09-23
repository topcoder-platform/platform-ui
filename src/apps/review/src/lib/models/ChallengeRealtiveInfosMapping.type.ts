import { BackendResource } from './BackendResource.model'
/**
 * Challenge relative info mapping
 */
export interface ChallengeRealtiveInfo {
    myRoles: BackendResource[]
    reviewProgress?: number | null

}

/**
 * My role infos mapping type
 */
export type ChallengeRealtiveInfosMapping = {
    [challengeId: string]: ChallengeRealtiveInfo
}
