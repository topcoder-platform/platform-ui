import { filter, some } from 'lodash'

import { EnvironmentConfig } from '~/config'

import { BackendResource } from '../models'

/**
 * Format number to ordinals.
 * @param placement placement
 * @returns ordinal string
 */
export function formatOrdinals(placement: number | string): string {
    let ord = ''
    switch (placement) {
        case 1:
            ord = '1st'
            break
        case 2:
            ord = '2nd'
            break
        case 3:
            ord = '3rd'
            break
        case '1':
            ord = '1st'
            break
        case '2':
            ord = '2nd'
            break
        case '3':
            ord = '3rd'
            break
        default:
            ord = `${placement}th`
    }

    return ord
}

/**
 * Filter the resources base on the required roles
 * @param requireRoles required roles
 * @param resources list of resources
 * @returns list of resources
 */
export function filterResources(
    requireRoles: string[],
    resources: BackendResource[],
): BackendResource[] {
    return filter(resources, item => some(
        requireRoles.map(role => role.toLowerCase()),
        role => (item.roleName ?? '').toLowerCase()
            .indexOf(role) >= 0,
    ))
}

/**
 * Get handle url from user info
 * @param userInfo user info
 * @returns handle url
 */
export function getHandleUrl(userInfo?: BackendResource): string {
    return `${EnvironmentConfig.REVIEW.PROFILE_PAGE_URL}/${userInfo?.memberHandle}`
}
