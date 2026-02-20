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
import { Link, useLocation, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { TableLoading } from '~/apps/admin/src/lib'
import { PageWrapper } from '~/apps/review/src/lib'
import {
    Button,
    IconOutline,
} from '~/libs/ui'

import {
    PAGE_SIZE,
} from '../../../lib'
import {
    WorkAppContext,
} from '../../../lib/contexts'
import {
    ChallengesFilter,
    ChallengesTable,
    Pagination,
    ProjectBillingAccountExpiredNotice,
    ProjectListTabs,
} from '../../../lib/components'
import {
    useFetchChallenges,
    UseFetchChallengesParams,
    UseFetchChallengesResult,
    useFetchChallengeTypes,
    UseFetchChallengeTypesResult,
    useFetchProject,
    UseFetchProjectResult,
    useFetchProjects,
    UseFetchProjectsResult,
} from '../../../lib/hooks'
import {
    ChallengeFilters,
    WorkAppContextModel,
} from '../../../lib/models'

import styles from './ChallengesListPage.module.scss'

const DEFAULT_FILTERS: ChallengeFilters = {
    endDateEnd: undefined,
    endDateStart: undefined,
    name: undefined,
    projectId: undefined,
    startDateEnd: undefined,
    startDateStart: undefined,
    status: undefined,
    type: undefined,
}

function canRenderPagination(hasError: boolean, totalChallenges: number): boolean {
    return !hasError && totalChallenges > 0
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

interface RenderChallengesContentParams {
    challengeTypes: UseFetchChallengeTypesResult['challengeTypes']
    challengesResult: UseFetchChallengesResult
    onPageChange: (newPage: number) => void
    onPerPageChange: (newPerPage: number) => void
    onSort: (fieldName: string) => void
    page: number
    perPage: number
    shouldShowPagination: boolean
    sortBy: string
    sortOrder: 'asc' | 'desc'
    totalChallenges: number
}

function renderChallengesContent(params: RenderChallengesContentParams): JSX.Element {
    if (params.challengesResult.isLoading) {
        return <TableLoading />
    }

    return (
        <>
            <ChallengesTable
                challenges={params.challengesResult.challenges}
                challengeTypes={params.challengeTypes}
                isLoading={params.challengesResult.isValidating && params.challengesResult.challenges.length === 0}
                sortBy={params.sortBy}
                sortOrder={params.sortOrder}
                onSort={params.onSort}
            />
            {params.shouldShowPagination
                ? (
                    <Pagination
                        page={params.challengesResult.metadata.page ?? params.page}
                        perPage={params.challengesResult.metadata.perPage ?? params.perPage}
                        total={params.totalChallenges}
                        onPageChange={params.onPageChange}
                        onPerPageChange={params.onPerPageChange}
                    />
                )
                : undefined}
        </>
    )
}

export const ChallengesListPage: FC = () => {
    const { projectId: projectIdFromRoute }: Readonly<{ projectId?: string }> = useParams<'projectId'>()
    const location = useLocation()

    const {
        isAdmin,
        isManager,
    }: WorkAppContextModel = useContext(WorkAppContext)

    const [filters, setFilters] = useState<ChallengeFilters>({
        ...DEFAULT_FILTERS,
        projectId: projectIdFromRoute,
    })
    const [page, setPage] = useState<number>(1)
    const [perPage, setPerPage] = useState<number>(PAGE_SIZE)
    const [sortBy, setSortBy] = useState<string>('startDate')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const isPrivilegedUser = isAdmin || isManager

    const fetchParams: UseFetchChallengesParams = {
        ...filters,
        page,
        perPage,
        projectId: projectIdFromRoute || filters.projectId,
        sortBy,
        sortOrder,
    }

    const challengesResult: UseFetchChallengesResult = useFetchChallenges(fetchParams)
    const challengeTypesResult: UseFetchChallengeTypesResult = useFetchChallengeTypes()
    const projectResult: UseFetchProjectResult = useFetchProject(projectIdFromRoute)
    const projectsResult: UseFetchProjectsResult = useFetchProjects({
        memberOnly: !isPrivilegedUser,
    })

    const challengeErrorRef = useRef<string | undefined>()
    const challengeTypesErrorRef = useRef<string | undefined>()
    const projectErrorRef = useRef<string | undefined>()
    const projectsErrorRef = useRef<string | undefined>()

    useErrorToast(challengesResult.error, challengeErrorRef)
    useErrorToast(challengeTypesResult.error, challengeTypesErrorRef)
    useErrorToast(projectResult.error, projectErrorRef)
    useErrorToast(projectsResult.error, projectsErrorRef)

    const handleFiltersChange = useCallback((newFilters: ChallengeFilters) => {
        setFilters({
            ...newFilters,
            projectId: projectIdFromRoute || newFilters.projectId,
        })
        setPage(1)
    }, [projectIdFromRoute])

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
        challengesResult.mutate()
            .catch(() => undefined)
    }, [challengesResult])

    const totalChallenges = challengesResult.metadata.total ?? 0
    const shouldShowPagination = canRenderPagination(!!challengesResult.error, totalChallenges)

    const projectOptions = useMemo(
        () => projectsResult.projects
            .map(project => ({
                label: project.name,
                value: String(project.id),
            }))
            .sort((projectA, projectB) => projectA.label.localeCompare(projectB.label)),
        [projectsResult.projects],
    )

    useEffect(() => {
        setFilters(currentFilters => ({
            ...currentFilters,
            projectId: projectIdFromRoute,
        }))
        setPage(1)
    }, [projectIdFromRoute])

    const pageTitle = projectIdFromRoute && projectResult.project?.name
        ? projectResult.project.name
        : 'Challenges'

    const rightHeader = projectIdFromRoute
        ? (
            <div className={styles.headerActions}>
                <Link to={`/projects/${projectIdFromRoute}/challenges/new`} className={styles.headerActionLink}>
                    <Button
                        label='Create Challenge'
                        primary
                        size='md'
                    />
                </Link>

                <Link to={`/projects/${projectIdFromRoute}/engagements/new`} className={styles.headerActionLink}>
                    <Button
                        label='Create Engagement'
                        secondary
                        size='md'
                    />
                </Link>
            </div>
        )
        : undefined

    const titleAction = projectIdFromRoute
        ? (
            <div className={styles.projectTitleActions}>
                <Link
                    aria-label='Edit project'
                    className={styles.projectEditLink}
                    to={`/projects/${projectIdFromRoute}/edit`}
                >
                    <IconOutline.PencilIcon className={styles.projectEditIcon} />
                </Link>
                <Link
                    aria-label='Manage project users'
                    className={styles.projectUsersLink}
                    state={{
                        backTo: `${location.pathname}${location.search}${location.hash}`,
                    }}
                    to={`/projects/${projectIdFromRoute}/users`}
                >
                    <IconOutline.UserIcon className={styles.projectUsersIcon} />
                </Link>
                <Link
                    aria-label='Open project assets'
                    className={styles.projectAssetsLink}
                    to={`/projects/${projectIdFromRoute}/assets`}
                >
                    <IconOutline.DocumentTextIcon className={styles.projectAssetsIcon} />
                </Link>
            </div>
        )
        : undefined

    return (
        <PageWrapper
            pageTitle={pageTitle}
            breadCrumb={[]}
            rightHeader={rightHeader}
            titleAction={titleAction}
        >
            {projectIdFromRoute
                ? (
                    <ProjectBillingAccountExpiredNotice
                        billingAccountId={projectResult.project?.billingAccountId}
                        billingAccountName={projectResult.project?.billingAccountName}
                        projectId={projectIdFromRoute}
                        projectStatus={projectResult.project?.status}
                    />
                )
                : undefined}
            {projectIdFromRoute
                ? <ProjectListTabs projectId={projectIdFromRoute} />
                : undefined}

            <div className={styles.totalChallenges}>
                {totalChallenges}
                {' '}
                challenges
            </div>

            <ChallengesFilter
                filters={filters}
                onFiltersChange={handleFiltersChange}
                challengeTypes={challengeTypesResult.challengeTypes}
                dashboardMode={!projectIdFromRoute}
                projectOptions={projectOptions}
                isLoadingChallengeTypes={challengeTypesResult.isLoading}
            />

            {challengesResult.error && (
                <div className={styles.errorBanner}>
                    <span>{challengesResult.error.message}</span>
                    <Button
                        secondary
                        size='lg'
                        label='Retry'
                        onClick={handleRetry}
                    />
                </div>
            )}

            {renderChallengesContent({
                challengesResult,
                challengeTypes: challengeTypesResult.challengeTypes,
                onPageChange: handlePageChange,
                onPerPageChange: handlePerPageChange,
                onSort: handleSort,
                page,
                perPage,
                shouldShowPagination,
                sortBy,
                sortOrder,
                totalChallenges,
            })}
        </PageWrapper>
    )
}

export default ChallengesListPage
