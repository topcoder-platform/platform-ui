import {
    FC,
    MutableRefObject,
    useCallback,
    useContext,
    useEffect,
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

interface PaginationVisibilityParams {
    hasError: boolean
    totalProjects: number
}

function canRenderPagination(params: PaginationVisibilityParams): boolean {
    return !params.hasError && params.totalProjects > 0
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
    onPageChange: (newPage: number) => void
    onPerPageChange: (newPerPage: number) => void
    onSort: (fieldName: string) => void
    page: number
    perPage: number
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

    const canCreateProject = isAdmin || isCopilot
    const canEditProjects = isAdmin || isCopilot

    const fetchParams: UseFetchProjectsListParams = {
        ...filters,
        page,
        perPage,
        sortBy,
        sortOrder,
    }

    const projectsResult: UseFetchProjectsListResult = useFetchProjectsList(fetchParams)

    const projectsErrorRef = useRef<string | undefined>()
    useErrorToast(projectsResult.error, projectsErrorRef)

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
    const shouldShowPagination = canRenderPagination({
        hasError: !!projectsResult.error,
        totalProjects,
    })

    return (
        <PageWrapper
            pageTitle='Projects'
            breadCrumb={[]}
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
                onPageChange: handlePageChange,
                onPerPageChange: handlePerPageChange,
                onSort: handleSort,
                page,
                perPage,
                projectsResult,
                shouldShowPagination,
                sortBy,
                sortOrder,
                totalProjects,
            })}
        </PageWrapper>
    )
}

export default ProjectsListPage
