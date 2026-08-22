import {
    ChallengeOpportunity,
    ChallengeReviewSummation,
    ChallengeSubmission,
} from '../models'

const MARATHON_MATCH_TYPE_IDS = new Set([
    '929bc408-9cf2-4b3e-ba71-adfbf693046c',
])

type MarathonScorePhase = 'example' | 'final' | 'provisional'

export interface MarathonSubmissionScores {
    finalScore?: number
    provisionalScore?: number
}

export interface MarathonTestProgress {
    process?: 'Example' | 'Provisional' | 'System'
    progress?: number
    status?: 'Failed' | 'In progress' | 'Passed'
}

export interface MarathonDashboardPoint {
    createdAt: string
    score: number
    submissionId: string
}

export interface MarathonDashboardMember {
    handle: string
    rating?: number
    submissions: MarathonDashboardPoint[]
}

/**
 * Normalizes an inconsistent catalog or metadata token for comparisons.
 *
 * @param value unknown API value.
 * @returns lowercase alphanumeric token, or an empty string.
 * @throws Does not throw.
 */
function normalizeToken(value: unknown): string {
    return typeof value === 'string'
        ? value.replace(/[^a-zA-Z0-9]/g, '')
            .toLowerCase()
        : ''
}

/**
 * Reads a finite API score without coercing empty values to zero.
 *
 * @param value candidate numeric score.
 * @returns finite score, or undefined.
 * @throws Does not throw.
 */
function finiteScore(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue : undefined
}

/**
 * Resolves the timestamp used to order rewritten score summations.
 *
 * @param value Review API summation.
 * @returns epoch milliseconds, or zero for invalid dates.
 * @throws Does not throw.
 */
function summationTimestamp(value: ChallengeReviewSummation): number {
    const date = value.reviewedDate ?? value.createdAt ?? value.created ?? value.updatedAt
    const timestamp = date ? Date.parse(date) : Number.NaN
    return Number.isFinite(timestamp) ? timestamp : 0
}

/**
 * Resolves modern flags and legacy metadata aliases to one score phase.
 *
 * @param value Review API summation.
 * @returns normalized example, provisional, or final phase.
 * @throws Does not throw.
 */
function summationPhase(value: ChallengeReviewSummation): MarathonScorePhase | undefined {
    const metadata = value.metadata ?? {}
    const type = normalizeToken(value.type)
    const process = normalizeToken(metadata.testProcess ?? metadata.testType ?? metadata.stage)
    if (process === 'example' || type === 'example'
        || value.isExample === true || value.is_example === true) return 'example'
    if (process === 'system' || process === 'final' || type === 'final'
        || value.isFinal === true || value.is_final === true) return 'final'
    if (process === 'provisional' || process === 'initial' || type === 'provisional'
        || value.isProvisional === true || value.is_provisional === true) return 'provisional'

    // Review API's original MM rows carried no phase marker; community-app
    // treated those non-example/non-final aggregates as provisional updates.
    return 'provisional'
}

/**
 * Tests whether an aggregate is a completed, graphable scorer result.
 *
 * @param value Review API summation and scorer metadata.
 * @param score normalized aggregate score.
 * @returns true when scoring completed successfully.
 * @throws Does not throw.
 */
function hasCompletedScoring(value: ChallengeReviewSummation, score: number): boolean {
    if (value.isPassing === false || score < 0) return false
    const metadata = value.metadata ?? {}
    const status = normalizeToken(metadata.testStatus)
    if (['complete', 'completed', 'pass', 'passed', 'success', 'succeeded'].includes(status)) {
        return true
    }

    if (['error', 'failed', 'inprogress', 'pending', 'processing', 'running'].includes(status)) {
        return false
    }

    const progress = finiteScore(metadata.testProgress)
    return progress === undefined || progress >= 1
}

/**
 * Combines and de-duplicates both deployed submission summation aliases.
 *
 * @param submission Review API submission.
 * @returns unique attached summations in API order.
 * @throws Does not throw.
 */
function submissionSummations(submission: ChallengeSubmission): ChallengeReviewSummation[] {
    const result: ChallengeReviewSummation[] = []
    const seen = new Set<string>()
    const values = [
        ...(submission.reviewSummation ?? []),
        ...(submission.reviewSummations ?? []),
    ]
    values.forEach((summation, index) => {
        const key = summation.id
            ?? `${summation.submissionId ?? submission.id}:${summationPhase(summation) ?? 'unknown'}:${index}`
        if (seen.has(key)) return
        seen.add(key)
        result.push(summation)
    })
    return result
}

/**
 * Normalizes scorer progress expressed as a fraction or percentage.
 *
 * @param value candidate progress value.
 * @returns clamped percentage, or undefined.
 * @throws Does not throw.
 */
function testProgressValue(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined
    const numberValue = Number(value)
    if (!Number.isFinite(numberValue)) return undefined
    const percentage = numberValue <= 1 ? numberValue * 100 : numberValue
    return Math.min(100, Math.max(0, percentage))
}

/**
 * Resolves scorer lifecycle aliases to the three authored status labels.
 *
 * @param value scorer status token.
 * @returns member-facing scorer status, or undefined.
 * @throws Does not throw.
 */
function testStatusValue(value: unknown): MarathonTestProgress['status'] {
    const status = normalizeToken(value)
    if (['failed', 'error'].includes(status)) return 'Failed'
    if (['success', 'passed', 'complete', 'completed'].includes(status)) return 'Passed'
    if (['inprogress', 'pending', 'processing', 'running'].includes(status)) return 'In progress'
    return undefined
}

/**
 * Resolves score-phase flags to the authored process labels.
 *
 * @param value Review API summation.
 * @returns Example, Provisional, System, or undefined.
 * @throws Does not throw.
 */
function testProcessValue(value: ChallengeReviewSummation): MarathonTestProgress['process'] {
    const phase = summationPhase(value)
    if (phase === 'example') return 'Example'
    if (phase === 'provisional') return 'Provisional'
    if (phase === 'final') return 'System'
    return undefined
}

/**
 * Selects the newest usable aggregate score for one phase.
 *
 * @param submission Review API submission with optional summations.
 * @param phase requested Marathon Match score phase.
 * @returns newest finite phase score, or undefined.
 * @throws Does not throw.
 */
function latestSummationScore(
    submission: ChallengeSubmission,
    phase: MarathonScorePhase,
): number | undefined {
    return submissionSummations(submission)
        .map((summation, index) => ({
            index,
            phase: summationPhase(summation),
            score: finiteScore(summation.aggregateScore),
            timestamp: summationTimestamp(summation),
        }))
        .filter(candidate => candidate.phase === phase && candidate.score !== undefined)
        .sort((first, second) => second.timestamp - first.timestamp || second.index - first.index)[0]
        ?.score
}

/**
 * Averages finite review scores when only nested reviews are available.
 *
 * @param values candidate review scores.
 * @returns arithmetic mean, or undefined when none are finite.
 * @throws Does not throw.
 */
function averageReviewScore(values: unknown[]): number | undefined {
    const scores = values.map(finiteScore)
        .filter((score): score is number => score !== undefined)
    if (!scores.length) return undefined
    return scores.reduce((total, score) => total + score, 0) / scores.length
}

/**
 * Identifies Marathon Match challenges across v6 names, catalog IDs, and tags.
 *
 * @param challenge Challenge API detail record.
 * @returns true when any canonical Marathon Match identifier is present.
 * @throws Does not throw.
 */
export function isMarathonMatchChallenge(challenge: ChallengeOpportunity): boolean {
    const type = typeof challenge.type === 'string' ? undefined : challenge.type
    const values = [
        typeof challenge.type === 'string' ? challenge.type : challenge.type?.name,
        ...(challenge.tags ?? []),
    ].map(normalizeToken)
    return values.includes('marathonmatch')
        || values.includes('mm')
        || MARATHON_MATCH_TYPE_IDS.has(type?.id?.trim()
            .toLowerCase() ?? '')
}

/**
 * Preserves community-app's authored Marathon Match dashboard gate. Challenge
 * managers enable the standalone Dashboard tab with `show_data_dashboard`.
 *
 * @param challenge Challenge API detail record.
 * @returns true only for gated Marathon Match challenges.
 * @throws Does not throw.
 */
export function marathonDashboardIsEnabled(challenge: ChallengeOpportunity): boolean {
    if (!isMarathonMatchChallenge(challenge)) return false
    const value = challenge.metadata?.find(item => normalizeToken(item.name) === 'showdatadashboard')
        ?.value
    return value === true || (typeof value === 'string' && value.trim()
        .toLowerCase() === 'true')
}

/**
 * Resolves provisional and final Marathon Match scores, preferring the latest
 * phase-specific review summation over legacy submission-level fields.
 *
 * @param submission Review API submission with modern or legacy score fields.
 * @returns resolved provisional and final scores.
 * @throws Does not throw.
 */
export function marathonSubmissionScores(
    submission: ChallengeSubmission,
): MarathonSubmissionScores {
    const provisionalScore = latestSummationScore(submission, 'provisional')
        ?? finiteScore(submission.provisionalScore)
        ?? finiteScore(submission.initialScore)
        ?? averageReviewScore((submission.review ?? []).map(review => review.initialScore))
    const finalScore = latestSummationScore(submission, 'final')
        ?? finiteScore(submission.finalScore)
        ?? averageReviewScore((submission.review ?? []).map(review => review.finalScore ?? review.score))
    return { finalScore, provisionalScore }
}

/**
 * Resolves the most relevant member-safe scorer progress metadata embedded by
 * Review API on a Marathon Match submission.
 *
 * @param submission Review API submission with attached summations.
 * @returns highest-priority process, progress, and status values.
 * @throws Does not throw.
 */
export function marathonSubmissionTestProgress(
    submission: ChallengeSubmission,
): MarathonTestProgress {
    const candidates = submissionSummations(submission)
        .map((summation, index) => {
            const metadata = summation.metadata ?? {}
            const details = metadata.testProgressDetails
            const detailRecord = details && typeof details === 'object' && !Array.isArray(details)
                ? details as Record<string, unknown>
                : {}
            const process = testProcessValue({
                ...summation,
                metadata: {
                    ...metadata,
                    testProcess: metadata.testProcess ?? detailRecord.testProcess,
                },
            })
            const progress = testProgressValue(metadata.testProgress ?? detailRecord.progress)
            const status = testStatusValue(metadata.testStatus ?? detailRecord.status)
            const priority = status === 'In progress'
                ? 4
                : process === 'System'
                    ? 3
                    : process === 'Provisional'
                        ? 2
                        : 1
            return {
                index,
                priority,
                process,
                progress,
                status,
                timestamp: summationTimestamp(summation),
            }
        })
        .filter(candidate => candidate.process || candidate.status || candidate.progress !== undefined)
        .sort((first, second) => second.priority - first.priority
            || second.timestamp - first.timestamp
            || second.index - first.index)
    const current = candidates[0]
    return current
        ? {
            process: current.process,
            progress: current.progress,
            status: current.status,
        }
        : {}
}

/**
 * Adds challenge-level review summations to their corresponding submissions.
 *
 * @param submissions Review API submission rows.
 * @param summations challenge-level aggregate score rows.
 * @returns copied submissions with matching summations attached.
 * @throws Does not throw.
 */
export function attachMarathonReviewSummations(
    submissions: ChallengeSubmission[],
    summations: ChallengeReviewSummation[],
): ChallengeSubmission[] {
    const bySubmission = summations.reduce<Map<string, ChallengeReviewSummation[]>>((result, summation) => {
        if (!summation.submissionId) return result
        const existing = result.get(summation.submissionId) ?? []
        existing.push(summation)
        result.set(summation.submissionId, existing)
        return result
    }, new Map())
    return submissions.map(submission => ({
        ...submission,
        reviewSummation: [
            ...(submission.reviewSummation ?? []),
            ...(bySubmission.get(submission.id) ?? []),
        ],
    }))
}

/**
 * Formats a Marathon Match score without hiding valid zero values.
 *
 * @param score optional finite score.
 * @param fallback text used when no score exists.
 * @returns localized score or fallback.
 * @throws Does not throw.
 */
export function formatMarathonScore(score: number | undefined, fallback: string): string {
    return score === undefined
        ? fallback
        : new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 })
            .format(score)
}

/**
 * Maps a member's maximum rating to the canonical chart color.
 *
 * @param rating optional maximum rating.
 * @returns design-system rating color.
 * @throws Does not throw.
 */
export function marathonRatingColor(rating?: number): string {
    if (rating === undefined || !Number.isFinite(rating)) return '#6f6f6f'
    if (rating >= 2200) return '#ef476f'
    if (rating >= 1500) return '#f1c21b'
    if (rating >= 1200) return '#2d8acd'
    if (rating >= 900) return '#137d60'
    return '#6f6f6f'
}

/**
 * Converts Review API summations to the member-grouped score timeline used by
 * the legacy Marathon Match dashboard. When provisional results exist, final
 * score rewrites are excluded so each graph consistently represents one phase.
 *
 * @param summations challenge-level Review API aggregates.
 * @returns member-grouped, chronologically ordered dashboard points.
 * @throws Does not throw.
 */
export function buildMarathonDashboardData(
    summations: ChallengeReviewSummation[],
): MarathonDashboardMember[] {
    const candidates = summations.map((summation, index) => ({
        index,
        phase: summationPhase(summation),
        score: finiteScore(summation.aggregateScore),
        summation,
        timestamp: summationTimestamp(summation),
    }))
        .filter(candidate => candidate.score !== undefined
            && hasCompletedScoring(candidate.summation, candidate.score)
            && candidate.phase !== 'example'
            && candidate.timestamp > 0)
    const provisional = candidates.some(candidate => candidate.phase === 'provisional')
    const filtered = provisional
        ? candidates.filter(candidate => candidate.phase === 'provisional')
        : candidates.filter(candidate => candidate.phase === 'final' || candidate.phase === undefined)
    const grouped = new Map<string, {
        handle: string
        points: Map<string, { index: number; point: MarathonDashboardPoint; timestamp: number }>
        rating?: number
    }>()

    filtered.forEach(candidate => {
        const memberKey = String(candidate.summation.submitterId
            ?? candidate.summation.memberId
            ?? candidate.summation.submitterHandle
            ?? 'Member')
        const handle = candidate.summation.submitterHandle?.trim() || memberKey
        const existing = grouped.get(memberKey) ?? {
            handle,
            points: new Map(),
            rating: candidate.summation.submitterMaxRating ?? undefined,
        }
        if (existing.rating === undefined && candidate.summation.submitterMaxRating !== null) {
            existing.rating = candidate.summation.submitterMaxRating
        }

        const submissionId = candidate.summation.submissionId
            ?? candidate.summation.id
            ?? `${memberKey}-${candidate.index}`
        const point = {
            createdAt: candidate.summation.reviewedDate
                ?? candidate.summation.updatedAt
                ?? candidate.summation.createdAt
                ?? '',
            score: candidate.score as number,
            submissionId,
        }
        const previous = existing.points.get(submissionId)
        if (!previous
            || candidate.timestamp > previous.timestamp
            || (candidate.timestamp === previous.timestamp && candidate.index > previous.index)) {
            existing.points.set(submissionId, {
                index: candidate.index,
                point,
                timestamp: candidate.timestamp,
            })
        }

        grouped.set(memberKey, existing)
    })

    return Array.from(grouped.values())
        .map(member => ({
            handle: member.handle,
            rating: member.rating,
            submissions: Array.from(member.points.values())
                .sort((first, second) => first.timestamp - second.timestamp)
                .map(value => value.point),
        }))
        .filter(member => member.submissions.length > 0)
}
