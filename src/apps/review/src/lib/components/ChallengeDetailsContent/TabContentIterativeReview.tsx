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

    const reviewRows = useMemo(() => {
        const map = new Map<string, SubmissionInfo>()

        sourceRows.forEach(submission => {
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
    }, [sourceRows])

    if (props.isLoadingReview) {
        return <TableLoading />
    }

    if (!reviewRows.length) {
        return <TableNoRecord message='No iterative reviews yet' />
    }

    return (
        <TableIterativeReview
            datas={reviewRows}
            isDownloading={props.isDownloading}
            downloadSubmission={props.downloadSubmission}
            hideHandleColumn={hideHandleColumn}
        />
    )
}

export default TabContentIterativeReview
