/**
 * Content of review tab.
 */
import {
    FC,
    useCallback,
    useContext,
    useMemo,
} from 'react'

import { TableLoading } from '~/apps/admin/src/lib'
import { IsRemovingType } from '~/apps/admin/src/lib/models'

import {
    ChallengeDetailContext,
} from '../../contexts'
import {
    ChallengeDetailContextModel,
    MappingReviewAppeal,
    SubmissionInfo,
} from '../../models'
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
    const providedReviews = props.reviews
    const providedSubmitterReviews = props.submitterReviews
    const {
        challengeInfo,
        myResources,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const challengeSubmissions = challengeInfo?.submissions ?? []
    const myReviewerResourceIds = useMemo<Set<string>>(
        () => new Set(
            (myResources ?? [])
                .filter(resource => {
                    const roleName = (resource.roleName || '').toLowerCase()
                    return roleName.includes('reviewer') && !roleName.includes('iterative')
                })
                .map(resource => resource.id)
                .filter((id): id is string => typeof id === 'string' && id.trim().length > 0),
        ),
        [myResources],
    )
    const hasReviewerAssignment = useCallback(
        (submission: SubmissionInfo): boolean => {
            const resourceIds = myReviewerResourceIds
            const primaryResourceId = submission.review?.resourceId
            if (primaryResourceId && resourceIds.has(primaryResourceId)) {
                return true
            }

            if (Array.isArray(submission.reviews)) {
                for (const review of submission.reviews) {
                    const reviewResourceId = review.resourceId
                    if (reviewResourceId && resourceIds.has(reviewResourceId)) {
                        return true
                    }
                }
            }

            return resourceIds.size === 0 && Boolean(primaryResourceId)
        },
        [myReviewerResourceIds],
    )
    const resolvedReviews = useMemo(
        () => {
            if (providedReviews.length) {
                return providedReviews
            }

            if (!challengeSubmissions.length) {
                return providedReviews
            }

            const fallback = challengeSubmissions.filter(hasReviewerAssignment)
            return fallback.length ? fallback : providedReviews
        },
        [
            challengeSubmissions,
            hasReviewerAssignment,
            providedReviews,
        ],
    )
    const resolvedSubmitterReviews = useMemo(
        () => (providedSubmitterReviews.length
            ? providedSubmitterReviews
            : providedSubmitterReviews),
        [providedSubmitterReviews],
    )
    const filteredReviews = useMemo(
        () => {
            if (!resolvedReviews.length) {
                return resolvedReviews
            }

            const hasLatestFlag = hasIsLatestFlag(resolvedReviews)
            if (!hasLatestFlag) {
                return resolvedReviews
            }

            const latestOnly = resolvedReviews.filter(submission => submission.isLatest === true)
            return latestOnly.length ? latestOnly : resolvedReviews
        },
        [resolvedReviews],
    )
    const filteredSubmitterReviews = useMemo(
        () => {
            if (!resolvedSubmitterReviews.length) {
                return resolvedSubmitterReviews
            }

            const hasLatestFlag = hasIsLatestFlag(resolvedSubmitterReviews)
            if (!hasLatestFlag) {
                return resolvedSubmitterReviews
            }

            const latestOnly = resolvedSubmitterReviews.filter(submission => submission.isLatest === true)
            return latestOnly.length ? latestOnly : resolvedSubmitterReviews
        },
        [resolvedSubmitterReviews],
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
                datas={resolvedReviews}
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
