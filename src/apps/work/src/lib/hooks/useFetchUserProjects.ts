import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'

import { PROJECTS_PAGE_SIZE } from '../constants'
import { ProjectSummary } from '../services'

import {
    useFetchProjectsList,
    UseFetchProjectsListResult,
} from './useFetchProjectsList'

export interface UseFetchUserProjectsResult {
    projects: ProjectSummary[]
    isLoading: boolean
    error: Error | undefined
    hasMore: boolean
    loadMore: () => void
}

export function useFetchUserProjects(searchKey?: string): UseFetchUserProjectsResult {
    const [page, setPage] = useState<number>(1)

    const normalizedSearchKey = useMemo(
        () => searchKey?.trim() || undefined,
        [searchKey],
    )

    useEffect(() => {
        setPage(1)
    }, [normalizedSearchKey])

    const result: UseFetchProjectsListResult = useFetchProjectsList({
        appendResults: true,
        keyword: normalizedSearchKey,
        page,
        perPage: PROJECTS_PAGE_SIZE,
    })

    const metadata = result.metadata || {
        page,
        perPage: PROJECTS_PAGE_SIZE,
        total: 0,
        totalPages: 0,
    }

    const hasMore = (metadata.page || 0) < (metadata.totalPages || 0)

    const loadMore = useCallback((): void => {
        if (result.isLoading || result.isValidating || !hasMore) {
            return
        }

        setPage(currentPage => currentPage + 1)
    }, [hasMore, result.isLoading, result.isValidating])

    return {
        error: result.error,
        hasMore,
        isLoading: result.isLoading,
        loadMore,
        projects: result.projects,
    }
}

export default useFetchUserProjects
