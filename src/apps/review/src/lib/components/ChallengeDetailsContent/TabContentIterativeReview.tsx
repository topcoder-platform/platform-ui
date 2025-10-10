/**
 * Content of iterative review tab.
 */
import { FC, useMemo } from 'react'

import { TableLoading } from '~/apps/admin/src/lib'
import { IsRemovingType } from '~/apps/admin/src/lib/models'

import { SubmissionInfo } from '../../models'
import { TableNoRecord } from '../TableNoRecord'
import { TableIterativeReview } from '../TableIterativeReview'
import { useRole, useRoleProps } from '../../hooks'
import {
    REVIEWER,
    SUBMITTER,
} from '../../../config/index.config'

interface Props {
    reviews: SubmissionInfo[]
    submitterReviews: SubmissionInfo[]
    isLoadingReview: boolean
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    isActiveChallenge: boolean
    columnLabel?: string
    phaseIdFilter?: string
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

export const TabContentIterativeReview: FC<Props> = (props: Props) => {
    const { actionChallengeRole }: useRoleProps = useRole()
    const hideHandleColumn = props.isActiveChallenge
        && actionChallengeRole === REVIEWER

    const isSubmitterView = actionChallengeRole === SUBMITTER
    const sourceRows = isSubmitterView ? props.submitterReviews : props.reviews

    const filteredRows = useMemo(() => {
        const phaseId = props.phaseIdFilter?.trim()
        if (!phaseId) return sourceRows
        return sourceRows.filter(s => s.review?.phaseId === phaseId)
    }, [sourceRows, props.phaseIdFilter])

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

    if (props.isLoadingReview) {
        return <TableLoading />
    }

    if (!reviewRows.length) {
        const emptyMessage = props.columnLabel === 'Post-Mortem'
            ? 'No post-mortem reviews yet'
            : 'No iterative reviews yet'
        return <TableNoRecord message={emptyMessage} />
    }

    return (
        <TableIterativeReview
            datas={reviewRows}
            isDownloading={props.isDownloading}
            downloadSubmission={props.downloadSubmission}
            hideHandleColumn={hideHandleColumn}
            columnLabel={props.columnLabel}
        />
    )
}

export default TabContentIterativeReview
