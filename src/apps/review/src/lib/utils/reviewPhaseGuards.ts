import {
    BackendPhase,
    SubmissionInfo,
} from '../models'

const EXCLUDED_REVIEW_TYPE_FRAGMENTS = [
    'approval',
    'checkpoint',
    'iterative',
    'postmortem',
    'screening',
    'specification',
] as const

const normalizeReviewPhaseHint = (value?: string | null): string => (
    typeof value === 'string'
        ? value
            .toLowerCase()
            .replace(/[^a-z]/g, '')
        : ''
)

const resolvePhaseNameFromId = (
    phaseId?: string,
    phases?: BackendPhase[],
): string | undefined => {
    if (!phaseId || !Array.isArray(phases)) {
        return undefined
    }

    const normalizedPhaseId = `${phaseId}`.trim()
        .toLowerCase()
    if (!normalizedPhaseId) {
        return undefined
    }

    const matchingPhase = phases.find(phase => {
        const candidates = [phase.id, phase.phaseId]

        return candidates.some(candidate => (
            typeof candidate === 'string'
            && candidate.trim()
                .toLowerCase() === normalizedPhaseId
        ))
    })

    return matchingPhase?.name
}

const registerCandidate = (
    registry: Set<string>,
    candidate?: string | null,
): void => {
    const normalized = normalizeReviewPhaseHint(candidate)
    if (normalized) {
        registry.add(normalized)
    }
}

const collectReviewHints = (
    submission: SubmissionInfo,
    phases?: BackendPhase[],
): Set<string> => {
    const normalizedCandidates = new Set<string>()

    registerCandidate(normalizedCandidates, submission.reviewTypeId)
    registerCandidate(normalizedCandidates, submission.review?.phaseName)
    registerCandidate(normalizedCandidates, submission.review?.reviewType)
    registerCandidate(
        normalizedCandidates,
        resolvePhaseNameFromId(submission.review?.phaseId, phases),
    )

    const metadata = submission.review?.metadata
    if (metadata && typeof metadata === 'object') {
        const metadataHints: unknown[] = [
            (metadata as { type?: unknown }).type,
            (metadata as { reviewType?: unknown }).reviewType,
            (metadata as { review_type?: unknown }).review_type,
            (metadata as { phase?: unknown }).phase,
            (metadata as { phaseName?: unknown }).phaseName,
            (metadata as { reviewPhase?: unknown }).reviewPhase,
        ]

        metadataHints.forEach(hint => {
            if (typeof hint === 'string') {
                registerCandidate(normalizedCandidates, hint)
            }
        })
    }

    return normalizedCandidates
}

export const shouldIncludeInReviewPhase = (
    submission?: SubmissionInfo,
    phases?: BackendPhase[],
): boolean => {
    if (!submission) {
        return false
    }

    const normalizedCandidates = collectReviewHints(submission, phases)
    if (!normalizedCandidates.size) {
        if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.debug('[ReviewTab] shouldIncludeInReviewPhase', {
                normalizedCandidates: [],
                reviewPhaseName: submission.review?.phaseName,
                reviewType: submission.review?.reviewType,
                reviewTypeId: submission.reviewTypeId,
                submissionId: submission.id ?? submission.review?.submissionId,
                verdict: 'included (no candidates)',
            })
        }

        return true
    }

    const normalizedCandidateList = Array.from(normalizedCandidates)
    const isExcluded = normalizedCandidateList
        .some(candidate => (
            EXCLUDED_REVIEW_TYPE_FRAGMENTS
                .some(fragment => candidate.includes(fragment))
        ))

    if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('[ReviewTab] shouldIncludeInReviewPhase', {
            normalizedCandidates: normalizedCandidateList,
            reviewPhaseName: submission.review?.phaseName,
            reviewType: submission.review?.reviewType,
            reviewTypeId: submission.reviewTypeId,
            submissionId: submission.id ?? submission.review?.submissionId,
            verdict: isExcluded ? 'excluded' : 'included',
        })
    }

    return !isExcluded
}

export const shouldDisplayOnReviewTab = shouldIncludeInReviewPhase
