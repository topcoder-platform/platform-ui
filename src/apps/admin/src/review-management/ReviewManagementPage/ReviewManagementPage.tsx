import {
    Dispatch,
    FC,
    SetStateAction,
    useCallback,
    useEffect,
    useReducer,
    useRef,
    useState,
} from 'react'

import { LoadingSpinner, PageTitle } from '~/libs/ui'
import { Sort } from '~/apps/admin/src/platform/gamification-admin/src/game-lib'

import {
    Display,
    PageContent,
    PageHeader,
    ReviewSummaryList,
} from '../../lib/components'
import { ReviewFilterCriteria, ReviewSummary } from '../../lib/models'
import { getReviewOpportunities } from '../../lib/services'
import { handleError } from '../../lib/utils'
import { useEventCallback } from '../../lib/hooks'

import styles from './ReviewManagementPage.module.scss'

/**
 * Challenge Management page.
 */
export const ReviewManagementPage: FC = () => {
    const pageTitle = 'Review Management'

    const [filterCriteria, setFilterCriteria]: [
        ReviewFilterCriteria,
        Dispatch<SetStateAction<ReviewFilterCriteria>>
    ] = useState<ReviewFilterCriteria>({
        order: 'desc',
        page: 1,
        perPage: 10,
        sortBy: '',
    })

    const [reviews, setReviews]: [
        Array<ReviewSummary>,
        Dispatch<SetStateAction<Array<ReviewSummary>>>
    ] = useState<Array<ReviewSummary>>([])

    const {
        search: doSearch,
        sortData: doSortData,
        searching,
        searched,
        totalReviews,
        totalPages,
    }: ReturnType<typeof useSearch> = useSearch({ filterCriteria })

    const search = useEventCallback(() => {
        doSearch()
            .then(data => {
                setReviews(data)
                window.scrollTo({ left: 0, top: 0 })
            })
    })

    const sortData = useEventCallback(() => {
        doSortData()
            .then(data => {
                setReviews(data)
                window.scrollTo({ left: 0, top: 0 })
            })
    })

    // Init
    const initFilters = useCallback(() => {
        search()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps -- missing dependency: filterCriteria

    useEffect(() => {
        initFilters()
    }, [initFilters])

    // Page change
    const [pageChangeEvent, setPageChangeEvent] = useState(false)
    const previousPageChangeEvent = useRef(false)
    useEffect(() => {
        if (pageChangeEvent) {
            search()
            setPageChangeEvent(false)
            previousPageChangeEvent.current = true
        }
    }, [pageChangeEvent]) // eslint-disable-line react-hooks/exhaustive-deps -- missing dependency: pageChangeEvent

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
            <PageTitle>{pageTitle}</PageTitle>
            <PageHeader>
                <h2>{pageTitle}</h2>
            </PageHeader>
            <PageContent>
                {searching && (
                    <div className={styles.loadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                )}
                {searched && reviews.length === 0 && (
                    <p className={styles.noRecordFound}> No record found. </p>
                )}
                <Display visible={searched && reviews.length !== 0}>
                    <ReviewSummaryList
                        reviews={reviews}
                        paging={{
                            page: filterCriteria.page,
                            totalPages: totalPages
                                || (totalReviews > 0
                                    ? Math.ceil(
                                        totalReviews
                                        / filterCriteria.perPage,
                                    )
                                    : 0),
                        }}
                        currentFilters={filterCriteria}
                        onPageChange={handlePageChange}
                        onToggleSort={handleSortChange}
                    />
                </Display>
            </PageContent>
        </>
    )
}

/// /////////////////
// Search reducer
/// ////////////////

type SearchState = {
    isLoading: boolean
    searched: boolean
    totalReviews: number
    allReviews: ReviewSummary[]
    totalPages: number
}

const SearchActionType = {
    SEARCH_DONE: 'SEARCH_DONE' as const,
    SEARCH_FAILED: 'SEARCH_FAILED' as const,
    SEARCH_INIT: 'SEARCH_INIT' as const,
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
              totalReviews: number
              allReviews: ReviewSummary[]
              totalPages: number
          }
      }

const reducer = (
    previousState: SearchState,
    action: SearchReducerAction,
): SearchState => {
    switch (action.type) {
        case SearchActionType.SEARCH_INIT: {
            return {
                ...previousState,
                allReviews: [],
                isLoading: true,
                searched: false,
                totalPages: 0,
                totalReviews: 0,
            }
        }

        case SearchActionType.SEARCH_DONE: {
            return {
                ...previousState,
                allReviews: action.payload.allReviews,
                isLoading: false,
                searched: true,
                totalPages: action.payload.totalPages,
                totalReviews: action.payload.totalReviews,
            }
        }

        case SearchActionType.SEARCH_FAILED: {
            return {
                ...previousState,
                allReviews: [],
                isLoading: false,
                totalPages: 0,
                totalReviews: 0,
            }
        }

        default: {
            return previousState
        }
    }
}

type GetReviewOpportunitiesResponse = Awaited<
    ReturnType<typeof getReviewOpportunities>
>

function getPageData(
    reviews: ReviewSummary[],
): ReviewSummary[] {
    return reviews
}

function useSearch({
    filterCriteria,
}: {
    filterCriteria: ReviewFilterCriteria
}): {
    search: () => Promise<ReviewSummary[]>
    sortData: () => Promise<ReviewSummary[]>
    searched: boolean
    searching: boolean
    totalReviews: number
    totalPages: number
} {
    const [state, dispatch] = useReducer(reducer, {
        allReviews: [],
        isLoading: false,
        searched: false,
        totalPages: 0,
        totalReviews: 0,
    })

    const fetchReviews = useEventCallback(async () => {
        dispatch({ type: SearchActionType.SEARCH_INIT })
        try {
            const response: GetReviewOpportunitiesResponse = await getReviewOpportunities(
                filterCriteria,
            )
            const { content, metadata }: GetReviewOpportunitiesResponse = response

            const total = metadata?.total ?? content.length
            const totalPages = metadata?.totalPages
                ?? (total > 0
                    ? Math.ceil(total / filterCriteria.perPage)
                    : 0)

            dispatch({
                payload: {
                    allReviews: content,
                    totalPages,
                    totalReviews: total,
                },
                type: SearchActionType.SEARCH_DONE,
            })
            return getPageData(content)
        } catch (error) {
            dispatch({ type: SearchActionType.SEARCH_FAILED })
            handleError(error)
            return []
        }
    })

    return {
        search: fetchReviews,
        searched: state.searched,
        searching: state.isLoading,
        sortData: fetchReviews,
        totalPages: state.totalPages,
        totalReviews: state.totalReviews,
    }
}

export default ReviewManagementPage
