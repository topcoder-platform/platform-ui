import { FC, useMemo } from 'react'
import { format } from 'date-fns'

import { CheckIcon } from '@heroicons/react/solid'
import { useWindowSize, WindowSize } from '~/libs/shared'
import {
    Button,
    LinkButton,
    LoadingSpinner,
    Table,
    type TableColumn,
} from '~/libs/ui'
import { Sort } from '~/apps/admin/src/platform/gamification-admin/src/game-lib'

import { Reviewer } from '../../models'
import { useEventCallback } from '../../hooks'
import { Paging } from '../../models/challenge-management/Pagination'
import { Pagination } from '../common/Pagination'

import { MobileListView } from './MobileListView'
import styles from './ReviewerList.module.scss'

export interface ReviewerListProps {
    reviewers: Reviewer[]
    openReviews: number
    paging: Paging
    approvingReviewerId: number
    onPageChange: (page: number) => void
    onApproveApplication: (reviewer: Reviewer) => void
    onToggleSort: (sort: Sort) => void
}

const ApproveButton: FC<{
    reviewer: Reviewer
    openReviews: number
    approvingReviewerId: number
    onApproveApplication: ReviewerListProps['onApproveApplication']
}> = props => {
    const handleApprove = useEventCallback((): void => {
        props.onApproveApplication(props.reviewer)
    })

    const isApproving = props.approvingReviewerId === props.reviewer.userId
    const isOtherApproving = props.approvingReviewerId > 0
    const hideApproveButton
        = props.openReviews < 1 || props.reviewer.applicationStatus !== 'Pending'

    return (
        <>
            {isApproving ? (
                <LoadingSpinner
                    inline
                    className={styles.approvingLoadingSpinner}
                />
            ) : (
                !hideApproveButton && (
                    <Button
                        primary
                        onClick={handleApprove}
                        disabled={
                            isOtherApproving
                            || props.reviewer.applicationStatus === 'Approved'
                        }
                    >
                        <CheckIcon className='icon icon-fill' />
                        {' '}
                        Assign Reviewer
                    </Button>
                )
            )}
        </>
    )
}

const ReviewerHandle: FC<{
    reviewer: Reviewer
}> = props => {
    const goToHandleUrl = useEventCallback(() => {
        window.location.href = `https://profiles.topcoder.com/${props.reviewer.handle}`
    })

    return (
        <LinkButton onClick={goToHandleUrl} className={styles.reviewerHandle}>
            {props.reviewer.handle}
        </LinkButton>
    )
}

const ReviewerMail: FC<{
    reviewer: Reviewer
}> = props => {
    const mailTo = useEventCallback(() => {
        window.open(`mailto:${props.reviewer.emailAddress}`, '_blank')
    })

    return (
        <LinkButton onClick={mailTo} className={styles.reviewerEmail}>
            {props.reviewer.emailAddress}
        </LinkButton>
    )
}

const Actions: FC<{
    reviewer: Reviewer
    openReviews: number
    approvingReviewerId: number
    onApproveApplication: ReviewerListProps['onApproveApplication']
}> = props => (
    <div className={styles.rowActions}>
        <ApproveButton
            reviewer={props.reviewer}
            openReviews={props.openReviews}
            approvingReviewerId={props.approvingReviewerId}
            onApproveApplication={props.onApproveApplication}
        />
    </div>
)

const ReviewerList: FC<ReviewerListProps> = props => {
    const columns = useMemo<TableColumn<Reviewer>[]>(
        () => [
            {
                label: 'Reviewer',
                propertyName: 'handle',
                renderer: (reviewer: Reviewer) => (
                    <ReviewerHandle reviewer={reviewer} />
                ),
                type: 'element',
            },
            {
                label: 'Email',
                propertyName: 'emailAddress',
                renderer: (reviewer: Reviewer) => (
                    <ReviewerMail reviewer={reviewer} />
                ),
                type: 'element',
            },
            {
                label: 'Application Status',
                propertyName: 'applicationStatus',
                type: 'text',
            },
            {
                label: 'Received Date',
                propertyName: 'applicationDate',
                renderer: (reviewer: Reviewer) => (
                    // eslint-disable-next-line jsx-a11y/anchor-is-valid
                    <div className={styles.applicationDate}>
                        {format(
                            new Date(reviewer.applicationDate),
                            'MMM dd, yyyy HH:mm',
                        )}
                    </div>
                ),
                type: 'element',
            },
            {
                label: 'Open Reviews',
                propertyName: '',
                renderer: (reviewer: Reviewer) => (
                    // eslint-disable-next-line jsx-a11y/anchor-is-valid
                    <div className={styles.openReviews}>
                        {reviewer.currentNumberOfReviewPositions}
                    </div>
                ),
                type: 'element',
            },
            {
                label: 'Latest Completed Reviews',
                propertyName: 'reviewsInPast60Days',
                type: 'number',
            },
            // Hide the columns temporary, we do not have these data now
            // { label: 'Matching Skills', propertyName: '', type: 'text' },
            {
                label: '',
                renderer: (reviewer: Reviewer) => (
                    <Actions
                        reviewer={reviewer}
                        openReviews={props.openReviews}
                        approvingReviewerId={props.approvingReviewerId}
                        onApproveApplication={props.onApproveApplication}
                    />
                ),
                type: 'action',
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [props.openReviews, props.approvingReviewerId],
    )

    const { width: screenWidth }: WindowSize = useWindowSize()
    return (
        <div className={styles.reviewerList}>
            {screenWidth > 984 && (
                <Table
                    columns={columns}
                    data={props.reviewers}
                    initSort={{ direction: 'asc', fieldName: '' }}
                    onToggleSort={props.onToggleSort}
                    className={styles.desktopTable}
                />
            )}
            {screenWidth <= 984 && (
                <MobileListView properties={columns} data={props.reviewers} />
            )}
            <Pagination
                page={props.paging.page}
                totalPages={props.paging.totalPages}
                onPageChange={props.onPageChange}
            />
        </div>
    )
}

export default ReviewerList
