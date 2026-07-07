import {
    AiReviewDecision,
    BackendPhase,
    BackendResource,
    SubmissionInfo,
} from '../../models'
import { shouldIncludeInReviewPhase } from '../../utils/reviewPhaseGuards'

interface FilterIterativeReviewRowsArgs {
    aiReviewDecisionsBySubmissionId?: Record<string, AiReviewDecision>
    challengePhases?: BackendPhase[]
    isPostMortemPhase: boolean
    limitToSubmissionIds?: string[]
    phaseIdFilter?: string
    reviewerResources?: BackendResource[]
    sourceRows: SubmissionInfo[]
}

interface IterativePlaceholderRowArgs {
    challengePhases?: BackendPhase[]
    isPostMortemPhase: boolean
    iterativeReviewPhaseCount: number
    iterativeReviewerResourceIds: Set<string>
    submission: SubmissionInfo
}

interface LimitFirst2FinishIterativeRowsOptions {
    forceSingleRow?: boolean
}

function isAiFailedReviewSubmission(submission: SubmissionInfo): boolean {
    return (submission.status ?? '').toUpperCase() === 'AI_FAILED_REVIEW'
}

function isAiLockedByDecision(
    submission: SubmissionInfo,
    aiReviewDecisionsBySubmissionId?: Record<string, AiReviewDecision>,
): boolean {
    const submissionId = normalizeIdentifier(submission.id)
    if (!submissionId || !aiReviewDecisionsBySubmissionId) {
        return false
    }

    const decision = aiReviewDecisionsBySubmissionId[submissionId]
    if (!decision) {
        return false
    }

    const decisionStatus = (decision.status ?? '').toUpperCase()
    const isDecisionFailed = decisionStatus === 'FAILED' || decisionStatus === 'ERROR'

    return Boolean(decision.submissionLocked && isDecisionFailed)
}

function shouldTreatAsAiFailedSubmission(
    submission: SubmissionInfo,
    aiReviewDecisionsBySubmissionId?: Record<string, AiReviewDecision>,
): boolean {
    if (isAiLockedByDecision(submission, aiReviewDecisionsBySubmissionId)) {
        return true
    }

    return isAiFailedReviewSubmission(submission)
}

/**
 * Normalize a phase or resource identifier for set-based comparisons.
 *
 * @param value - Raw identifier value from phase or review payloads.
 * @returns Trimmed string identifier when present; otherwise undefined.
 */
function normalizeIdentifier(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalized = `${value}`.trim()
    return normalized.length ? normalized : undefined
}

/**
 * Collect submission identifiers that can refer to the same visible row.
 *
 * @param submission - Candidate iterative-review row from review data.
 * @returns Normalized row, legacy, and review submission ids for matching.
 * Used by F2F limiting because URL submissions can be keyed by legacy ids.
 */
function collectSubmissionCandidateIds(submission: SubmissionInfo): Set<string> {
    return new Set(
        [
            submission.id,
            submission.legacySubmissionId,
            submission.review?.submissionId,
        ]
            .map(id => normalizeIdentifier(id))
            .filter((id): id is string => Boolean(id)),
    )
}

/**
 * Rank duplicate iterative-review rows for the same submission.
 *
 * @param submission - Candidate row built from a submission/reviewer pair.
 * @param currentResourceIds - Resource ids assigned to the logged-in reviewer.
 * @returns Numeric priority; larger values win during duplicate collapse.
 * Used so reviewers see their own pending action when URL/F2F rows share ids.
 */
export function getIterativeReviewSubmissionPriority(
    submission: SubmissionInfo,
    currentResourceIds: Set<string> = new Set<string>(),
): number {
    const review = submission.review
    if (!review) {
        return 0
    }

    const hasReviewId = Boolean(review.id)
    const status = (review.status ?? '').toUpperCase()
    const resourcePriority = review.resourceId && currentResourceIds.has(review.resourceId)
        ? 10
        : 0

    if (hasReviewId && (status === 'COMPLETED' || status === 'SUBMITTED')) {
        return 4 + resourcePriority
    }

    if (hasReviewId && review.reviewProgress) {
        return 3 + resourcePriority
    }

    if (hasReviewId) {
        return 2 + resourcePriority
    }

    return 1
}

/**
 * Parse sortable date inputs from submission and review payloads.
 *
 * @param value - Raw date-like value supplied by the UI model.
 * @returns Parsed timestamp, or NaN when no valid date is available.
 */
function parseSortableDate(value: string | Date | undefined): number {
    if (value instanceof Date) {
        return value.getTime()
    }

    return Date.parse(value ?? '')
}

/**
 * Resolve the effective phase-id filter set for the selected phase.
 *
 * @param challengePhases - Challenge phases used to expand id and phaseId aliases.
 * @param phaseIdFilter - Selected phase identifier from the UI tab.
 * @returns Set of acceptable phase identifiers, or undefined when no filter applies.
 */
function buildPhaseIdFilterSet(
    challengePhases: BackendPhase[] | undefined,
    phaseIdFilter: string | undefined,
): Set<string> | undefined {
    const normalizedFilter = normalizeIdentifier(phaseIdFilter)
    if (!normalizedFilter) {
        return undefined
    }

    const ids = new Set<string>([normalizedFilter])
    const matchingPhase = (challengePhases ?? []).find(phase => {
        const phaseId = normalizeIdentifier(phase.id)
        const phaseTypeId = normalizeIdentifier(phase.phaseId)
        return phaseId === normalizedFilter || phaseTypeId === normalizedFilter
    })

    if (matchingPhase) {
        const phaseId = normalizeIdentifier(matchingPhase.id)
        if (phaseId) {
            ids.add(phaseId)
        }

        const phaseTypeId = normalizeIdentifier(matchingPhase.phaseId)
        if (phaseTypeId) {
            ids.add(phaseTypeId)
        }
    }

    return ids
}

/**
 * Count iterative-review phases so fallback matching only applies to single-phase flows.
 *
 * @param challengePhases - Challenge phases associated with the current challenge.
 * @returns Number of iterative-review phases configured on the challenge.
 */
function countIterativeReviewPhases(challengePhases: BackendPhase[] | undefined): number {
    return (challengePhases ?? []).filter(phase => (phase.name ?? '')
        .toLowerCase()
        .includes('iterative review')).length
}

interface OrderedIterativePhase {
    id: string
    phaseTypeId?: string
}

function getOrderedIterativePhases(challengePhases: BackendPhase[] | undefined): OrderedIterativePhase[] {
    const iterativePhases = (challengePhases ?? [])
        .map((phase, index) => ({
            id: normalizeIdentifier(phase.id),
            index,
            phaseTypeId: normalizeIdentifier(phase.phaseId),
            startedAt: parseSortableDate(phase.actualStartDate ?? phase.scheduledStartDate),
        }))
        .filter(phase => Boolean(phase.id))
        .filter(phase => (challengePhases?.[phase.index].name ?? '')
            .toLowerCase()
            .includes('iterative review'))
        .sort((left, right) => {
            const leftStartedAt = Number.isFinite(left.startedAt)
                ? left.startedAt
                : Number.POSITIVE_INFINITY
            const rightStartedAt = Number.isFinite(right.startedAt)
                ? right.startedAt
                : Number.POSITIVE_INFINITY

            if (leftStartedAt !== rightStartedAt) {
                return leftStartedAt - rightStartedAt
            }

            return left.index - right.index
        })

    return iterativePhases
        .map(phase => ({
            id: phase.id,
            phaseTypeId: phase.phaseTypeId,
        } as OrderedIterativePhase))
        .filter((phase): phase is OrderedIterativePhase => Boolean(phase.id))
}

function getAiFailedSubmissionIdsForSelectedIterativePhase(
    sourceRows: SubmissionInfo[],
    challengePhases: BackendPhase[] | undefined,
    phaseIdFilterSet: Set<string>,
    aiReviewDecisionsBySubmissionId?: Record<string, AiReviewDecision>,
): Set<string> {
    const orderedIterativePhases = getOrderedIterativePhases(challengePhases)
    if (!orderedIterativePhases.length) {
        return new Set<string>()
    }

    const assignedIterativePhaseIds = new Set<string>()
    sourceRows.forEach(submission => {
        const reviewPhaseId = normalizeIdentifier(submission.review?.phaseId)
        if (!reviewPhaseId) {
            return
        }

        const matchedByPhaseId = orderedIterativePhases.find(phase => phase.id === reviewPhaseId)
        if (matchedByPhaseId) {
            assignedIterativePhaseIds.add(matchedByPhaseId.id)
            return
        }

        const matchedByPhaseTypeId = orderedIterativePhases.filter(
            phase => phase.phaseTypeId === reviewPhaseId,
        )
        if (matchedByPhaseTypeId.length === 1) {
            assignedIterativePhaseIds.add(matchedByPhaseTypeId[0].id)
        }
    })

    const unassignedIterativePhaseIds = orderedIterativePhases
        .map(phase => phase.id)
        .filter(phaseId => !assignedIterativePhaseIds.has(phaseId))

    if (!unassignedIterativePhaseIds.length) {
        return new Set<string>()
    }

    const selectedPhase = orderedIterativePhases.find(phase => phaseIdFilterSet.has(phase.id))
        ?? (() => {
            const matchedByPhaseTypeId = orderedIterativePhases.filter(
                phase => Boolean(phase.phaseTypeId && phaseIdFilterSet.has(phase.phaseTypeId)),
            )

            if (matchedByPhaseTypeId.length === 1) {
                return matchedByPhaseTypeId[0]
            }

            return undefined
        })()

    const aiFailedRows = sourceRows
        .filter(submission => !normalizeIdentifier(submission.review?.phaseId))
        .filter(submission => shouldTreatAsAiFailedSubmission(submission, aiReviewDecisionsBySubmissionId))
        .map((submission, index) => ({
            index,
            reviewCreatedAt: parseSortableDate(submission.review?.createdAt),
            submission,
            submittedAt: parseSortableDate(submission.submittedDate),
        }))
        .sort((left, right) => {
            const leftSubmittedAt = Number.isFinite(left.submittedAt)
                ? left.submittedAt
                : Number.POSITIVE_INFINITY
            const rightSubmittedAt = Number.isFinite(right.submittedAt)
                ? right.submittedAt
                : Number.POSITIVE_INFINITY

            if (leftSubmittedAt !== rightSubmittedAt) {
                return leftSubmittedAt - rightSubmittedAt
            }

            const leftReviewCreatedAt = Number.isFinite(left.reviewCreatedAt)
                ? left.reviewCreatedAt
                : Number.POSITIVE_INFINITY
            const rightReviewCreatedAt = Number.isFinite(right.reviewCreatedAt)
                ? right.reviewCreatedAt
                : Number.POSITIVE_INFINITY

            if (leftReviewCreatedAt !== rightReviewCreatedAt) {
                return leftReviewCreatedAt - rightReviewCreatedAt
            }

            return left.index - right.index
        })

    if (!aiFailedRows.length) {
        return new Set<string>()
    }

    if (!selectedPhase) {
        return new Set<string>()
    }

    const selectedPhaseIndex = unassignedIterativePhaseIds.findIndex(phaseId => phaseId === selectedPhase.id)
    if (selectedPhaseIndex < 0) {
        return new Set<string>()
    }

    if (unassignedIterativePhaseIds.length === 1) {
        return new Set(
            aiFailedRows
                .map(row => normalizeIdentifier(row.submission.id))
                .filter((id): id is string => Boolean(id)),
        )
    }

    const isLastIterativePhase = selectedPhaseIndex === unassignedIterativePhaseIds.length - 1
    const assignedRows = isLastIterativePhase
        ? aiFailedRows.slice(selectedPhaseIndex)
        : aiFailedRows.slice(selectedPhaseIndex, selectedPhaseIndex + 1)

    return new Set(
        assignedRows
            .map(row => normalizeIdentifier(row.submission.id))
            .filter((id): id is string => Boolean(id)),
    )
}

/**
 * Collect resource ids assigned to iterative-review roles.
 *
 * @param reviewerResources - Challenge resources available on the details page.
 * @returns Set of resource ids belonging to iterative reviewers.
 */
function collectIterativeReviewerResourceIds(
    reviewerResources: BackendResource[] | undefined,
): Set<string> {
    return new Set(
        (reviewerResources ?? [])
            .filter(resource => {
                const normalizedRoleName = (resource.roleName ?? '')
                    .toLowerCase()
                    .replace(/[^a-z]/g, '')
                return normalizedRoleName === 'iterativereviewer'
            })
            .map(resource => normalizeIdentifier(resource.id))
            .filter((id): id is string => Boolean(id)),
    )
}

/**
 * Determine whether a row is an iterative placeholder created before the backend review exists.
 *
 * @param args - Current filter context and candidate submission row.
 * @returns True when the row should stay visible on a single iterative-review tab.
 */
function isIterativePlaceholderRow(args: IterativePlaceholderRowArgs): boolean {
    const {
        challengePhases,
        isPostMortemPhase,
        iterativeReviewPhaseCount,
        iterativeReviewerResourceIds,
        submission,
    }: IterativePlaceholderRowArgs = args

    if (isPostMortemPhase || iterativeReviewPhaseCount !== 1) {
        return false
    }

    const resourceId = normalizeIdentifier(submission.review?.resourceId)
    if (!resourceId || !iterativeReviewerResourceIds.has(resourceId)) {
        return false
    }

    return !shouldIncludeInReviewPhase(submission, challengePhases)
}

/**
 * Restrict First2Finish iterative rows to the single submission that should stay
 * visible on the tab.
 *
 * @param rows - Candidate rows for the iterative-review tab.
 * @param preferredSubmissionIds - Optional submission ids supplied by the caller.
 * @returns A single surviving iterative-review row whenever a First2Finish limit applies.
 */
export function limitFirst2FinishIterativeRows(
    rows: SubmissionInfo[],
    preferredSubmissionIds?: string[],
    options?: LimitFirst2FinishIterativeRowsOptions,
): SubmissionInfo[] {
    const submissionIds = new Set(
        (preferredSubmissionIds ?? [])
            .map(submissionId => normalizeIdentifier(submissionId))
            .filter((submissionId): submissionId is string => Boolean(submissionId)),
    )

    if (!submissionIds.size && !options?.forceSingleRow) {
        return rows
    }

    const matchingRows = rows.filter(submission => {
        const candidateIds = collectSubmissionCandidateIds(submission)
        return Array.from(candidateIds)
            .some(submissionId => submissionIds.has(submissionId))
    })

    if (matchingRows.length) {
        return matchingRows
    }

    if (rows.length <= 1) {
        return rows
    }

    const withOrdering = rows
        .map((submission, index) => ({
            index,
            reviewCreatedAt: parseSortableDate(submission.review?.createdAt),
            submission,
            submittedAt: parseSortableDate(submission.submittedDate),
        }))
        .sort((left, right) => {
            const leftSubmittedAt = Number.isFinite(left.submittedAt)
                ? left.submittedAt
                : Number.POSITIVE_INFINITY
            const rightSubmittedAt = Number.isFinite(right.submittedAt)
                ? right.submittedAt
                : Number.POSITIVE_INFINITY

            if (leftSubmittedAt !== rightSubmittedAt) {
                return leftSubmittedAt - rightSubmittedAt
            }

            const leftReviewCreatedAt = Number.isFinite(left.reviewCreatedAt)
                ? left.reviewCreatedAt
                : Number.POSITIVE_INFINITY
            const rightReviewCreatedAt = Number.isFinite(right.reviewCreatedAt)
                ? right.reviewCreatedAt
                : Number.POSITIVE_INFINITY

            if (leftReviewCreatedAt !== rightReviewCreatedAt) {
                return leftReviewCreatedAt - rightReviewCreatedAt
            }

            return left.index - right.index
        })

    return withOrdering[0] ? [withOrdering[0].submission] : rows
}

/**
 * Filter iterative-review rows for the selected tab while preserving reviewer placeholders.
 *
 * @param args - Iterative-review rows, selected phase context, and challenge resources.
 * @returns Rows that belong on the currently selected iterative-review tab.
 */
export function filterIterativeReviewRows(args: FilterIterativeReviewRowsArgs): SubmissionInfo[] {
    const {
        aiReviewDecisionsBySubmissionId,
        challengePhases,
        isPostMortemPhase,
        limitToSubmissionIds,
        phaseIdFilter,
        reviewerResources,
        sourceRows,
    }: FilterIterativeReviewRowsArgs = args

    const phaseIdFilterSet = buildPhaseIdFilterSet(challengePhases, phaseIdFilter)
    const iterativeReviewPhaseCount = countIterativeReviewPhases(challengePhases)
    const iterativeReviewerResourceIds = collectIterativeReviewerResourceIds(reviewerResources)

    if (phaseIdFilterSet?.size) {
        const aiFailedSubmissionIdsForSelectedPhase = getAiFailedSubmissionIdsForSelectedIterativePhase(
            sourceRows,
            challengePhases,
            phaseIdFilterSet,
            aiReviewDecisionsBySubmissionId,
        )

        const filteredRows = sourceRows.filter(submission => {
            const reviewPhaseId = normalizeIdentifier(submission.review?.phaseId)
            if (reviewPhaseId) {
                return phaseIdFilterSet.has(reviewPhaseId)
            }

            if (shouldTreatAsAiFailedSubmission(submission, aiReviewDecisionsBySubmissionId)) {
                const submissionId = normalizeIdentifier(submission.id)
                return submissionId ? aiFailedSubmissionIdsForSelectedPhase.has(submissionId) : false
            }

            // New WM F2F flows can surface assigned submissions before the review row has a phase id.
            return isIterativePlaceholderRow({
                challengePhases,
                isPostMortemPhase,
                iterativeReviewerResourceIds,
                iterativeReviewPhaseCount,
                submission,
            })
        })

        return limitFirst2FinishIterativeRows(filteredRows, limitToSubmissionIds)
    }

    if (!isPostMortemPhase) {
        const iterativeOnly = sourceRows.filter(submission => (
            shouldTreatAsAiFailedSubmission(submission, aiReviewDecisionsBySubmissionId)
            || !shouldIncludeInReviewPhase(
                submission,
                challengePhases,
            )
        ))
        if (iterativeOnly.length) {
            return limitFirst2FinishIterativeRows(iterativeOnly, limitToSubmissionIds)
        }
    }

    return limitFirst2FinishIterativeRows(sourceRows, limitToSubmissionIds)
}
