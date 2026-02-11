import { CHALLENGE_STATUS } from '../constants'
import {
    Challenge,
    Resource,
    Review,
    Submission,
} from '../models'

import { getCurrentPhase } from './phase.utils'

export interface LoggedInUserResource {
    memberHandle?: string
    roles: string[]
}

function normalizeValue(value: unknown): string {
    return typeof value === 'string'
        ? value.trim()
        : ''
}

function normalizeIdentity(value: unknown): string {
    if (value === undefined || value === null) {
        return ''
    }

    return String(value)
        .trim()
        .toLowerCase()
}

function normalizeNumericIdentity(value: string): string {
    if (!/^[-]?\d+$/.test(value)) {
        return ''
    }

    const isNegative = value.startsWith('-')
    const unsigned = isNegative
        ? value.slice(1)
        : value
    const normalizedUnsigned = unsigned.replace(/^0+/, '') || '0'

    if (isNegative && normalizedUnsigned !== '0') {
        return `-${normalizedUnsigned}`
    }

    return normalizedUnsigned
}

function isMatchingIdentity(valueA: unknown, valueB: unknown): boolean {
    const normalizedA = normalizeIdentity(valueA)
    const normalizedB = normalizeIdentity(valueB)

    if (!normalizedA || !normalizedB) {
        return false
    }

    if (normalizedA === normalizedB) {
        return true
    }

    const normalizedNumericA = normalizeNumericIdentity(normalizedA)
    const normalizedNumericB = normalizeNumericIdentity(normalizedB)

    return !!normalizedNumericA
        && normalizedNumericA === normalizedNumericB
}

function isCopilotRole(role: string): boolean {
    return role.includes('copilot')
}

function isDraftOrNewChallenge(status: string): boolean {
    const normalizedStatus = normalizeValue(status)
        .toUpperCase()

    return normalizedStatus === CHALLENGE_STATUS.DRAFT
        || normalizedStatus === CHALLENGE_STATUS.NEW
}

function isOutsideSubmissionOrRegistration(challenge: Challenge): boolean {
    const currentPhase = getCurrentPhase(challenge)
        .toLowerCase()

    return !currentPhase.includes('submission')
        && !currentPhase.includes('registration')
}

function hasSubmittedReviews(resourceId: string, reviews: Review[]): boolean {
    return reviews.some(review => {
        if (normalizeValue(review.resourceId) !== resourceId) {
            return false
        }

        const normalizedStatus = normalizeValue(review.status)
            .toUpperCase()

        return review.committed === true || normalizedStatus === 'COMPLETED'
    })
}

function hasSubmittedWork(resource: Resource, submissions: Submission[]): boolean {
    return submissions.some(submission => isMatchingIdentity(resource.memberId, submission.createdBy)
        || isMatchingIdentity(resource.memberHandle, submission.createdBy))
}

function isProtectedChallengeCreator(
    challenge: Challenge,
    isDraftOrNew: boolean,
    memberHandle: string,
    role: string,
): boolean {
    const challengeCreatorHandle = normalizeValue(challenge.createdBy)
        .toLowerCase()

    if (!challengeCreatorHandle || memberHandle !== challengeCreatorHandle) {
        return false
    }

    if (isDraftOrNew) {
        return isCopilotRole(role)
    }

    return true
}

function isSelfCopilotDeletion(
    loggedInUserResource: LoggedInUserResource | undefined,
    memberHandle: string,
): boolean {
    if (!loggedInUserResource) {
        return false
    }

    const loggedInHandle = normalizeValue(loggedInUserResource.memberHandle)
        .toLowerCase()
    if (!loggedInHandle || loggedInHandle !== memberHandle) {
        return false
    }

    return loggedInUserResource.roles.some(role => normalizeValue(role)
        .toLowerCase()
        .includes('copilot'))
}

export function canDeleteResource(
    resource: Resource,
    challenge: Challenge,
    submissions: Submission[],
    reviews: Review[],
    loggedInUserResource?: LoggedInUserResource,
): boolean {
    const memberHandle = normalizeValue(resource.memberHandle)
        .toLowerCase()

    if (!resource.id || !memberHandle) {
        return false
    }

    if (hasSubmittedWork(resource, submissions)) {
        return false
    }

    const role = normalizeValue(resource.role || resource.roleName)
        .toLowerCase()
    const isDraftOrNew = isDraftOrNewChallenge(challenge.status)

    if (isProtectedChallengeCreator(challenge, isDraftOrNew, memberHandle, role)) {
        return false
    }

    if (isDraftOrNew && isSelfCopilotDeletion(loggedInUserResource, memberHandle)) {
        return false
    }

    if (isDraftOrNew || !isOutsideSubmissionOrRegistration(challenge)) {
        return true
    }

    if (isCopilotRole(role)) {
        return false
    }

    if (role.includes('reviewer') && hasSubmittedReviews(resource.id, reviews)) {
        return false
    }

    return true
}
