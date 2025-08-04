/**
 * Review app context model
 */
import { TokenModel } from '~/libs/core'

import { BackendResourceRole } from './BackendResourceRole.model'
import { MyRoleInfosMappingType } from './MyRoleInfosMappingType.type'

export interface ReviewAppContextModel {
    myRoleInfosMapping: MyRoleInfosMappingType // from challenge id to list of my role
    loadMyRoleInfos: (challengeId: string) => void
    cancelLoadMyRoleInfos: () => void
    loginUserInfo: TokenModel | undefined
    resourceRoleMapping?: {
        [key: string]: BackendResourceRole
    }
    resourceRoleSubmitter?: BackendResourceRole
}
