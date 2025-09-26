/**
 * Content of review tab.
 */
import { FC, useMemo } from 'react'
import { maxBy } from 'lodash'

import { TableLoading } from '~/apps/admin/src/lib'
import { IsRemovingType } from '~/apps/admin/src/lib/models'

import { MappingReviewAppeal, SubmissionInfo } from '../../models'
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
    isLoadingReview: boolean
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    mappingReviewAppeal: MappingReviewAppeal // from review id to appeal info
    isActiveChallenge: boolean
}

export const TabContentReview: FC<Props> = (props: Props) => {
    const selectedTab = props.selectedTab
    const reviews = props.reviews
    const firstSubmissions = useMemo(
        () => maxBy(reviews, 'review.initialScore'),
        [reviews],
    )
    const { actionChallengeRole }: useRoleProps = useRole()
    const hideHandleColumn = props.isActiveChallenge
        && actionChallengeRole === REVIEWER

    // show loading ui when fetching data
    if (
        props.isLoadingReview
    ) {
        return <TableLoading />
    }

    // show no record message
    if (!reviews.length) {
        return <TableNoRecord message='No reviews yet' />
    }

    return actionChallengeRole !== SUBMITTER || selectedTab === APPROVAL ? (
        <TableReviewAppeals
            datas={reviews}
            tab={selectedTab}
            firstSubmissions={firstSubmissions}
            isDownloading={props.isDownloading}
            downloadSubmission={props.downloadSubmission}
            mappingReviewAppeal={props.mappingReviewAppeal}
            hideHandleColumn={hideHandleColumn}
        />
    ) : (
        <TableReviewAppealsForSubmitter
            datas={reviews}
            firstSubmissions={firstSubmissions}
            isDownloading={props.isDownloading}
            downloadSubmission={props.downloadSubmission}
            mappingReviewAppeal={props.mappingReviewAppeal}
        />
    )
}

export default TabContentReview
