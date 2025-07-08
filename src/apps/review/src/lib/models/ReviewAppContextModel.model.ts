import { TokenModel } from '~/libs/core'

import { BackendResourceRole } from './BackendResourceRole.model'
import { MyRoleIdsMappingType } from './MyRoleIdsMappingType.type'

export interface ReviewAppContextModel {
    myRoleIdsMapping: MyRoleIdsMappingType // from challenge id to list of my role
    loadMyRoleIds: (challengeId: string) => void
    cancelLoadMyRoleIds: () => void
    loginUserInfo: TokenModel | undefined
    resourceRoleMapping?: {
        [key: string]: BackendResourceRole
    }
}
