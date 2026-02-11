import {
    FC,
    MutableRefObject,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'

import { TableLoading } from '~/apps/admin/src/lib'
import { PageWrapper } from '~/apps/review/src/lib'
import { Button } from '~/libs/ui'

import {
    Pagination,
    ProjectsFilter,
    ProjectsTable,
} from '../../../lib/components'
import {
    PROJECTS_PAGE_SIZE,
} from '../../../lib/constants'
import {
    WorkAppContext,
} from '../../../lib/contexts'
import {
    useFetchProjectsList,
    UseFetchProjectsListParams,
    UseFetchProjectsListResult,
} from '../../../lib/hooks'
import {
    ProjectFilters,
    WorkAppContextModel,
} from '../../../lib/models'
import styles from '../../../lib/components/ProjectsListPage/ProjectsListPage.module.scss'

const DEFAULT_FILTERS: ProjectFilters = {
    keyword: undefined,
    memberOnly: undefined,
    status: undefined,
}

interface ListEndObserverParams {
    canLoadMorePages: boolean
    hasError: boolean
    isLoading: boolean
    isValidating: boolean
    supportsInfiniteScroll: boolean
    targetElement: HTMLDivElement | null
}

function canObserveListEnd(params: ListEndObserverParams): params is ListEndObserverParams & {
    targetElement: HTMLDivElement
} {
    return params.supportsInfiniteScroll
        && !!params.targetElement
        && !params.isLoading
        && !params.isValidating
        && params.canLoadMorePages
        && !params.hasError
}

function canRenderPagination(hasError: boolean, totalProjects: number): boolean {
    return !hasError && totalProjects > 0
}

function supportsIntersectionObserver(): boolean {
    return typeof window !== 'undefined'
        && 'IntersectionObserver' in window
}

function useErrorToast(
    error: Error | undefined,
    messageRef: MutableRefObject<string | undefined>,
): void {
    useEffect(() => {
        const message = error?.message
        if (message && messageRef.current !== message) {
            messageRef.current = message
            toast.error(message)
        }
    }, [error, messageRef])
}

interface RenderProjectsContentParams {
    canEditProjects: boolean
    projectsResult: UseFetchProjectsListResult
    listEndRef: MutableRefObject<HTMLDivElement | null>
    onPageChange: (newPage: number) => void
    onPerPageChange: (newPerPage: number) => void
    onSort: (fieldName: string) => void
    page: number
    perPage: number
    shouldShowInfiniteLoading: boolean
    shouldShowInfiniteSentinel: boolean
    shouldShowPagination: boolean
    sortBy: string
    sortOrder: 'asc' | 'desc'
    totalProjects: number
}

function renderProjectsContent(params: RenderProjectsContentParams): JSX.Element {
    if (params.projectsResult.isLoading) {
        return <TableLoading />
    }

    return (
        <>
            <ProjectsTable
                canEditProjects={params.canEditProjects}
                projects={params.projectsResult.projects}
                isLoading={params.projectsResult.isValidating && params.projectsResult.projects.length === 0}
                sortBy={params.sortBy}
                sortOrder={params.sortOrder}
                onSort={params.onSort}
            />
            {params.shouldShowInfiniteSentinel
                ? (
                    <>
                        <div ref={params.listEndRef} className={styles.scrollSentinel} />
                        {params.shouldShowInfiniteLoading
                            ? <div className={styles.loadingMore}>Loading more projects...</div>
                            : undefined}
                    </>
                )
                : undefined}
            {params.shouldShowPagination
                ? (
                    <Pagination
                        page={params.projectsResult.metadata.page ?? params.page}
                        perPage={params.projectsResult.metadata.perPage ?? params.perPage}
                        total={params.totalProjects}
                        itemLabel='projects'
                        onPageChange={params.onPageChange}
                        onPerPageChange={params.onPerPageChange}
                    />
                )
                : undefined}
        </>
    )
}

export const ProjectsListPage: FC = () => {
    const {
        isAdmin,
        isCopilot,
        isManager,
    }: WorkAppContextModel = useContext(WorkAppContext)

    const [filters, setFilters] = useState<ProjectFilters>(DEFAULT_FILTERS)
    const [page, setPage] = useState<number>(1)
    const [perPage, setPerPage] = useState<number>(PROJECTS_PAGE_SIZE)
    const [sortBy, setSortBy] = useState<string>('lastActivityAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const listEndRef = useRef<HTMLDivElement | null>(null)

    const supportsInfiniteScroll = supportsIntersectionObserver()
    const canCreateProject = isAdmin || isCopilot
    const canEditProjects = isAdmin || isCopilot

    const fetchParams: UseFetchProjectsListParams = {
        appendResults: supportsInfiniteScroll,
        ...filters,
        page,
        perPage,
        sortBy,
        sortOrder,
    }

    const projectsResult: UseFetchProjectsListResult = useFetchProjectsList(fetchParams)

    const projectsErrorRef = useRef<string | undefined>()
    useErrorToast(projectsResult.error, projectsErrorRef)

    const breadCrumb = useMemo(
        () => [{
            index: 1,
            label: 'Projects',
        }],
        [],
    )

    const handleFiltersChange = useCallback((newFilters: ProjectFilters) => {
        setFilters(newFilters)
        setPage(1)
    }, [])

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage)
    }, [])

    const handlePerPageChange = useCallback((newPerPage: number) => {
        setPerPage(newPerPage)
        setPage(1)
    }, [])

    const handleSort = useCallback((fieldName: string) => {
        setPage(1)

        if (fieldName === sortBy) {
            setSortOrder(current => (current === 'asc' ? 'desc' : 'asc'))
            return
        }

        setSortBy(fieldName)
        setSortOrder('desc')
    }, [sortBy])

    const handleRetry = useCallback(() => {
        projectsResult.mutate()
            .catch(() => undefined)
    }, [projectsResult])

    const totalProjects = projectsResult.metadata.total ?? 0
    const currentPage = projectsResult.metadata.page ?? page
    const totalPages = projectsResult.metadata.totalPages ?? 0
    const canLoadMorePages = currentPage < totalPages
    const shouldShowPagination = canRenderPagination(!!projectsResult.error, totalProjects)
    const shouldShowInfiniteSentinel = supportsInfiniteScroll && shouldShowPagination
    const shouldShowInfiniteLoading = shouldShowInfiniteSentinel
        && projectsResult.isValidating
        && projectsResult.projects.length > 0

    useEffect(() => {
        const listEndElement = listEndRef.current
        const observerParams: ListEndObserverParams = {
            canLoadMorePages,
            hasError: !!projectsResult.error,
            isLoading: projectsResult.isLoading,
            isValidating: projectsResult.isValidating,
            supportsInfiniteScroll,
            targetElement: listEndElement,
        }

        if (!canObserveListEnd(observerParams)) {
            return undefined
        }

        const observer = new IntersectionObserver(
            entries => {
                const [entry] = entries

                if (!entry?.isIntersecting) {
                    return
                }

                setPage(current => (
                    current < totalPages
                        ? current + 1
                        : current
                ))
            },
            {
                rootMargin: '200px 0px',
            },
        )

        observer.observe(observerParams.targetElement)

        return () => {
            observer.disconnect()
        }
    }, [
        canLoadMorePages,
        projectsResult.error,
        projectsResult.isLoading,
        projectsResult.isValidating,
        supportsInfiniteScroll,
        totalPages,
    ])

    return (
        <PageWrapper
            pageTitle='Projects'
            breadCrumb={breadCrumb}
            rightHeader={canCreateProject
                ? (
                    <Link to='/projects/new' className={styles.newProjectButton}>
                        <Button
                            primary
                            size='lg'
                            label='New Project'
                        />
                    </Link>
                )
                : undefined}
        >
            <div className={styles.totalProjects}>
                {totalProjects}
                {' '}
                projects
            </div>

            <ProjectsFilter
                filters={filters}
                onFiltersChange={handleFiltersChange}
                isManager={isManager}
            />

            {projectsResult.error && (
                <div className={styles.errorBanner}>
                    <span>{projectsResult.error.message}</span>
                    <Button
                        secondary
                        size='lg'
                        label='Retry'
                        onClick={handleRetry}
                    />
                </div>
            )}

            {renderProjectsContent({
                canEditProjects,
                listEndRef,
                onPageChange: handlePageChange,
                onPerPageChange: handlePerPageChange,
                onSort: handleSort,
                page,
                perPage,
                projectsResult,
                shouldShowInfiniteLoading,
                shouldShowInfiniteSentinel,
                shouldShowPagination,
                sortBy,
                sortOrder,
                totalProjects,
            })}
        </PageWrapper>
    )
}

export default ProjectsListPage
