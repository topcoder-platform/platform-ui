/**
 * Content of review tab.
 */
import { FC, useMemo } from 'react'
import { maxBy } from 'lodash'

import { TableLoading } from '~/apps/admin/src/lib'
import { IsRemovingType } from '~/apps/admin/src/lib/models'

import { MappingReviewAppeal, SubmissionInfo } from '../../models'
import { hasIsLatestFlag } from '../../utils'
import { TableNoRecord } from '../TableNoRecord'
import { TableReviewAppeals } from '../TableReviewAppeals'
import { useRole, useRoleProps } from '../../hooks'
import {
    APPROVAL,
    REVIEWER,
    SUBMITTER,
} from '../../../config/index.config'
import { TableReviewAppealsForSubmitter } from '../TableReviewAppealsForSubmitter'

interface Props {
    selectedTab: string
    reviews: SubmissionInfo[]
    submitterReviews: SubmissionInfo[]
    isLoadingReview: boolean
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    mappingReviewAppeal: MappingReviewAppeal // from review id to appeal info
    isActiveChallenge: boolean
}

export const TabContentReview: FC<Props> = (props: Props) => {
    const selectedTab = props.selectedTab
    const reviews = props.reviews
    const submitterReviews = props.submitterReviews
    const filteredReviews = useMemo(
        () => {
            const hasLatestFlag = hasIsLatestFlag(reviews)
            return hasLatestFlag
                ? reviews.filter(submission => submission.isLatest === true)
                : reviews
        },
        [reviews],
    )
    const filteredSubmitterReviews = useMemo(
        () => {
            const hasLatestFlag = hasIsLatestFlag(submitterReviews)
            return hasLatestFlag
                ? submitterReviews.filter(submission => submission.isLatest === true)
                : submitterReviews
        },
        [submitterReviews],
    )
    const firstSubmissions = useMemo(
        () => maxBy(filteredReviews, 'review.initialScore'),
        [filteredReviews],
    )
    const { actionChallengeRole }: useRoleProps = useRole()
    const hideHandleColumn = props.isActiveChallenge
        && actionChallengeRole === REVIEWER

    // show loading ui when fetching data
    const isSubmitterView = actionChallengeRole === SUBMITTER
        && selectedTab !== APPROVAL
    const reviewRows = isSubmitterView ? filteredSubmitterReviews : filteredReviews

    if (props.isLoadingReview) {
        return <TableLoading />
    }

    // show no record message
    if (!reviewRows.length) {
        return <TableNoRecord message='No reviews yet' />
    }

    return !isSubmitterView ? (
        <TableReviewAppeals
            datas={filteredReviews}
            tab={selectedTab}
            firstSubmissions={firstSubmissions}
            isDownloading={props.isDownloading}
            downloadSubmission={props.downloadSubmission}
            mappingReviewAppeal={props.mappingReviewAppeal}
            hideHandleColumn={hideHandleColumn}
            isActiveChallenge={props.isActiveChallenge}
        />
    ) : (
        <TableReviewAppealsForSubmitter
            datas={filteredSubmitterReviews}
            isDownloading={props.isDownloading}
            downloadSubmission={props.downloadSubmission}
            mappingReviewAppeal={props.mappingReviewAppeal}
            tab={selectedTab}
        />
    )
}

export default TabContentReview
