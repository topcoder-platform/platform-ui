import {
    COMMUNITY_APP_URL,
    DIRECT_PROJECT_URL,
    REVIEW_APP_URL,
} from '../constants'
import type { Project } from '../models'
import {
    challengeEditRouteId,
    projectEditRouteId,
    rootRoute,
    taasEditRouteId,
} from '../../config/routes.config'

import { checkIsUserInvitedToProject } from './permissions.utils'

interface QueryValueMap {
    [key: string]: boolean | null | number | string | string[] | undefined
}

function withLeadingSlash(path: string): string {
    return path.startsWith('/')
        ? path
        : `/${path}`
}

export function buildQueryParams(params: QueryValueMap = {}): string {
    const query = new URLSearchParams()

    Object.entries(params)
        .forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') {
                return
            }

            if (Array.isArray(value)) {
                value
                    .filter(Boolean)
                    .forEach(item => query.append(key, item))
                return
            }

            query.set(key, String(value))
        })

    return query.toString()
}

export function withQueryParams(
    url: string,
    params: QueryValueMap = {},
): string {
    const query = buildQueryParams(params)

    return query
        ? `${url}${url.includes('?') ? '&' : '?'}${query}`
        : url
}

export function buildChallengeUrl(challengeId: string): string {
    return withLeadingSlash(
        `${rootRoute}/${challengeEditRouteId}/${encodeURIComponent(challengeId)}`,
    )
}

export function buildProjectUrl(projectId: string): string {
    return withLeadingSlash(
        `${rootRoute}/${projectEditRouteId}/${encodeURIComponent(projectId)}`,
    )
}

export function buildTaasProjectUrl(projectId: string): string {
    return withLeadingSlash(
        `${rootRoute}/${taasEditRouteId}/${encodeURIComponent(projectId)}`,
    )
}

export function buildReviewAppChallengeUrl(challengeId: string): string {
    return `${REVIEW_APP_URL}/challenges/${encodeURIComponent(challengeId)}`
}

export function buildCommunityMemberUrl(handle: string): string {
    return `${COMMUNITY_APP_URL}/members/${encodeURIComponent(handle)}`
}

export function buildDirectProjectUrl(projectId: string | number): string {
    return `${DIRECT_PROJECT_URL}/projects/${encodeURIComponent(String(projectId))}`
}

/**
 * Resolves the default in-app landing route for a project.
 *
 * Invited users must land on the invitation route so they can accept or decline
 * the project before the app opens a project workspace tab.
 *
 * @param project The project summary or detail being opened.
 * @param accessToken The current user's access token used to match invite ownership.
 * @returns The relative route for the project landing page.
 */
export function buildProjectLandingPath(project: Project, accessToken: string = ''): string {
    const projectId = encodeURIComponent(String(project.id))

    return checkIsUserInvitedToProject(accessToken, project)
        ? `/projects/${projectId}/invitations`
        : `/projects/${projectId}/challenges`
}
