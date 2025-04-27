import {
    Dispatch,
    FC,
    SetStateAction,
    useEffect,
    useReducer,
    useRef,
    useState,
} from 'react'
import { NavigateFunction, useNavigate, useParams } from 'react-router-dom'
import { sortBy } from 'lodash'

import { XIcon } from '@heroicons/react/solid'
import {
    Button,
    LinkButton,
    LoadingSpinner,
    PageTitle,
} from '~/libs/ui'
import { Sort } from '~/apps/gamification-admin/src/game-lib/pagination'

import {
    Display,
    PageContent,
    PageHeader,
    RejectPendingConfirmDialog,
    ReviewerList,
} from '../../lib/components'
import {
    Reviewer,
    ReviewFilterCriteria,
} from '../../lib/models'
import {
    approveApplication,
    getChallengeReviewers,
    getChallengeReviewOpportunities,
    rejectPending,
} from '../../lib/services'
import { handleError } from '../../lib/utils'
import { useEventCallback } from '../../lib/hooks'
import { rootRoute } from '../../config/routes.config'

import styles from './ManageReviewerPage.module.scss'

const BackToChallengeListButton: FC = () => (
    <LinkButton
        primary
        light
        to={`${rootRoute}/review-management`}
        size='lg'
    >
        Back
    </LinkButton>
)

/**
 * Manage Reviewers page.
 */
export const ManageReviewerPage: FC = () => {
    const pageTitle = 'Manage Reviewers For '
    const { challengeId = '' }: { challengeId?: string } = useParams<{
        challengeId: string
    }>()
    const navigate: NavigateFunction = useNavigate()
    const [filterCriteria, setFilterCriteria]: [
        ReviewFilterCriteria,
        Dispatch<SetStateAction<ReviewFilterCriteria>>
    ] = useState<ReviewFilterCriteria>({
        order: 'desc',
        page: 1,
        perPage: 10,
        sortBy: '',
    })

    const [reviewers, setReviewers]: [
        Array<Reviewer>,
        Dispatch<SetStateAction<Array<Reviewer>>>
    ] = useState<Array<Reviewer>>([])

    const {
        search: doSearch,
        newSearch: doNewSearch,
        sortData: doSortData,
        searching,
        searched,
        totalReviewers: totalUsers,
        openReviews,
    }: ReturnType<typeof useSearch> = useSearch({ challengeId, filterCriteria })

    const {
        reject: doReject,
        rejecting,
    }: ReturnType<typeof useReject> = useReject({ challengeId })
    const [openRejectPendingConfirmDialog, setOpenRejectPendingConfirmDialog]
        = useState(false)

    const { approve: doApprove, userId }: ReturnType<typeof useApprove>
        = useApprove({ challengeId })

    const search = useEventCallback((): void => {
        doSearch()
            .then(data => {
                setReviewers(data)
                window.scrollTo({ left: 0, top: 0 })
            })
    })

    const newSearch = useEventCallback((): void => {
        doNewSearch()
            .then(data => {
                setReviewers(data)
                window.scrollTo({ left: 0, top: 0 })
            })
    })

    const sortData = useEventCallback(() => {
        doSortData()
            .then(data => {
                setReviewers(data)
                window.scrollTo({ left: 0, top: 0 })
            })
    })

    const reject = useEventCallback((): void => {
        doReject()
            .then(() => {
                newSearch()
            })
    })

    const approve = useEventCallback((reviewer: Reviewer): void => {
        doApprove(reviewer)
            .then(() => {
                newSearch()
            })
    })

    const unapprove = useEventCallback((): void => {
        // how to get challenge Id?
        // Now we use one specific challenge id for testing
        const realChallengeId = 'c713e250-ecb4-4192-8717-d607ddda8db4'
        navigate(`${rootRoute}/challenge-management/${realChallengeId}/manage-user`)
    })

    // Init
    useEffect(() => {
        search()
    }, [challengeId]) // eslint-disable-line react-hooks/exhaustive-deps -- missing dependency: search

    // Page change
    const [pageChangeEvent, setPageChangeEvent] = useState(false)
    const previousPageChangeEvent = useRef(false)
    useEffect(() => {
        if (pageChangeEvent) {
            search()
            setPageChangeEvent(false)
            previousPageChangeEvent.current = true
        }
    }, [pageChangeEvent]) // eslint-disable-line react-hooks/exhaustive-deps -- missing dependency: search

    // Sort change
    const [sortChangeEvent, setSortChangeEvent] = useState(false)
    const previousSortChangeEvent = useRef(false)
    useEffect(() => {
        if (sortChangeEvent) {
            sortData()
            setSortChangeEvent(false)
            previousSortChangeEvent.current = true
        }
    }, [sortChangeEvent]) // eslint-disable-line react-hooks/exhaustive-deps -- missing dependency: sortChangeEvent

    const handleRejectPendingConfirmDialog = useEventCallback(() => {
        setOpenRejectPendingConfirmDialog(true)
    })

    const handlePageChange = useEventCallback((page: number) => {
        setFilterCriteria({ ...filterCriteria, page })
        setPageChangeEvent(true)
    })

    const handleSortChange = useEventCallback((sort: Sort) => {
        setFilterCriteria({
            ...filterCriteria,
            order: sort.direction,
            page: 1,
            sortBy: sort.fieldName,
        })
        setSortChangeEvent(true)
    })

    return (
        <>
            <PageTitle>{`${pageTitle} ${challengeId}`}</PageTitle>
            <PageHeader>
                <h2>{`${pageTitle} ${challengeId}`}</h2>
                <div className={styles.headerActions}>
                    <Button
                        primary
                        variant='danger'
                        onClick={handleRejectPendingConfirmDialog}
                        size='lg'
                        disabled={rejecting}
                    >
                        <XIcon className='icon icon-fill' />
                        {' '}
                        Reject Pending
                    </Button>
                    <BackToChallengeListButton />
                </div>
            </PageHeader>
            <PageContent>
                {searching && (
                    <div className={styles.loadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                )}
                {searched && reviewers.length === 0 && (
                    <p className={styles.noRecordFound}> No reviewers. </p>
                )}
                <Display visible={searched && reviewers.length !== 0}>
                    <ReviewerList
                        reviewers={reviewers}
                        openReviews={openReviews}
                        onApproveApplication={approve}
                        onUnapproveApplication={unapprove}
                        approvingReviewerId={userId}
                        paging={{
                            page: filterCriteria.page,
                            totalPages: Math.ceil(
                                totalUsers / filterCriteria.perPage,
                            ),
                        }}
                        onPageChange={handlePageChange}
                        onToggleSort={handleSortChange}
                    />
                </Display>
            </PageContent>
            {openRejectPendingConfirmDialog && (
                <RejectPendingConfirmDialog
                    open={openRejectPendingConfirmDialog}
                    setOpen={setOpenRejectPendingConfirmDialog}
                    reject={reject}
                />
            )}
        </>
    )
}

/// /////////////////
// Search reducer
/// /////////////////

const SearchActionType = {
    SEARCH_DONE: 'SEARCH_DONE' as const,
    SEARCH_FAILED: 'SEARCH_FAILED' as const,
    SEARCH_INIT: 'SEARCH_INIT' as const,
}

type SearchState = {
    isLoading: boolean
    searched: boolean
    totalReviewers: number
    openReviews: number
    allReviewers: Reviewer[]
}

type SearchReducerAction =
    | {
          type:
              | typeof SearchActionType.SEARCH_INIT
              | typeof SearchActionType.SEARCH_FAILED
      }
    | {
          type: typeof SearchActionType.SEARCH_DONE
          payload: {
              totalReviewers: number
              openReviews: number
              allReviewers: Reviewer[]
          }
      }

const searchReducer = (
    previousState: SearchState,
    action: SearchReducerAction,
): SearchState => {
    switch (action.type) {
        case SearchActionType.SEARCH_INIT: {
            return {
                ...previousState,
                allReviewers: [],
                isLoading: true,
                openReviews: 0,
                searched: false,
                totalReviewers: 0,
            }
        }

        case SearchActionType.SEARCH_DONE: {
            return {
                ...previousState,
                allReviewers: action.payload.allReviewers,
                isLoading: false,
                openReviews: action.payload.openReviews,
                searched: true,
                totalReviewers: action.payload.totalReviewers,
            }
        }

        case SearchActionType.SEARCH_FAILED: {
            return {
                ...previousState,
                isLoading: false,
            }
        }

        default: {
            return previousState
        }
    }
}

function getPageData(
    reviewers: Reviewer[],
    filterCriteria: ReviewFilterCriteria,
): Reviewer[] {
    const total = reviewers.length
    const startIndex = (filterCriteria.page - 1) * filterCriteria.perPage
    const endIndex = Math.min(startIndex + filterCriteria.perPage, total)
    return reviewers.slice(startIndex, endIndex)
}

function useSearch({
    challengeId,
    filterCriteria,
}: {
    challengeId: string
    filterCriteria: ReviewFilterCriteria
}): {
    search: () => Promise<Reviewer[]>
    newSearch: () => Promise<Reviewer[]>
    sortData: () => Promise<Reviewer[]>
    searched: boolean
    searching: boolean
    totalReviewers: number
    openReviews: number
} {
    const [state, dispatch] = useReducer(searchReducer, {
        allReviewers: [],
        isLoading: false,
        openReviews: 0,
        searched: false,
        totalReviewers: 0,
    })

    const sortData = useEventCallback(async (data?: Reviewer[]) => {
        const toSortData = data || state.allReviewers
        let sortedList = []

        if (filterCriteria.sortBy === 'applicationDate') {
            sortedList = sortBy(
                toSortData,
                item => new Date(item.applicationDate),
            )
        } else {
            sortedList = sortBy(toSortData, filterCriteria.sortBy)
        }

        if (filterCriteria.order === 'desc') {
            sortedList = sortedList.reverse()
        }

        if (data) {
            return sortedList
        }

        dispatch({
            payload: {
                allReviewers: sortedList,
                openReviews: state.openReviews,
                totalReviewers: sortedList.length,
            },
            type: SearchActionType.SEARCH_DONE,
        })

        return getPageData(sortedList, filterCriteria)
    })

    const search = useEventCallback(async (newSearch?: boolean): Promise<Reviewer[]> => {
        // If api search has done, just get page data from last api response
        if (state.searched && !newSearch) {
            return getPageData(state.allReviewers, filterCriteria)
        }

        dispatch({ type: SearchActionType.SEARCH_INIT })
        try {
            const data = await getChallengeReviewers(challengeId)
            const reviewOpportunity = await getChallengeReviewOpportunities(
                challengeId,
            )

            dispatch({
                payload: {
                    allReviewers: data,
                    openReviews: reviewOpportunity?.openPositions || 0,
                    totalReviewers: data.length,
                },
                type: SearchActionType.SEARCH_DONE,
            })
            return getPageData(data, filterCriteria)
        } catch (error) {
            dispatch({ type: SearchActionType.SEARCH_FAILED })
            handleError(error)
            return []
        }

    })

    const newSearch = useEventCallback(async (): Promise<Reviewer[]> => search(true))

    return {
        newSearch,
        openReviews: state.openReviews,
        search,
        searched: state.searched,
        searching: state.isLoading,
        sortData,
        totalReviewers: state.totalReviewers,
    }
}

/// /////////////////
// Reject reducer
/// /////////////////

const RejectActionType = {
    REJECT_DONE: 'REJECT_DONE' as const,
    REJECT_FAILED: 'REJECT_FAILED' as const,
    REJECT_INIT: 'REJECT_INIT' as const,
}

type RemoveActionType = {
    type:
        | typeof RejectActionType.REJECT_INIT
        | typeof RejectActionType.REJECT_FAILED
        | typeof RejectActionType.REJECT_DONE
}

type RejectState = {
    isRejecting: boolean
    rejected: boolean
}

const rejectReducer = (
    previousState: RejectState,
    action: RemoveActionType,
): RejectState => {
    switch (action.type) {
        case RejectActionType.REJECT_INIT: {
            return {
                ...previousState,
                isRejecting: true,
                rejected: false,
            }
        }

        case RejectActionType.REJECT_DONE: {
            return {
                ...previousState,
                isRejecting: false,
                rejected: true,
            }
        }

        case RejectActionType.REJECT_FAILED: {
            return {
                ...previousState,
                isRejecting: false,
            }
        }

        default: {
            return previousState
        }
    }
}

function useReject({ challengeId }: { challengeId: string }): {
    reject: () => Promise<boolean>
    rejected: boolean
    rejecting: boolean
} {
    const [state, dispatch] = useReducer(rejectReducer, {
        isRejecting: false,
        rejected: false,
    })

    const reject = useEventCallback(async (): Promise<boolean> => {
        dispatch({ type: RejectActionType.REJECT_INIT })

        try {
            await rejectPending(challengeId)
            dispatch({ type: RejectActionType.REJECT_DONE })
            return true
        } catch (error) {
            dispatch({ type: RejectActionType.REJECT_FAILED })
            handleError(error)
            return false
        }
    })

    return {
        reject,
        rejected: state.rejected,
        rejecting: state.isRejecting,
    }
}

/// /////////////////
// Approve reducer
/// /////////////////

const ApproveActionType = {
    APPROVE_DONE: 'APPROVE_DONE' as const,
    APPROVE_FAILED: 'APPROVE_FAILED' as const,
    APPROVE_INIT: 'APPROVE_INIT' as const,
}

type ApproveActionType =
    | {
          type: // | typeof ApproveActionType.APPROVE_INIT
            | typeof ApproveActionType.APPROVE_FAILED
            | typeof ApproveActionType.APPROVE_DONE
      }
    | {
          type: typeof ApproveActionType.APPROVE_INIT
          payload: {
              userId: number
          }
      }

type ApproveState = {
    isApproving: boolean
    userId: number
}

const approveReducer = (
    previousState: ApproveState,
    action: ApproveActionType,
): ApproveState => {
    switch (action.type) {
        case ApproveActionType.APPROVE_INIT: {
            return {
                ...previousState,
                isApproving: true,
                userId: action.payload.userId,
            }
        }

        case ApproveActionType.APPROVE_DONE: {
            return {
                ...previousState,
                isApproving: false,
                userId: 0,
            }
        }

        case ApproveActionType.APPROVE_FAILED: {
            return {
                ...previousState,
                isApproving: false,
                userId: 0,
            }
        }

        default: {
            return previousState
        }
    }
}

function useApprove({ challengeId }: { challengeId: string }): {
    approve: (reviewer: Reviewer) => Promise<boolean>
    approving: boolean
    userId: number
} {
    const [state, dispatch] = useReducer(approveReducer, {
        isApproving: false,
        userId: 0,
    })

    const approve = useEventCallback(
        async (reviewer: Reviewer): Promise<boolean> => {
            dispatch({
                payload: { userId: reviewer.userId },
                type: ApproveActionType.APPROVE_INIT,
            })

            try {
                await approveApplication(challengeId, {
                    applicationRoleId: reviewer.applicationRoleId,
                    reviewAuctionId: reviewer.reviewAuctionId,
                    userId: reviewer.userId,
                })
                dispatch({ type: ApproveActionType.APPROVE_DONE })
                return true
            } catch (error) {
                dispatch({ type: ApproveActionType.APPROVE_FAILED })
                handleError(error)
                return false
            }
        },
    )

    return {
        approve,
        approving: state.isApproving,
        userId: state.userId,
    }
}

export default ManageReviewerPage
