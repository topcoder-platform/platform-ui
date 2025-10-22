/**
 * Content of approval tab.
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

const normalizeAlphaLowerCase = (value?: string): string | undefined => {
    if (typeof value !== 'string') {
        return undefined
    }

    const trimmed = value.trim()
    return trimmed
        ? trimmed
            .toLowerCase()
            .replace(/[^a-z]/g, '')
        : undefined
}

const getSubmissionScore = (submission: SubmissionInfo): number => {
    const scores: number[] = []

    if (typeof submission.aggregateScore === 'number' && Number.isFinite(submission.aggregateScore)) {
        scores.push(submission.aggregateScore)
    }

    if (typeof submission.review?.finalScore === 'number' && Number.isFinite(submission.review.finalScore)) {
        scores.push(submission.review.finalScore)
    }

    if (Array.isArray(submission.reviews)) {
        submission.reviews.forEach(reviewResult => {
            const score = reviewResult?.score
            if (typeof score === 'number' && Number.isFinite(score)) {
                scores.push(score)
            }
        })
    }

    return scores.length
        ? Math.max(...scores)
        : Number.NEGATIVE_INFINITY
}

const getSubmissionTimestamp = (submission: SubmissionInfo): number => {
    const submittedDate: SubmissionInfo['submittedDate'] = submission.submittedDate
    if (submittedDate instanceof Date) {
        return submittedDate.getTime()
    }

    if (typeof submittedDate === 'string') {
        const parsed = Date.parse(submittedDate)
        return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY
    }

    return Number.NEGATIVE_INFINITY
}

interface Props {
    reviews: SubmissionInfo[]
    submitterReviews: SubmissionInfo[]
    isLoadingReview: boolean
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    isActiveChallenge: boolean
}

export const TabContentApproval: FC<Props> = (props: Props) => {
    const { actionChallengeRole }: useRoleProps = useRole()
    const hideHandleColumn = props.isActiveChallenge
        && actionChallengeRole === REVIEWER

    const isSubmitterView = actionChallengeRole === SUBMITTER
    const rawRows = isSubmitterView ? props.submitterReviews : props.reviews

    // Only show Approval-phase reviews on the Approval tab
    const { challengeInfo }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const approvalPhaseIds = useMemo<Set<string>>(
        () => new Set(
            (challengeInfo?.phases ?? [])
                .filter(p => (p.name || '').toLowerCase() === 'approval')
                .map(p => p.id),
        ),
        [challengeInfo?.phases],
    )
    const approvalRows: SubmissionInfo[] = useMemo(
        () => {
            const inPhase = rawRows.filter(r => (r.review?.phaseId ? approvalPhaseIds.has(r.review.phaseId) : false))
            if (!inPhase.length) {
                return []
            }

            const reviewTypeRows = inPhase.filter(row => normalizeAlphaLowerCase(row.reviewTypeId) === 'review')
            if (!reviewTypeRows.length) {
                return []
            }

            const passingRows = reviewTypeRows.filter(row => row.isPassingReview === true)
            if (!passingRows.length) {
                return []
            }

            const bestRow = passingRows.reduce<SubmissionInfo | undefined>((best, current) => {
                if (!best) {
                    return current
                }

                const bestScore = getSubmissionScore(best)
                const currentScore = getSubmissionScore(current)

                if (currentScore > bestScore) {
                    return current
                }

                if (currentScore === bestScore) {
                    const currentTimestamp = getSubmissionTimestamp(current)
                    const bestTimestamp = getSubmissionTimestamp(best)
                    return currentTimestamp > bestTimestamp ? current : best
                }

                return best
            }, undefined)

            return bestRow ? [bestRow] : []
        },
        [rawRows, approvalPhaseIds],
    )

    if (props.isLoadingReview) {
        return <TableLoading />
    }

    if (!approvalRows.length) {
        return <TableNoRecord message='No approvals yet' />
    }

    return (
        <TableIterativeReview
            datas={approvalRows}
            isDownloading={props.isDownloading}
            downloadSubmission={props.downloadSubmission}
            hideHandleColumn={hideHandleColumn}
            columnLabel='Approval'
        />
    )
}

export default TabContentApproval
