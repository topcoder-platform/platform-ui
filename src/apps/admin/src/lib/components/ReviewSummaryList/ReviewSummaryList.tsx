import { FC, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

import { Sort } from '~/apps/admin/src/platform/gamification-admin/src/game-lib'
import { EnvironmentConfig } from '~/config'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { Button, colWidthType, LinkButton, Table, type TableColumn } from '~/libs/ui'

import { useEventCallback } from '../../hooks'
import { ReviewFilterCriteria, ReviewSummary } from '../../models'
import { Paging } from '../../models/challenge-management/Pagination'
import { Pagination } from '../common/Pagination'

import { MobileListView } from './MobileListView'
import styles from './ReviewSummaryList.module.scss'

export interface ReviewListProps {
    reviews: ReviewSummary[]
    paging: Paging
    currentFilters: ReviewFilterCriteria
    onPageChange: (page: number) => void
    onToggleSort: (sort: Sort | undefined) => void
}

const Actions: FC<{
    review: ReviewSummary
    currentFilters: ReviewFilterCriteria
}> = props => {
    const navigate = useNavigate()
    const targetId = props.review.challengeId || props.review.legacyChallengeId

    const goToManageReviewer = useEventCallback(() => {
        if (!targetId) {
            return
        }

        navigate(`${targetId}/manage-reviewer`, {
            state: { previousReviewSummaryListFilter: props.currentFilters },
        })
    })

    return (
        <div className={styles.rowActions}>
            <Button
                primary
                onClick={goToManageReviewer}
                disabled={!targetId}
            >
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

    const fullTitle = props.review.challengeName || ''
    const maxLen = 60
    const shortTitle = fullTitle.length > maxLen
        ? `${fullTitle.slice(0, maxLen)}…`
        : fullTitle

    return props.review.legacyChallengeId ? (
        <LinkButton
            onClick={goToChallenge}
            className={styles.challengeTitleLink}
            title={fullTitle}
        >
            {shortTitle}
        </LinkButton>
    ) : (
        <span className={styles.challengeTitleText} title={fullTitle}>
            {shortTitle}
        </span>
    )
}

const ReviewSummaryList: FC<ReviewListProps> = props => {
    const [colWidth, setColWidth] = useState<colWidthType>({})
    const columns = useMemo<TableColumn<ReviewSummary>[]>(
        () => [
            // Hide the columns temporary, we do not have these data now
            // {
            //     label: 'Challenge type',
            //     propertyName: '',
            //     type: 'text',
            // },
            {
                className: styles.challengeTitleColumn,
                columnId: 'challengeName',
                label: 'Challenge Title',
                propertyName: 'challengeName',
                renderer: (review: ReviewSummary) => (
                    <ChallengeTitle review={review} />
                ),
                type: 'element',
            },

            // {
            //     label: 'Current phase',
            //     propertyName: '',
            //     type: 'text',
            // },
            // Status column removed to prevent table overflow
            // I think this column is important, and it exits in `admin-app`
            // but resp does not have it, so I just comment it here
            {
                label: 'Review Start Date',
                propertyName: 'submissionEndDate',
                renderer: (review: ReviewSummary) => (
                    // eslint-disable-next-line jsx-a11y/anchor-is-valid
                    <div className={styles.submissionDate}>
                        {review.submissionEndDate
                            ? format(
                                new Date(review.submissionEndDate),
                                'MMM dd, yyyy HH:mm',
                            ) : 'N/A'}
                    </div>
                ),
                type: 'element',
            },
            {
                columnId: 'OpenReviewOpp',
                label: 'Open Review Opp',
                renderer: (review: ReviewSummary) => (
                    <div>
                        {Math.max(
                            review.numberOfReviewerSpots
                            - review.numberOfApprovedApplications,
                            0,
                        )}
                    </div>
                ),
                type: 'element',
            },
            {
                columnId: 'numberOfPendingApplications',
                label: 'Review Applications',
                propertyName: 'numberOfPendingApplications',
                type: 'number',
            },
            {
                columnId: 'action',
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
                    className={styles.desktopTable}
                    colWidth={colWidth}
                    setColWidth={setColWidth}
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
