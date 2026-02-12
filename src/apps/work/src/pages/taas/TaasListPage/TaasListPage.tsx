import {
    FC,
    useCallback,
    useContext,
    useState,
} from 'react'
import { Link } from 'react-router-dom'

import { PageWrapper } from '~/apps/review/src/lib'
import { Button } from '~/libs/ui'

import {
    LoadingSpinner,
    Pagination,
    TaasProjectCard,
    TaasProjectsFilter,
} from '../../../lib/components'
import {
    TAAS_PAGE_SIZE,
} from '../../../lib/constants'
import {
    WorkAppContext,
} from '../../../lib/contexts'
import {
    useFetchTaasProjects,
} from '../../../lib/hooks'
import {
    ProjectFilters,
    WorkAppContextModel,
} from '../../../lib/models'
import {
    canCreateTaasProject,
    canEditTaasProject,
} from '../../../lib/utils'

import styles from './TaasListPage.module.scss'

const DEFAULT_FILTERS: ProjectFilters = {
    keyword: undefined,
    memberOnly: undefined,
    status: undefined,
}

export const TaasListPage: FC = () => {
    const {
        isManager,
        userRoles,
    }: WorkAppContextModel = useContext(WorkAppContext)

    const [filters, setFilters] = useState<ProjectFilters>(DEFAULT_FILTERS)
    const [page, setPage] = useState<number>(1)
    const [perPage, setPerPage] = useState<number>(TAAS_PAGE_SIZE)

    const canCreateProject = canCreateTaasProject(userRoles)
    const canEditProject = canEditTaasProject(userRoles)

    const taasProjectsResult = useFetchTaasProjects({
        keyword: filters.keyword,
        memberOnly: filters.memberOnly,
        page,
        perPage,
        status: filters.status,
    })

    const metadata = taasProjectsResult.data?.metadata || {
        page,
        perPage,
        total: 0,
        totalPages: 0,
    }
    const projects = taasProjectsResult.data?.projects || []
    const totalProjects = metadata.total || 0

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

    const handleRetry = useCallback(() => {
        taasProjectsResult.mutate()
            .catch(() => undefined)
    }, [taasProjectsResult])

    return (
        <PageWrapper
            breadCrumb={[]}
            pageTitle='Projects'
            rightHeader={canCreateProject
                ? (
                    <Link className={styles.newTaasButton} to='/taas/new'>
                        <Button
                            label='Create TaaS Project'
                            primary
                            size='lg'
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

            <TaasProjectsFilter
                filters={filters}
                isManager={isManager}
                onFiltersChange={handleFiltersChange}
            />

            {taasProjectsResult.error
                ? (
                    <div className={styles.errorBanner}>
                        <span>{taasProjectsResult.error.message}</span>
                        <Button
                            label='Retry'
                            onClick={handleRetry}
                            secondary
                            size='lg'
                        />
                    </div>
                )
                : undefined}

            {taasProjectsResult.isLoading
                ? (
                    <div className={styles.loadingWrapper}>
                        <LoadingSpinner />
                    </div>
                )
                : undefined}

            {!taasProjectsResult.isLoading && !projects.length
                ? (
                    <div className={styles.emptyState}>No TaaS projects available yet</div>
                )
                : undefined}

            {!taasProjectsResult.isLoading && projects.length
                ? (
                    <>
                        <div className={styles.projectsList}>
                            {projects.map(project => (
                                <TaasProjectCard
                                    canEdit={canEditProject}
                                    key={project.id}
                                    project={project}
                                />
                            ))}
                        </div>
                        <Pagination
                            itemLabel='projects'
                            onPageChange={handlePageChange}
                            onPerPageChange={handlePerPageChange}
                            page={metadata.page}
                            perPage={metadata.perPage}
                            total={metadata.total}
                        />
                    </>
                )
                : undefined}
        </PageWrapper>
    )
}

export default TaasListPage
