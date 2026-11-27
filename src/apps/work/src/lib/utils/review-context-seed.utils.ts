/**
 * Builds the deterministic part of the unified challenge review context used
 * to seed a manually managed review context.
 *
 * Mirrors `parseChallengeContext` in tc-ai-api
 * (src/mastra/workflows/challenge/challenge-context-workflow.ts) and the
 * read-time backfill in review-api-v6
 * (src/api/challenge-review-context/challenge-review-context.builder.ts).
 * Keep the three mappings aligned.
 */

type UnknownRecord = Record<string, unknown>

const DAY_MS = 86_400_000

function asRecord(value: unknown): UnknownRecord | undefined {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value as UnknownRecord
        : undefined
}

function asRecordArray(value: unknown): UnknownRecord[] {
    return Array.isArray(value)
        ? value
            .map(asRecord)
            .filter((item): item is UnknownRecord => !!item)
        : []
}

function asString(value: unknown): string {
    return typeof value === 'string' ? value : ''
}

function asNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function asOptionalString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined
}

/**
 * Returns the scorecard id of the member (human) reviewer, if any.
 *
 * @param challenge raw Challenge API payload
 * @returns member-review scorecard id, or undefined
 */
export function findMemberReviewScorecardId(challenge: UnknownRecord): string | undefined {
    const reviewer = asRecordArray(challenge.reviewers)
        .find(item => item.isMemberReview === true)
    const scorecardId = asString(reviewer?.scorecardId)
        .trim()

    return scorecardId || undefined
}

/**
 * Projects a raw `GET /scorecards/:id` payload to the scorecard shape embedded
 * in `review_criteria.scorecard`.
 *
 * @param scorecard raw scorecard payload
 * @returns projected scorecard, or undefined when the payload is not an object
 */
export function projectReviewContextScorecard(scorecard: unknown): UnknownRecord | undefined {
    const source = asRecord(scorecard)
    if (!source) {
        return undefined
    }

    return {
        challengeTrack: asString(source.challengeTrack),
        challengeType: asString(source.challengeType),
        id: asString(source.id),
        maxScore: asNumber(source.maxScore),
        minimumPassingScore: asNumber(source.minimumPassingScore),
        minScore: asNumber(source.minScore),
        name: asString(source.name),
        scorecardGroups: asRecordArray(source.scorecardGroups)
            .map(group => ({
                id: asString(group.id),
                name: asString(group.name),
                sections: asRecordArray(group.sections)
                    .map(section => ({
                        id: asString(section.id),
                        name: asString(section.name),
                        questions: asRecordArray(section.questions)
                            .map(question => ({
                                description: asString(question.description),
                                guidelines: asString(question.guidelines),
                                id: asString(question.id),
                                requiresUpload: question.requiresUpload === true,
                                scaleMax: typeof question.scaleMax === 'number' ? question.scaleMax : undefined,
                                scaleMin: typeof question.scaleMin === 'number' ? question.scaleMin : undefined,
                                sortOrder: asNumber(question.sortOrder),
                                type: asString(question.type),
                                weight: asNumber(question.weight),
                            })),
                        sortOrder: asNumber(section.sortOrder),
                        weight: asNumber(section.weight),
                    })),
                sortOrder: asNumber(group.sortOrder),
                weight: asNumber(group.weight),
            })),
        status: asString(source.status),
        type: asString(source.type),
        version: asString(source.version),
    }
}

/**
 * Builds a review context seed from challenge data. Requirements start empty
 * for the copilot to fill in; `requirement_groups` and `tech_stack` start
 * empty; `runtime_environment`, `existing_codebase` and
 * `submission_guidelines` need AI extraction and are omitted.
 *
 * @param challenge raw Challenge API payload (not `normalizeChallengeData`
 * output, which rewrites `track`)
 * @param scorecard projected member-review scorecard, if any
 * @returns review context seed
 */
export function buildReviewContextSeed(
    challenge: UnknownRecord,
    scorecard?: UnknownRecord,
): UnknownRecord {
    const startDate = asString(challenge.startDate) || asString(challenge.registrationStartDate)
    const endDate = asString(challenge.endDate)
    const startMs = startDate ? new Date(startDate)
        .getTime() : NaN
    const endMs = endDate ? new Date(endDate)
        .getTime() : NaN
    const totalDurationDays = Number.isFinite(startMs) && Number.isFinite(endMs)
        ? Math.round((endMs - startMs) / DAY_MS)
        : 0

    const placementPrizeSet = asRecordArray(challenge.prizeSets)
        .find(prizeSet => prizeSet.type === 'PLACEMENT')
    const prizes = asRecordArray(placementPrizeSet?.prizes)
        .map((prize, index) => ({
            currency: asString(prize.type),
            placement: index + 1,
            value: asNumber(prize.value),
        }))

    const skills = asRecordArray(challenge.skills)
        .map(skill => ({
            id: asString(skill.id),
            name: asString(skill.name),
        }))

    const reviewers = asRecordArray(challenge.reviewers)
        .map(reviewer => ({
            aiWorkflowId: asOptionalString(reviewer.aiWorkflowId),
            isMemberReview: reviewer.isMemberReview === true,
            scorecardId: asString(reviewer.scorecardId),
            type: asOptionalString(reviewer.type),
        }))

    const discussionUrl = asString(asRecordArray(challenge.discussions)[0]?.url)
    const privateDescription = asString(challenge.privateDescription)

    const seed: UnknownRecord = {
        challenge_metadata: {
            isTask: asRecord(challenge.task)?.isTask === true,
            numOfRegistrants: asNumber(challenge.numOfRegistrants),
            numOfSubmissions: asNumber(challenge.numOfSubmissions),
            status: asString(challenge.status),
            totalPrizes: asNumber(asRecord(challenge.overview)?.totalPrizes),
            track: asString(asRecord(challenge.track)?.name),
            type: asString(asRecord(challenge.type)?.name),
        },
        challengeId: asString(challenge.id),
        descriptionFormat: asString(challenge.descriptionFormat) || 'markdown',
        descriptionRaw: asString(challenge.description),
        prizes,
        requirement_groups: [],
        requirements: [],
        review_criteria: {
            reviewers,
            reviewType: asString(asRecord(challenge.legacy)?.reviewType) || 'UNKNOWN',
            // The unified context schema uses null for "no member scorecard".
            // eslint-disable-next-line unicorn/no-null
            scorecard: scorecard ?? null,
        },
        skills,
        tech_stack: [],
        timeline: {
            endDate,
            registrationEndDate: asString(challenge.registrationEndDate),
            registrationStartDate: asString(challenge.registrationStartDate),
            startDate,
            totalDurationDays,
        },
        title: asString(challenge.name),
    }

    if (privateDescription) {
        seed.privateDescription = privateDescription
    }

    if (discussionUrl) {
        seed.discussion_url = discussionUrl
    }

    return seed
}
