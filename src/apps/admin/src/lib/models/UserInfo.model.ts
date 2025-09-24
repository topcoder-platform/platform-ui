import { EnvironmentConfig } from '~/config'

import {
    DICT_USER_STATUS,
    LABEL_EMAIL_STATUS_UNVERIFIED,
    LABEL_EMAIL_STATUS_VERIFIED,
} from '../../config/index.config'

/**
 * Model for user info
 */
export interface UserInfo {
    id: string
    handle: string
    firstName: string
    lastName: string
    email: string
    status: 'A' | 'U' | '4' | '5' | '6'
    statusDesc: string
    activationLink: string
    emailStatusDesc: string
    createdAt: Date
    modifiedAt: Date
    credential: {
        activationCode: string
    }
    active: boolean
    emailActive: boolean
}

/**
 * Update user info to show in ui
 * @param userInfo user info from backend response
 * @returns updated user info
 */
export function adjustUserInfoResponse(userInfo: UserInfo): UserInfo {
    return {
        ...userInfo,
        activationLink:
            userInfo.credential && userInfo.credential.activationCode
                // eslint-disable-next-line max-len
                ? `${EnvironmentConfig.API.URL}/pub/activation.html?code=${userInfo.credential.activationCode}&retUrl=https%3A%2F%2Fwww.topcoder.com%2Fskill-picker%2F`
                : '',
        createdAt: new Date(userInfo.createdAt),
        emailStatusDesc: !!userInfo.emailActive
            ? LABEL_EMAIL_STATUS_VERIFIED
            : LABEL_EMAIL_STATUS_UNVERIFIED,
        modifiedAt: new Date(userInfo.modifiedAt),
        statusDesc: DICT_USER_STATUS[userInfo.status],
    }
}
