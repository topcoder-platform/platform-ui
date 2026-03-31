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
    COPILOTS_APP_URL,
    PAGE_SIZE,
    PROJECT_STATUS,
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
    ProjectStatus,
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
    Challenge,
    ChallengeFilters,
    ProjectStatusValue,
    WorkAppContextModel,
} from '../../../lib/models'
import {
    canCreateEngagement,
    checkCanManageProject,
    getStatusText,
} from '../../../lib/utils'

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
const DEFAULT_SORT_BY = 'startDate'
const DEFAULT_SORT_ORDER: 'asc' | 'desc' = 'desc'

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

interface RenderCreateActionButtonParams {
    actionPath: string
    disabled: boolean
    label: string
    primary?: boolean
    secondary?: boolean
}

function renderCreateActionButton(params: RenderCreateActionButtonParams): JSX.Element {
    const button = (
        <Button
            label={params.label}
            primary={params.primary}
            secondary={params.secondary}
            size='md'
            disabled={params.disabled}
        />
    )

    if (params.disabled) {
        return button
    }

    return (
        <Link to={params.actionPath} className={styles.headerActionLink}>
            {button}
        </Link>
    )
}

interface RenderHeaderActionsParams {
    disabled: boolean
    projectId: string
}

function renderHeaderActions(params: RenderHeaderActionsParams): JSX.Element {
    return (
        <div className={styles.headerActions}>
            {renderCreateActionButton({
                actionPath: `/projects/${params.projectId}/engagements/new`,
                disabled: params.disabled,
                label: 'Create Engagement',
                secondary: true,
            })}
        </div>
    )
}

function renderRequestCopilotAction(projectId: string): JSX.Element {
    const requestCopilotUrl = `${COPILOTS_APP_URL.replace(/\/$/, '')}/requests/new?projectId=${
        encodeURIComponent(projectId)
    }`

    return (
        <a
            className={styles.requestCopilotLink}
            href={requestCopilotUrl}
            rel='noreferrer noopener'
            target='_blank'
        >
            Request Copilot
        </a>
    )
}

interface RenderContextualActionsParams {
    canRequestCopilot: boolean
    disabled: boolean
    projectId: string
}

function renderContextualActions(params: RenderContextualActionsParams): JSX.Element {
    return (
        <div className={styles.contextualActionRow}>
            {params.canRequestCopilot
                ? renderRequestCopilotAction(params.projectId)
                : undefined}
            {renderCreateActionButton({
                actionPath: `/projects/${params.projectId}/challenges/new`,
                disabled: params.disabled,
                label: 'Create Challenge',
                primary: true,
            })}
        </div>
    )
}

interface RenderProjectTitleActionParams {
    backTo: string
    canManageProject: boolean
    projectId: string | undefined
    projectStatus: ProjectStatusValue | undefined
}

function renderProjectTitleAction(params: RenderProjectTitleActionParams): JSX.Element | undefined {
    if (!params.projectId) {
        return undefined
    }

    return (
        <div className={styles.projectTitleActions}>
            {params.projectStatus
                ? <ProjectStatus status={params.projectStatus} />
                : undefined}
            {params.canManageProject
                ? (
                    <Link
                        aria-label='Edit project'
                        className={styles.projectEditLink}
                        to={`/projects/${params.projectId}/edit`}
                    >
                        <IconOutline.PencilIcon className={styles.projectEditIcon} />
                    </Link>
                )
                : undefined}
            <Link
                aria-label='Manage project users'
                className={styles.projectUsersLink}
                state={{
                    backTo: params.backTo,
                }}
                to={`/projects/${params.projectId}/users`}
            >
                <IconOutline.UserIcon className={styles.projectUsersIcon} />
            </Link>
            <Link
                aria-label='Open project assets'
                className={styles.projectAssetsLink}
                to={`/projects/${params.projectId}/assets`}
            >
                <IconOutline.DocumentTextIcon className={styles.projectAssetsIcon} />
            </Link>
        </div>
    )
}

interface RenderBillingAccountNoticeParams {
    billingAccountId?: number | string
    billingAccountName?: string
    canManageProject: boolean
    projectId: string | undefined
}

function renderBillingAccountNotice(params: RenderBillingAccountNoticeParams): JSX.Element | undefined {
    if (!params.projectId) {
        return undefined
    }

    return (
        <ProjectBillingAccountExpiredNotice
            billingAccountId={params.billingAccountId}
            billingAccountName={params.billingAccountName}
            canManageProject={params.canManageProject}
            projectId={params.projectId}
        />
    )
}

function hasBillingAccountId(value: unknown): boolean {
    return value !== undefined
        && value !== null
        && String(value)
            .trim()
            .length > 0
}

interface CanRequestCopilotParams {
    billingAccountId?: number | string
    isAdmin: boolean
    isManager: boolean
    projectStatus?: ProjectStatusValue
}

function canRequestCopilot(params: CanRequestCopilotParams): boolean {
    return hasBillingAccountId(params.billingAccountId)
        && (params.isAdmin || params.isManager)
        && params.projectStatus !== PROJECT_STATUS.CANCELLED
        && params.projectStatus !== PROJECT_STATUS.COMPLETED
}

interface RenderChallengesContentParams {
    challenges: Challenge[]
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
                challenges={params.challenges}
                challengeTypes={params.challengeTypes}
                isLoading={params.challengesResult.isValidating && params.challenges.length === 0}
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

interface GetRightHeaderParams {
    canCreateEngagement: boolean
    disabled: boolean
    projectId?: string
}

function getRightHeader(params: GetRightHeaderParams): JSX.Element | undefined {
    if (!params.projectId || !params.canCreateEngagement) {
        return undefined
    }

    return renderHeaderActions({
        disabled: params.disabled,
        projectId: params.projectId,
    })
}

interface GetContextualActionsParams {
    canRequestCopilot: boolean
    disabled: boolean
    projectId?: string
}

function getContextualActions(params: GetContextualActionsParams): JSX.Element | undefined {
    if (!params.projectId) {
        return undefined
    }

    return renderContextualActions({
        canRequestCopilot: params.canRequestCopilot,
        disabled: params.disabled,
        projectId: params.projectId,
    })
}

export const ChallengesListPage: FC = () => {
    const { projectId: projectIdFromRoute }: Readonly<{ projectId?: string }> = useParams<'projectId'>()
    const location = useLocation()

    const {
        isAdmin,
        isManager,
        loginUserInfo,
        userRoles,
    }: WorkAppContextModel = useContext(WorkAppContext)

    const [filters, setFilters] = useState<ChallengeFilters>({
        ...DEFAULT_FILTERS,
        projectId: projectIdFromRoute,
    })
    const [page, setPage] = useState<number>(1)
    const [perPage, setPerPage] = useState<number>(PAGE_SIZE)
    const [sortBy, setSortBy] = useState<string>(DEFAULT_SORT_BY)
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(DEFAULT_SORT_ORDER)
    const isPrivilegedUser = isAdmin || isManager
    const selectedProjectId = projectIdFromRoute || filters.projectId
    const scopedMemberId = !isPrivilegedUser && !selectedProjectId
        ? loginUserInfo?.userId
        : undefined

    const fetchParams: UseFetchChallengesParams = {
        ...filters,
        memberId: scopedMemberId,
        page,
        perPage,
        projectId: selectedProjectId,
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

    const handleResetFilters = useCallback(() => {
        setFilters({
            ...DEFAULT_FILTERS,
            projectId: projectIdFromRoute,
        })
        setPage(1)
        setPerPage(PAGE_SIZE)
        setSortBy(DEFAULT_SORT_BY)
        setSortOrder(DEFAULT_SORT_ORDER)
    }, [projectIdFromRoute])

    const handleRetry = useCallback(() => {
        challengesResult.mutate()
            .catch(() => undefined)
    }, [challengesResult])

    const totalChallenges = challengesResult.metadata.total ?? 0
    const shouldShowPagination = canRenderPagination(!!challengesResult.error, totalChallenges)

    const sortedChallenges = useMemo<Challenge[]>(
        () => {
            const challenges = challengesResult.challenges
            if (sortBy !== 'status') {
                return challenges
            }

            const sortedByDisplayedStatus = [...challenges]
                .sort((challengeA, challengeB) => {
                    const normalizedStatusA = String(challengeA.status || '')
                        .trim()
                        .toUpperCase()
                    const normalizedStatusB = String(challengeB.status || '')
                        .trim()
                        .toUpperCase()
                    const statusCompare = normalizedStatusA.localeCompare(normalizedStatusB)

                    if (statusCompare !== 0) {
                        return sortOrder === 'asc'
                            ? statusCompare
                            : -statusCompare
                    }

                    const statusA = getStatusText(challengeA.status)
                        .toLowerCase()
                    const statusB = getStatusText(challengeB.status)
                        .toLowerCase()
                    const statusTextCompare = statusA.localeCompare(statusB)

                    if (statusTextCompare !== 0) {
                        return sortOrder === 'asc'
                            ? statusTextCompare
                            : -statusTextCompare
                    }

                    return String(challengeA.name || '')
                        .localeCompare(String(challengeB.name || ''))
                })

            return sortedByDisplayedStatus
        },
        [challengesResult.challenges, sortBy, sortOrder],
    )

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
    const canManageProject = !!projectResult.project
        && checkCanManageProject(userRoles, loginUserInfo?.userId, projectResult.project)
    const isProjectActive = String(projectResult.project?.status || '')
        .trim()
        .toLowerCase() === PROJECT_STATUS.ACTIVE
    const isCreateActionDisabled = !!projectIdFromRoute && !isProjectActive
    const canCreateProjectEngagement = canCreateEngagement(userRoles)
    const shouldShowRequestCopilot = canRequestCopilot({
        billingAccountId: projectResult.project?.billingAccountId,
        isAdmin,
        isManager,
        projectStatus: projectResult.project?.status,
    })

    const rightHeader = getRightHeader({
        canCreateEngagement: canCreateProjectEngagement,
        disabled: isCreateActionDisabled,
        projectId: projectIdFromRoute,
    })
    const contextualActions = getContextualActions({
        canRequestCopilot: shouldShowRequestCopilot,
        disabled: isCreateActionDisabled,
        projectId: projectIdFromRoute,
    })

    const titleAction = renderProjectTitleAction({
        backTo: `${location.pathname}${location.search}${location.hash}`,
        canManageProject,
        projectId: projectIdFromRoute,
        projectStatus: projectResult.project?.status,
    })

    return (
        <PageWrapper
            pageTitle={pageTitle}
            breadCrumb={[]}
            rightHeader={rightHeader}
            titleAction={titleAction}
        >
            {renderBillingAccountNotice({
                billingAccountId: projectResult.project?.billingAccountId,
                billingAccountName: projectResult.project?.billingAccountName,
                canManageProject,
                projectId: projectIdFromRoute,
            })}
            {projectIdFromRoute
                ? <ProjectListTabs projectId={projectIdFromRoute} />
                : undefined}
            {contextualActions}

            <div className={styles.totalChallenges}>
                {totalChallenges}
                {' '}
                challenges
            </div>

            <ChallengesFilter
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onResetFilters={handleResetFilters}
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
                challenges: sortedChallenges,
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
