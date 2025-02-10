import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { LoadingSpinner, PageDivider, PageTitle } from '~/libs/ui'
import { useSearchParams } from 'react-router-dom'
import { ChallengeFilters, ChallengeList, PageContent, PageHeader } from '../../lib/components'
import { Challenge, ChallengeFilterCriteria, ChallengeStatus } from '../../lib/models'
import { searchChallenges } from '../../lib/services'
import { createChallengeQueryString, handleError, replaceBrowserUrlQuery } from '../../lib/utils'
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
      page: 1,
      perPage: 25,
      name: '',
      challengeId: '',
      legacyId: 0,
      type: null!,
      track: null!,
      status: ChallengeStatus.Active,
  })
    const [challenges, setChallenges] = useState<Array<Challenge>>([])
    const { search: doSearch, searching, searched, totalChallenges } = useSearch({ filterCriteria })

    const search = () => {
        doSearch()
            .then(data => {
                setChallenges(data)
            })
        updateBrowserUrl()
    }

    const qs = useInitialQueryState()
    const initFilters = useCallback(() => {
        if (qs) {
            const newFilters: ChallengeFilterCriteria = {
                ...filterCriteria,
                page: +(qs.page || filterCriteria.page),
                perPage: +(qs.perPage || filterCriteria.perPage),
                name: qs.name || filterCriteria.name,
                challengeId: qs.id || filterCriteria.challengeId,
                legacyId: +(qs.legacyId || filterCriteria.legacyId),
                type: qs.types?.[0] || filterCriteria.type,
                track: qs.tracks?.[0] || filterCriteria.track,
                status: (qs.status || filterCriteria.status) as ChallengeStatus,
            }
            setFilterCriteria(newFilters)
            setFiltersInited(true)
        }
    }, [qs])
    const updateBrowserUrl = () => {
        const s = createChallengeQueryString(filterCriteria)
        replaceBrowserUrlQuery(s)
    }

    const [filtersInited, setFiltersInited] = useState(false)
    useEffect(() => {
        initFilters()
    }, [initFilters])

    useEffect(() => {
        if (filtersInited) {
            search()
        }
    }, [filtersInited])

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
                    isSearchingOrInitializing={searching || !filtersInited}
                />
                <PageDivider />
                {searching && (
                    <div className={styles.loadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                )}
                {searched && challenges.length === 0 && <p className={styles.noRecordFound}> No record found. </p>}
                {searched && challenges.length !== 0 && (
                    <ChallengeList
                        challenges={challenges}
                        paging={{
                            page: filterCriteria.page,
                            perPage: filterCriteria.perPage,
                            totalPages: Math.ceil(totalChallenges / filterCriteria.perPage),
                        }}
                        currentFilter={filterCriteria}
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
    SEARCH_INIT: 'SEARCH_INIT' as const,
    SEARCH_DONE: 'SEARCH_DONE' as const,
    SEARCH_FAILED: 'SEARCH_FAILED' as const,
}

type SearchReducerAction =
  | {
      type: typeof SearchActionType.SEARCH_INIT | typeof SearchActionType.SEARCH_FAILED
    }
  | {
      type: typeof SearchActionType.SEARCH_DONE
      payload: {
        totalChallenges: number
      }
    }

const reducer = (previousState: SearchState, action: SearchReducerAction): SearchState => {
    const { type } = action

    switch (type) {
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

function useSearch({ filterCriteria }: { filterCriteria: ChallengeFilterCriteria }) {
    const [state, dispatch] = useReducer(reducer, {
        isLoading: false,
        searched: false,
        totalChallenges: 0,
    })

    const search = async () => {
        dispatch({ type: SearchActionType.SEARCH_INIT })
        try {
            const { data, total } = await searchChallenges(filterCriteria)
            dispatch({
                type: SearchActionType.SEARCH_DONE,
                payload: { totalChallenges: isNaN(total) ? (data.length ? 1 : 0) : total },
            })
            return data
        } catch (error) {
            dispatch({ type: SearchActionType.SEARCH_FAILED })
            handleError(error)
            return []
        }
    }

    return {
        searching: state.isLoading,
        searched: state.searched,
        totalChallenges: state.totalChallenges,
        search,
    }
}

/// /////////////////
// Query filter state
/// /////////////////

function useInitialQueryState() {
    const [searchParams] = useSearchParams()
    const page = searchParams.get('page')
    const perPage = searchParams.get('perPage')
    const name = searchParams.get('name')
    const id = searchParams.get('id')
    const legacyId = searchParams.get('legacyId')
    const types = searchParams.getAll('types[]')
    const tracks = searchParams.getAll('tracks[]')
    const status = searchParams.get('status')

    const [inited, setInited] = useState(false)
    useEffect(() => {
        setInited(true)
    }, [])

    const qs = useMemo(() => (inited ? { page, perPage, name, id, legacyId, types, tracks, status } : null), [inited])
    return qs
}

export default ChallengeManagementPage
