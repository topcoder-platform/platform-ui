/**
 * Content of review tab.
 */
import { FC, useMemo } from 'react'

import { TableLoading } from '~/apps/admin/src/lib'
import { IsRemovingType } from '~/apps/admin/src/lib/models'

import { MappingReviewAppeal, SubmissionInfo } from '../../models'
import { hasIsLatestFlag } from '../../utils'
import { TableAppeals } from '../TableAppeals'
import { TableAppealsForSubmitter } from '../TableAppealsForSubmitter'
import { TableAppealsResponse } from '../TableAppealsResponse'
import { TableNoRecord } from '../TableNoRecord'
import { TableReview } from '../TableReview'
import { TableReviewForSubmitter } from '../TableReviewForSubmitter'
import { useRole, useRoleProps } from '../../hooks'
import {
    APPROVAL,
    REVIEWER,
    SUBMITTER,
} from '../../../config/index.config'

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

    if (selectedTab === 'Appeals Response') {
        return (
            <TableAppealsResponse
                datas={reviews}
                isDownloading={props.isDownloading}
                downloadSubmission={props.downloadSubmission}
                mappingReviewAppeal={props.mappingReviewAppeal}
                hideHandleColumn={hideHandleColumn}
            />
        )
    }

    // show no record message
    if (!reviewRows.length) {
        return <TableNoRecord message='No reviews yet' />
    }

    if (selectedTab === 'Appeals') {
        return isSubmitterView ? (
            <TableAppealsForSubmitter
                datas={filteredSubmitterReviews}
                isDownloading={props.isDownloading}
                downloadSubmission={props.downloadSubmission}
                mappingReviewAppeal={props.mappingReviewAppeal}
            />
        ) : (
            <TableAppeals
                datas={filteredReviews}
                isDownloading={props.isDownloading}
                downloadSubmission={props.downloadSubmission}
                mappingReviewAppeal={props.mappingReviewAppeal}
                hideHandleColumn={hideHandleColumn}
            />
        )
    }

    return isSubmitterView ? (
        <TableReviewForSubmitter
            datas={filteredSubmitterReviews}
            isDownloading={props.isDownloading}
            downloadSubmission={props.downloadSubmission}
            mappingReviewAppeal={props.mappingReviewAppeal}
        />
    ) : (
        <TableReview
            datas={filteredReviews}
            isDownloading={props.isDownloading}
            downloadSubmission={props.downloadSubmission}
            mappingReviewAppeal={props.mappingReviewAppeal}
            hideHandleColumn={hideHandleColumn}
        />
    )
}

export default TabContentReview
