/**
 * Content of iterative review tab.
 */
import { FC, useContext, useMemo } from 'react'

import { TableLoading } from '~/apps/admin/src/lib'
import { IsRemovingType } from '~/apps/admin/src/lib/models'

import { ChallengeDetailContextModel, SubmissionInfo } from '../../models'
import { TableNoRecord } from '../TableNoRecord'
import { TableIterativeReview } from '../TableIterativeReview'
import { useRole, useRoleProps } from '../../hooks'
import {
    REVIEWER,
    SUBMITTER,
} from '../../../config/index.config'
import { ChallengeDetailContext } from '../../contexts'
import { hasSubmitterPassedThreshold } from '../../utils/reviewScoring'
import { shouldIncludeInReviewPhase } from '../../utils/reviewPhaseGuards'

interface Props {
    reviews: SubmissionInfo[]
    submitterReviews: SubmissionInfo[]
    postMortemMinimumPassingScore?: number | null
    isLoadingReview: boolean
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    isActiveChallenge: boolean
    columnLabel?: string
    phaseIdFilter?: string
    aiReviewers?: { aiWorkflowId: string }[]
}

const getSubmissionPriority = (submission: SubmissionInfo): number => {
    const review = submission.review
    if (!review) {
        return 0
    }

    const hasReviewId = Boolean(review.id)
    const status = (review.status ?? '').toUpperCase()

    if (hasReviewId && (status === 'COMPLETED' || status === 'SUBMITTED')) {
        return 4
    }

    if (hasReviewId && review.reviewProgress) {
        return 3
    }

    if (hasReviewId) {
        return 2
    }

    return 1
}

const normalizePhaseId = (value: unknown): string | undefined => {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalized = `${value}`.trim()
    return normalized.length ? normalized : undefined
}

export const TabContentIterativeReview: FC<Props> = (props: Props) => {
    const {
        challengeInfo,
        myResources = [],
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const {
        actionChallengeRole,
        isPrivilegedRole,
        postMortemReviewerResourceIds,
    }: useRoleProps = useRole()
    const hideHandleColumn = props.isActiveChallenge
        && actionChallengeRole === REVIEWER

    const myMemberIds = useMemo<Set<string>>(
        () => new Set((myResources ?? []).map(resource => resource.memberId)),
        [myResources],
    )

    const isChallengeCompleted = useMemo(
        () => {
            const normalizedStatus = (challengeInfo?.status ?? '').toUpperCase()
            return normalizedStatus === 'COMPLETED'
                || normalizedStatus === 'CANCELLED'
                || normalizedStatus.startsWith('CANCELLED_')
        },
        [challengeInfo?.status],
    )

    const normalizedColumnLabel = useMemo(
        () => (props.columnLabel ?? '')
            .toLowerCase()
            .replace(/[^a-z]/g, ''),
        [props.columnLabel],
    )
    const isPostMortemPhase = useMemo(
        () => normalizedColumnLabel === 'postmortem',
        [normalizedColumnLabel],
    )

    const isSubmitterOnly = actionChallengeRole === SUBMITTER
        && postMortemReviewerResourceIds.size === 0
    const sourceRows = isPostMortemPhase && isSubmitterOnly
        ? props.submitterReviews
        : props.reviews

    const hasPassedPostMortemThreshold = useMemo(
        () => hasSubmitterPassedThreshold(
            sourceRows ?? [],
            myMemberIds,
            props.postMortemMinimumPassingScore,
        ),
        [sourceRows, myMemberIds, props.postMortemMinimumPassingScore],
    )

    const phaseIdFilterSet = useMemo(() => {
        const normalizedFilter = normalizePhaseId(props.phaseIdFilter)
        if (!normalizedFilter) {
            return undefined
        }

        const ids = new Set<string>([normalizedFilter])
        const phases = challengeInfo?.phases ?? []
        const matchingPhase = phases.find(phase => {
            const phaseId = normalizePhaseId(phase.id)
            const phaseTypeId = normalizePhaseId(phase.phaseId)
            return phaseId === normalizedFilter || phaseTypeId === normalizedFilter
        })

        if (matchingPhase) {
            const phaseId = normalizePhaseId(matchingPhase.id)
            if (phaseId) {
                ids.add(phaseId)
            }

            const phaseTypeId = normalizePhaseId(matchingPhase.phaseId)
            if (phaseTypeId) {
                ids.add(phaseTypeId)
            }
        }

        return ids
    }, [challengeInfo?.phases, props.phaseIdFilter])

    const filteredRows = useMemo(() => {
        if (phaseIdFilterSet?.size) {
            return sourceRows.filter(submission => {
                const reviewPhaseId = normalizePhaseId(submission.review?.phaseId)
                return reviewPhaseId ? phaseIdFilterSet.has(reviewPhaseId) : false
            })
        }

        if (!isPostMortemPhase) {
            const iterativeOnly = sourceRows.filter(submission => !shouldIncludeInReviewPhase(
                submission,
                challengeInfo?.phases,
            ))
            if (iterativeOnly.length) {
                return iterativeOnly
            }
        }

        return sourceRows
    }, [sourceRows, phaseIdFilterSet, isPostMortemPhase, challengeInfo?.phases])

    const reviewRows = useMemo(() => {
        const map = new Map<string, SubmissionInfo>()

        filteredRows.forEach(submission => {
            const existing = map.get(submission.id)

            if (!existing) {
                map.set(submission.id, submission)
                return
            }

            if (getSubmissionPriority(submission) > getSubmissionPriority(existing)) {
                map.set(submission.id, submission)
            }
        })

        return Array.from(map.values())
    }, [filteredRows])

    const filteredReviewRows = useMemo<SubmissionInfo[]>(
        () => {
            if (!isPostMortemPhase) {
                return reviewRows
            }

            if (isPrivilegedRole || (isChallengeCompleted && (!isPostMortemPhase || hasPassedPostMortemThreshold))) {
                return reviewRows
            }

            return reviewRows.filter(row => {
                if (row.review?.resourceId
                    && postMortemReviewerResourceIds.has(row.review.resourceId)) {
                    return true
                }

                if (row.memberId && myMemberIds.has(row.memberId)) {
                    return true
                }

                return false
            })
        },
        [
            reviewRows,
            isPostMortemPhase,
            isPrivilegedRole,
            isChallengeCompleted,
            hasPassedPostMortemThreshold,
            postMortemReviewerResourceIds,
            myMemberIds,
        ],
    )

    if (props.isLoadingReview) {
        return <TableLoading />
    }

    if (!filteredReviewRows.length) {
        const emptyMessage = isPostMortemPhase
            ? 'No post-mortem reviews yet'
            : 'No iterative reviews yet'
        return <TableNoRecord message={emptyMessage} />
    }

    const shouldHideSubmissionColumn = isPostMortemPhase

    return (
        <TableIterativeReview
            datas={filteredReviewRows}
            isDownloading={props.isDownloading}
            downloadSubmission={props.downloadSubmission}
            hideHandleColumn={hideHandleColumn}
            columnLabel={props.columnLabel}
            hideSubmissionColumn={shouldHideSubmissionColumn}
            isChallengeCompleted={isChallengeCompleted}
            hasPassedThreshold={hasPassedPostMortemThreshold}
            aiReviewers={props.aiReviewers}
        />
    )
}

export default TabContentIterativeReview
