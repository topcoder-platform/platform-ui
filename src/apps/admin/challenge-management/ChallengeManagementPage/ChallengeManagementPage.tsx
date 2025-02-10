import {
    Dispatch,
    FC,
    SetStateAction,
    useCallback,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
} from 'react'
import { useSearchParams } from 'react-router-dom'

import { LoadingSpinner, PageDivider, PageTitle } from '~/libs/ui'
import { PaginatedResponse } from '~/libs/core'

import {
    ChallengeFilters,
    ChallengeList,
    PageContent,
    PageHeader,
} from '../../lib/components'
import {
    Challenge,
    ChallengeFilterCriteria,
    ChallengeStatus,
} from '../../lib/models'
import { searchChallenges } from '../../lib/services'
import {
    createChallengeQueryString,
    handleError,
    replaceBrowserUrlQuery,
} from '../../lib/utils'
import { useEventCallback } from '../../lib/hooks'

import styles from './ChallengeManagementPage.module.scss'

/**
 * Challenge Management page.
 */
export const ChallengeManagementPage: FC = () => {
    const pageTitle = 'v5 Challenge Management'
    const [filterCriteria, setFilterCriteria]: [
        ChallengeFilterCriteria,
        Dispatch<SetStateAction<ChallengeFilterCriteria>>,
    ] = useState<ChallengeFilterCriteria>({
        challengeId: '',
        legacyId: 0,
        name: '',
        page: 1,
        perPage: 25,
        status: ChallengeStatus.Active,
        track: null!, // eslint-disable-line @typescript-eslint/no-non-null-assertion, unicorn/no-null
        type: null!, // eslint-disable-line @typescript-eslint/no-non-null-assertion, unicorn/no-null
    })
    const [challenges, setChallenges]: [
        Array<Challenge>,
        Dispatch<SetStateAction<Array<Challenge>>>,
    ] = useState<Array<Challenge>>([])
    const {
        search: doSearch,
        searching,
        searched,
        totalChallenges,
    }: ReturnType<typeof useSearch> = useSearch({ filterCriteria })

    const updateBrowserUrl = (): void => {
        const s = createChallengeQueryString(filterCriteria)
        replaceBrowserUrlQuery(s)
    }

    const search = useEventCallback(() => {
        doSearch()
            .then(data => {
                setChallenges(data)
                window.scrollTo({ left: 0, top: 0 })
            })
        updateBrowserUrl()
    })

    // Init
    const [filtersInited, setFiltersInited] = useState(false)
    const qs = useInitialQueryState()
    const initFilters = useCallback(() => {
        if (qs) {
            const newFilters: ChallengeFilterCriteria = {
                ...filterCriteria,
                challengeId: qs.id || filterCriteria.challengeId,
                legacyId: +(qs.legacyId || filterCriteria.legacyId),
                name: qs.name || filterCriteria.name,
                page: +(qs.page || filterCriteria.page),
                perPage: +(qs.perPage || filterCriteria.perPage),
                status: (qs.status || filterCriteria.status) as ChallengeStatus,
                track: qs.tracks?.[0] || filterCriteria.track,
                type: qs.types?.[0] || filterCriteria.type,
            }
            setFilterCriteria(newFilters)
            setFiltersInited(true)
        }
    }, [qs]) // eslint-disable-line react-hooks/exhaustive-deps -- missing dependency: filterCriteria
    useEffect(() => {
        initFilters()
    }, [initFilters])
    useEffect(() => {
        if (filtersInited) {
            search()
        }
    }, [filtersInited]) // eslint-disable-line react-hooks/exhaustive-deps -- missing dependency: search

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

    // Reset
    const [resetEvent, setResetEvent] = useState(false)
    useEffect(() => {
        if (resetEvent) {
            search()
            setResetEvent(false)
        }
    }, [resetEvent]) // eslint-disable-line react-hooks/exhaustive-deps -- missing dependency: search

    const handleReset = useEventCallback(() => {
        previousPageChangeEvent.current = false
        setResetEvent(true)
    })
    const handlePageChange = useEventCallback((page: number) => {
        setFilterCriteria({ ...filterCriteria, page })
        setPageChangeEvent(true)
    })

    return (
        <>
            <PageTitle>{pageTitle}</PageTitle>
            <PageHeader>
                <h2>{pageTitle}</h2>
            </PageHeader>
            <PageContent>
                <ChallengeFilters
                    filterCriteria={filterCriteria}
                    onFilterCriteriaChange={setFilterCriteria}
                    onSearch={search}
                    disabled={searching || !filtersInited}
                    showResetButton={
                        previousPageChangeEvent.current
                        && searched
                        && challenges.length === 0
                    }
                    onReset={handleReset}
                />
                <PageDivider />
                {searching && (
                    <div className={styles.loadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                )}
                {searched && challenges.length === 0 && (
                    <p className={styles.noRecordFound}> No record found. </p>
                )}
                {searched && challenges.length !== 0 && (
                    <ChallengeList
                        challenges={challenges}
                        paging={{
                            page: filterCriteria.page,
                            totalPages: Math.ceil(
                                totalChallenges / filterCriteria.perPage,
                            ),
                        }}
                        currentFilters={filterCriteria}
                        onPageChange={handlePageChange}
                    />
                )}
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
    totalChallenges: number
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
              totalChallenges: number
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
                isLoading: true,
                searched: false,
                totalChallenges: 0,
            }
        }

        case SearchActionType.SEARCH_DONE: {
            return {
                ...previousState,
                isLoading: false,
                searched: true,
                totalChallenges: action.payload.totalChallenges,
            }
        }

        case SearchActionType.SEARCH_FAILED: {
            return {
                ...previousState,
                isLoading: false,
                totalChallenges: 0,
            }
        }

        default: {
            return previousState
        }
    }
}

function useSearch({
    filterCriteria,
}: {
    filterCriteria: ChallengeFilterCriteria
}): {
    search: () => Promise<Challenge[]>
    searched: boolean
    searching: boolean
    totalChallenges: number
} {
    const [state, dispatch] = useReducer(reducer, {
        isLoading: false,
        searched: false,
        totalChallenges: 0,
    })

    const search = useEventCallback(async () => {
        dispatch({ type: SearchActionType.SEARCH_INIT })
        try {
            const { data, total }: PaginatedResponse<Challenge[]>
                = await searchChallenges(filterCriteria)
            dispatch({
                payload: { totalChallenges: total },
                type: SearchActionType.SEARCH_DONE,
            })
            return data
        } catch (error) {
            dispatch({ type: SearchActionType.SEARCH_FAILED })
            handleError(error)
            return []
        }
    })

    return {
        search,
        searched: state.searched,
        searching: state.isLoading,
        totalChallenges: state.totalChallenges,
    }
}

/// /////////////////
// Query filter state
/// /////////////////

function useInitialQueryState():
    | {
          id: string | undefined
          legacyId: string | undefined
          name: string | undefined
          page: string | undefined
          perPage: string | undefined
          status: string | undefined
          tracks: string[] | undefined
          types: string[] | undefined
      }
    | undefined {
    const [searchParams] = useSearchParams()
    const page = searchParams.get('page') || undefined
    const perPage = searchParams.get('perPage') || undefined
    const name = searchParams.get('name') || undefined
    const id = searchParams.get('id') || undefined
    const legacyId = searchParams.get('legacyId') || undefined
    const types = searchParams.getAll('types[]') || undefined
    const tracks = searchParams.getAll('tracks[]') || undefined
    const status = searchParams.get('status') || undefined

    const [inited, setInited] = useState(false)
    useEffect(() => {
        setInited(true)
    }, [])

    const qs = useMemo(
        () => (inited
            ? { id, legacyId, name, page, perPage, status, tracks, types }
            : undefined),
        [inited], // eslint-disable-line react-hooks/exhaustive-deps, max-len -- missing dependencies: id, legacyId, name, page, perPage, status, tracks, types
    )
    return qs
}

export default ChallengeManagementPage
