import { EnvironmentConfig } from '~/config'
import { xhrPostAsync } from '~/libs/core'

import type {
    BackendSubmission,
    ChallengeInfo,
    SubmissionInfo,
} from '../models'

export const TOPGEAR_SUBMISSION_REPROCESS_TOPIC = 'topgear.submission.received'

const REPROCESS_ORIGINATOR = 'review-api-v6'

export interface TopgearSubmissionReprocessPayload {
    submissionId: string
    challengeId: string
    submissionUrl: string
    memberHandle: string
    memberId: string
    submittedDate: string
}

interface TopgearSubmissionReprocessEvent {
    topic: string
    originator: string
    timestamp: string
    'mime-type': string
    payload: TopgearSubmissionReprocessPayload
}

interface TopgearSubmissionReprocessInput {
    submission: Pick<
        BackendSubmission,
        | 'id'
        | 'challengeId'
        | 'createdAt'
        | 'createdBy'
        | 'memberId'
        | 'submittedDate'
        | 'url'
    >
    submissionInfo?: Pick<
        SubmissionInfo,
        | 'submittedDate'
        | 'submitterHandle'
        | 'userInfo'
    >
}

type ChallengeInfoWithRuntimeType = Pick<ChallengeInfo, 'type'> & {
    type?: ChallengeInfo['type'] | string
}

function normalizeName(value?: string): string {
    return value?.replace(/\s+/g, '')
        .trim()
        .toLowerCase() ?? ''
}

function requireNonEmptyString(value: unknown, errorMessage: string): string {
    const normalized = value === undefined || value === null
        ? ''
        : String(value)
            .trim()

    if (!normalized) {
        throw new Error(errorMessage)
    }

    return normalized
}

function toIsoDate(value: unknown): string | undefined {
    if (!value) {
        return undefined
    }

    const date = value instanceof Date ? value : new Date(String(value))
    return Number.isNaN(date.valueOf()) ? undefined : date.toISOString()
}

function resolveSubmittedDate(input: TopgearSubmissionReprocessInput): string {
    const submittedDate = toIsoDate(
        input.submissionInfo?.submittedDate
        ?? input.submission.submittedDate
        ?? input.submission.createdAt,
    )

    if (!submittedDate) {
        throw new Error('Submitted date is not valid')
    }

    return submittedDate
}

function resolveMemberHandle(input: TopgearSubmissionReprocessInput): string {
    return requireNonEmptyString(
        input.submissionInfo?.userInfo?.memberHandle
        ?? input.submissionInfo?.submitterHandle
        ?? input.submission.createdBy,
        'Member handle is not valid',
    )
}

/**
 * Determines whether a challenge is a Topgear Task challenge.
 *
 * @param challengeInfo - Challenge details returned by the review app data loaders.
 * @returns True when the challenge type name normalizes to `topgeartask`.
 */
export function isTopgearTaskChallenge(
    challengeInfo?: ChallengeInfoWithRuntimeType,
): boolean {
    const type = challengeInfo?.type
    const typeName = typeof type === 'string' ? type : type?.name

    return normalizeName(typeName) === 'topgeartask'
}

/**
 * Determines whether the current viewer may reprocess Topgear submissions.
 *
 * @param challengeInfo - Challenge details used to identify Topgear Task challenges.
 * @param isAdmin - Whether the current viewer has admin privileges.
 * @returns True when the button should be available to the viewer.
 */
export function canReprocessTopgearSubmission(
    challengeInfo: ChallengeInfoWithRuntimeType | undefined,
    isAdmin: boolean,
): boolean {
    return isAdmin && isTopgearTaskChallenge(challengeInfo)
}

/**
 * Builds the bus API payload used to reprocess a Topgear Task submission.
 *
 * @param input - Backend submission data plus optional normalized review submission info.
 * @returns Payload for the `topgear.submission.received` Kafka topic.
 * @throws Error when any required submission, member, URL, or date field is missing.
 */
export function createTopgearSubmissionReprocessPayload(
    input: TopgearSubmissionReprocessInput,
): TopgearSubmissionReprocessPayload {
    return {
        challengeId: requireNonEmptyString(
            input.submission.challengeId,
            'Challenge id is not valid',
        ),
        memberHandle: resolveMemberHandle(input),
        memberId: requireNonEmptyString(
            input.submission.memberId,
            'Member id is not valid',
        ),
        submissionId: requireNonEmptyString(
            input.submission.id,
            'Submission id is not valid',
        ),
        submissionUrl: requireNonEmptyString(
            input.submission.url,
            'Submission url is not valid',
        ),
        submittedDate: resolveSubmittedDate(input),
    }
}

function createTopgearSubmissionReprocessEvent(
    payload: TopgearSubmissionReprocessPayload,
): TopgearSubmissionReprocessEvent {
    return {
        'mime-type': 'application/json',
        originator: REPROCESS_ORIGINATOR,
        payload,
        timestamp: new Date()
            .toISOString(),
        topic: TOPGEAR_SUBMISSION_REPROCESS_TOPIC,
    }
}

/**
 * Sends a Topgear Task submission reprocess message through the bus API.
 *
 * @param input - Submission data used to build the bus API message payload.
 * @returns Resolves when the bus API accepts the event.
 * @throws Error when payload construction fails or the bus API request rejects.
 */
export async function reprocessTopgearSubmission(
    input: TopgearSubmissionReprocessInput,
): Promise<string> {
    const payload = createTopgearSubmissionReprocessPayload(input)

    return xhrPostAsync<TopgearSubmissionReprocessEvent, string>(
        `${EnvironmentConfig.API.V5}/bus/events`,
        createTopgearSubmissionReprocessEvent(payload),
    )
}
