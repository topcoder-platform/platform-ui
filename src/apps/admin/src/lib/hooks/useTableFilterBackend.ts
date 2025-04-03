/**
 * Use To Manage Table Backend Filter
 */
import {
    Dispatch,
    SetStateAction,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react'

import { Sort } from '~/apps/gamification-admin/src/game-lib'

export interface useTableFilterBackendProps<T> {
    page: number
    setPage: Dispatch<SetStateAction<number>>
    setSort: Dispatch<SetStateAction<Sort | undefined>>
    sort: Sort | undefined
    setFilterCriteria: (criteria: T | undefined) => void
}

/**
 * Use to manage table filter
 * @param allDatas all table datas
 * @param defaultSort default sort
 * @param mappingSortField mapping from property field to sort field
 */
export function useTableFilterBackend<T>(
    searchDatas: (
        page: number,
        sort: Sort | undefined,
        filterCriteria: T | undefined,
        success: () => void,
        fail: () => void,
    ) => void,
    initFilter: T | undefined,
): useTableFilterBackendProps<T> {
    const [page, setPage] = useState(1)
    const [sort, setSort] = useState<Sort>()
    const fetchDataRef = useRef<{
        isLoading: boolean
        page: number
        filterCriteria: T | undefined
        sort: Sort | undefined
    }>({
        filterCriteria: initFilter,
        isLoading: false,
        page: 1,
        sort: undefined,
    })

    const doSearchDatas = useCallback(() => {
        if (fetchDataRef.current.isLoading) {
            return
        }

        fetchDataRef.current.isLoading = true
        searchDatas(
            fetchDataRef.current.page,
            fetchDataRef.current.sort,
            fetchDataRef.current.filterCriteria,
            () => {
                fetchDataRef.current.isLoading = false
            },
            () => {
                fetchDataRef.current.isLoading = false
            },
        )
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const setFilterCriteria = useCallback(
        (filterCriteria: T | undefined) => {
            fetchDataRef.current.filterCriteria = filterCriteria
            fetchDataRef.current.page = 1 // reset page when change filter
            fetchDataRef.current.sort = undefined // reset sort when change filter
            setSort(undefined)
            setPage(1)
            doSearchDatas()
        },
        [setSort, setPage, doSearchDatas],
    )

    useEffect(() => {
        fetchDataRef.current.page = 1 // reset page when change sort
        fetchDataRef.current.sort = sort
        setPage(1)
        doSearchDatas()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sort])

    useEffect(() => {
        fetchDataRef.current.page = page
        doSearchDatas()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page])

    return {
        page,
        setFilterCriteria,
        setPage,
        setSort,
        sort,
    }
}
