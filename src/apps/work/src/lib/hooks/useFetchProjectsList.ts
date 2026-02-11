import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import useSWR, { KeyedMutator, SWRResponse } from 'swr'

import {
    PROJECTS_PAGE_SIZE,
} from '../constants'
import {
    PaginationModel,
} from '../models'
import {
    fetchProjectsList,
    FetchProjectsListParams,
    FetchProjectsListResponse,
    ProjectSummary,
} from '../services'

export interface UseFetchProjectsListParams extends FetchProjectsListParams {
    appendResults?: boolean
}

export interface UseFetchProjectsListResult {
    projects: ProjectSummary[]
    metadata: PaginationModel
    isLoading: boolean
    isValidating: boolean
    error: Error | undefined
    mutate: KeyedMutator<FetchProjectsListResponse>
}

export function useFetchProjectsList(
    {
        appendResults = false,
        keyword,
        memberOnly,
        page = 1,
        perPage = PROJECTS_PAGE_SIZE,
        sortBy = 'lastActivityAt',
        sortOrder = 'desc',
        status,
    }: UseFetchProjectsListParams,
): UseFetchProjectsListResult {
    const [aggregatedProjects, setAggregatedProjects] = useState<ProjectSummary[]>([])
    const [aggregatedMetadata, setAggregatedMetadata] = useState<PaginationModel>({
        page,
        perPage,
        total: 0,
        totalPages: 0,
    })
    const previousRequestRef = useRef<{
        appendKey: string
        page: number
    } | undefined>(undefined)

    const requestParams = useMemo<FetchProjectsListParams>(
        () => ({
            keyword,
            memberOnly,
            page,
            perPage,
            sortBy,
            sortOrder,
            status,
        }),
        [keyword, memberOnly, page, perPage, sortBy, sortOrder, status],
    )

    const statusKey = useMemo(
        () => {
            if (!status) {
                return ''
            }

            return Array.isArray(status)
                ? status.join(',')
                : status
        },
        [status],
    )

    const appendKey = useMemo(
        () => [
            keyword || '',
            String(memberOnly ?? ''),
            String(perPage),
            sortBy || '',
            sortOrder || '',
            statusKey,
        ]
            .join('|'),
        [keyword, memberOnly, perPage, sortBy, sortOrder, statusKey],
    )

    const swrKey = useMemo(
        () => [
            'work/projects-list',
            keyword || '',
            statusKey,
            String(memberOnly ?? ''),
            String(page),
            String(perPage),
            sortBy || '',
            sortOrder || '',
        ],
        [keyword, memberOnly, page, perPage, sortBy, sortOrder, statusKey],
    )

    const {
        data,
        error,
        isValidating,
        mutate,
    }: SWRResponse<FetchProjectsListResponse, Error>
        = useSWR<FetchProjectsListResponse, Error>(
            swrKey,
            () => fetchProjectsList(requestParams),
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    useEffect(() => {
        if (!appendResults || !data) {
            return
        }

        const previousRequest = previousRequestRef.current
        const hasSameQuery = !!previousRequest && previousRequest.appendKey === appendKey
        const isSequentialPage = hasSameQuery && page === previousRequest.page + 1
        const isSamePageRefresh = hasSameQuery && page === previousRequest.page

        if (!previousRequest || !hasSameQuery || page <= 1) {
            setAggregatedProjects(data.projects || [])
        } else if (isSequentialPage) {
            setAggregatedProjects(current => {
                const existingIds = new Set(current.map(project => String(project.id)))
                const nextPageProjects = (data.projects || [])
                    .filter(project => !existingIds.has(String(project.id)))

                return [
                    ...current,
                    ...nextPageProjects,
                ]
            })
        } else if (isSamePageRefresh) {
            setAggregatedProjects(current => {
                const existingIds = new Set(current.map(project => String(project.id)))
                const refreshedProjects = (data.projects || [])
                    .filter(project => !existingIds.has(String(project.id)))

                if (!refreshedProjects.length) {
                    return current
                }

                return [
                    ...current,
                    ...refreshedProjects,
                ]
            })
        } else {
            setAggregatedProjects(data.projects || [])
        }

        setAggregatedMetadata(data.metadata || {
            page,
            perPage,
            total: 0,
            totalPages: 0,
        })

        previousRequestRef.current = {
            appendKey,
            page,
        }
    }, [appendKey, appendResults, data, page, perPage])

    const projects = appendResults
        ? aggregatedProjects
        : (data?.projects || [])

    const metadata = appendResults
        ? aggregatedMetadata
        : (data?.metadata || {
            page,
            perPage,
            total: 0,
            totalPages: 0,
        })

    return {
        error,
        isLoading: !data && !error,
        isValidating,
        metadata,
        mutate,
        projects,
    }
}
