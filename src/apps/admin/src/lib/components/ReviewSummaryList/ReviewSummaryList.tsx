import { FC, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { EnvironmentConfig } from '~/config'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { Button, LinkButton, Table, type TableColumn } from '~/libs/ui'
import { Sort } from '~/apps/gamification-admin/src/game-lib/pagination'

import { Pagination } from '../common/Pagination'
import { useEventCallback } from '../../hooks'
import { ReviewFilterCriteria, ReviewSummary } from '../../models'
import { Paging } from '../../models/challenge-management/Pagination'

import { MobileListView } from './MobileListView'
import styles from './ReviewSummaryList.module.scss'

export interface ReviewListProps {
    reviews: ReviewSummary[]
    paging: Paging
    currentFilters: ReviewFilterCriteria
    onPageChange: (page: number) => void
    onToggleSort: (sort: Sort) => void
}

const Actions: FC<{
    review: ReviewSummary
    currentFilters: ReviewFilterCriteria
}> = props => {
    const navigate = useNavigate()
    const goToManageReviewer = useEventCallback(() => {
        navigate(`${props.review.legacyChallengeId}/manage-reviewer`, {
            state: { previousReviewSummaryListFilter: props.currentFilters },
        })
    })

    return (
        <div className={styles.rowActions}>
            <Button primary onClick={goToManageReviewer}>
                Manage Reviewers
            </Button>
        </div>
    )
}

const ChallengeTitle: FC<{
    review: ReviewSummary
}> = props => {
    const goToChallenge = useEventCallback(() => {
        window.location.href = `${EnvironmentConfig.ADMIN.CHALLENGE_URL}/${props.review.legacyChallengeId}`
    })

    return props.review.legacyChallengeId ? (
        <LinkButton onClick={goToChallenge} className={styles.challengeTitleLink}>
            {props.review.challengeName}
        </LinkButton>
    ) : (
        <span className={styles.challengeTitleText}>
            {props.review.challengeName}
        </span>
    )
}

const ReviewSummaryList: FC<ReviewListProps> = props => {
    const columns = useMemo<TableColumn<ReviewSummary>[]>(
        () => [
            // Hide the columns temporary, we do not have these data now
            // {
            //     label: 'Challenge type',
            //     propertyName: '',
            //     type: 'text',
            // },
            {
                label: 'Challenge Title',
                propertyName: 'challengeName',
                renderer: (review: ReviewSummary) => (
                    <ChallengeTitle review={review} />
                ),
                type: 'element',
            },
            {
                label: 'Legacy ID',
                propertyName: 'legacyChallengeId',
                type: 'text',
            },
            // {
            //     label: 'Current phase',
            //     propertyName: '',
            //     type: 'text',
            // },
            { label: 'Status', propertyName: 'challengeStatus', type: 'text' },
            // I think this column is important, and it exits in `admin-app`
            // but resp does not have it, so I just comment it here
            // {
            //     label: 'Submission End Date',
            //     propertyName: 'submissionEndDate',
            //     renderer: (review: ReviewSummary) => (
            //         // eslint-disable-next-line jsx-a11y/anchor-is-valid
            //         <div className={styles.submissionDate}>
            //           {review.submissionEndDate}
            //             {/* {format(
            //                 new Date(review.submissionEndDate),
            //                 'MMM dd, yyyy HH:mm'
            //             )} */}
            //         </div>
            //     ),
            //     type: 'element',
            // },
            {
                label: 'Open Review Opp',
                renderer: (review: ReviewSummary) => (
                    <div>{review.numberOfReviewerSpots - review.numberOfApprovedApplications}</div>
                ),
                type: 'element',
            },
            {
                label: 'Review Applications',
                propertyName: 'numberOfPendingApplications',
                type: 'number',
            },
            {
                label: '',
                renderer: (review: ReviewSummary) => (
                    <Actions
                        review={review}
                        currentFilters={props.currentFilters}
                    />
                ),
                type: 'action',
            },
        ],
        [], // eslint-disable-line react-hooks/exhaustive-deps -- missing dependency: props.currentFilters
    )

    const { width: screenWidth }: WindowSize = useWindowSize()
    return (
        <div className={styles.reviewSummaryList}>
            {screenWidth > 1279 && (
                <Table
                    columns={columns}
                    data={props.reviews}
                    initSort={{ direction: 'asc',
                        fieldName: '' }}
                    onToggleSort={props.onToggleSort}
                />
            )}
            {screenWidth <= 1279 && (
                <MobileListView properties={columns} data={props.reviews} />
            )}
            <Pagination
                page={props.paging.page}
                totalPages={props.paging.totalPages}
                onPageChange={props.onPageChange}
            />
        </div>
    )
}

export default ReviewSummaryList
