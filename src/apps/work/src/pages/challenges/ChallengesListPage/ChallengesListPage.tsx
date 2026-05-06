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
import {
    Link,
    useNavigate,
    useParams,
} from 'react-router-dom'
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
    ErrorMessage,
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
    Project,
    ProjectStatusValue,
    WorkAppContextModel,
} from '../../../lib/models'
import {
    buildProjectLandingPath,
    canCreateEngagement,
    checkCanEditProjectDetails,
    checkCanManageProject,
    checkProjectAccess,
    getAuthAccessToken,
    getStatusText,
} from '../../../lib/utils'

import styles from './ChallengesListPage.module.scss'

const PROJECT_ACCESS_DENIED_MESSAGE = 'You don’t have access to this project. Please contact support@topcoder.com.'
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
    canEditProjectDetails: boolean
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
            {params.canEditProjectDetails
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
        </div>
    )
}

/**
 * Returns whether the project-title edit action should render.
 *
 * @param userRoles caller roles from the current work app context.
 * @param userId logged-in user identifier used for project membership checks.
 * @param project loaded project detail for the current route.
 * @returns `true` only after project detail is loaded and editable by the caller.
 * @remarks Used by the project challenges page title action so admins, managers,
 * and copilots keep the same loading behavior while sharing the narrower project
 * detail edit permission.
 */
function canRenderProjectDetailsEditAction(
    userRoles: string[],
    userId: number | string | undefined,
    project: Project | undefined,
): boolean {
    return !!project
        && checkCanEditProjectDetails(
            userRoles,
            userId,
            project,
        )
}

interface RenderBillingAccountNoticeParams {
    billingAccountId?: number | string
    billingAccountName?: string
    canManageProject: boolean
    displayMemberPaymentDetailsToCopilots?: boolean
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
            displayMemberPaymentDetailsToCopilots={params.displayMemberPaymentDetailsToCopilots}
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
    isWaitingForMemberScope: boolean
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
    if (params.isWaitingForMemberScope || params.challengesResult.isLoading) {
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

interface DashboardMemberScopeState {
    isWaitingForMemberScope: boolean
    scopedMemberId?: number
}

interface ProjectRouteAccessParams {
    isProjectLoading: boolean
    project?: Project
    projectError?: Error
    projectId?: string
    shouldRedirectToProjectLanding: boolean
    userId?: number | string
    userRoles: string[]
}

interface ProjectRouteAccessState {
    canFetchProjectChallenges: boolean
    isDenied: boolean
    isLoading: boolean
}

interface ResolveDashboardMemberScopeParams {
    isPrivilegedUser: boolean
    selectedProjectId?: number | string
    userId?: number
}

/**
 * Resolves whether dashboard challenge fetches must wait for the caller's
 * member id before issuing a member-scoped request.
 *
 * @param params current privilege, project, and caller identity state.
 * @returns loading state plus the member id to send to the challenges hook.
 * @remarks Used only for the dashboard challenges list, where copilot users
 * need member-scoped results that match legacy Work Manager behavior.
 */
function resolveDashboardMemberScope(
    params: ResolveDashboardMemberScopeParams,
): DashboardMemberScopeState {
    const shouldScopeByMember = !params.isPrivilegedUser && !params.selectedProjectId

    if (!shouldScopeByMember) {
        return {
            isWaitingForMemberScope: false,
            scopedMemberId: undefined,
        }
    }

    return {
        isWaitingForMemberScope: params.userId === undefined,
        scopedMemberId: params.userId,
    }
}

/**
 * Resolves project-route access state before project-scoped child records load.
 *
 * @param params current route, project loading, redirect, and caller identity state.
 * @returns whether child challenge records can load and whether to show loading or denial UI.
 * @remarks Used by direct project challenge URLs so unauthorized callers do not
 * receive challenge listings before project membership is verified.
 */
function resolveProjectRouteAccess(
    params: ProjectRouteAccessParams,
): ProjectRouteAccessState {
    if (!params.projectId) {
        return {
            canFetchProjectChallenges: true,
            isDenied: false,
            isLoading: false,
        }
    }

    const hasProjectAccess = checkProjectAccess(params.userRoles, params.userId, params.project)
    const isLoading = params.isProjectLoading || params.shouldRedirectToProjectLanding

    return {
        canFetchProjectChallenges: hasProjectAccess && !params.projectError,
        isDenied: !isLoading && (!!params.projectError || !hasProjectAccess),
        isLoading,
    }
}

/**
 * Returns the canonical challenges route for a project-scoped challenges page.
 *
 * @param projectId route param for the current project.
 * @returns encoded challenges route or `undefined` for dashboard mode.
 */
function getProjectChallengesPath(projectId: string | undefined): string | undefined {
    if (!projectId) {
        return undefined
    }

    return `/projects/${encodeURIComponent(projectId)}/challenges`
}

/**
 * Resolves the expected landing path for the currently loaded project.
 *
 * @param projectId route param for the current project.
 * @param project loaded project detail, when available.
 * @param accessToken current caller token for invite matching.
 * @returns invitation or challenges route when the project detail is loaded.
 */
function getProjectLandingPath(
    projectId: string | undefined,
    project: Project | undefined,
    accessToken: string,
): string | undefined {
    if (!projectId || !project) {
        return undefined
    }

    return buildProjectLandingPath(project, accessToken)
}

/**
 * Returns whether the current challenges route should redirect to another
 * project landing path, such as the invitation modal route for pending invites.
 *
 * @param currentProjectChallengesPath canonical challenges route for the project.
 * @param projectLandingPath resolved default landing path for the project.
 * @returns `true` when the caller should be redirected away from challenges.
 */
function shouldRedirectToProjectLandingPath(
    currentProjectChallengesPath: string | undefined,
    projectLandingPath: string | undefined,
): boolean {
    return !!currentProjectChallengesPath
        && !!projectLandingPath
        && currentProjectChallengesPath !== projectLandingPath
}

export const ChallengesListPage: FC = () => {
    const navigate = useNavigate()
    const { projectId: projectIdFromRoute }: Readonly<{ projectId?: string }> = useParams<'projectId'>()

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
    const projectResult: UseFetchProjectResult = useFetchProject(projectIdFromRoute)
    const accessToken = useMemo(
        () => getAuthAccessToken(loginUserInfo),
        [loginUserInfo],
    )
    const currentProjectChallengesPath = useMemo(
        () => getProjectChallengesPath(projectIdFromRoute),
        [projectIdFromRoute],
    )
    const projectLandingPath = useMemo(
        () => getProjectLandingPath(projectIdFromRoute, projectResult.project, accessToken),
        [accessToken, projectIdFromRoute, projectResult.project],
    )
    const shouldRedirectToProjectLanding = useMemo(
        () => shouldRedirectToProjectLandingPath(currentProjectChallengesPath, projectLandingPath),
        [currentProjectChallengesPath, projectLandingPath],
    )
    const projectRouteAccess = resolveProjectRouteAccess({
        isProjectLoading: projectResult.isLoading,
        project: projectResult.project,
        projectError: projectResult.error,
        projectId: projectIdFromRoute,
        shouldRedirectToProjectLanding,
        userId: loginUserInfo?.userId,
        userRoles,
    })
    const {
        isWaitingForMemberScope,
        scopedMemberId,
    }: DashboardMemberScopeState = resolveDashboardMemberScope({
        isPrivilegedUser,
        selectedProjectId,
        userId: loginUserInfo?.userId,
    })

    const fetchParams: UseFetchChallengesParams = {
        ...filters,
        enabled: !isWaitingForMemberScope && projectRouteAccess.canFetchProjectChallenges,
        memberId: scopedMemberId,
        page,
        perPage,
        projectId: selectedProjectId,
        sortBy,
        sortOrder,
    }

    const challengesResult: UseFetchChallengesResult = useFetchChallenges(fetchParams)
    const challengeTypesResult: UseFetchChallengeTypesResult = useFetchChallengeTypes()
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

    useEffect(() => {
        if (!shouldRedirectToProjectLanding || !projectLandingPath) {
            return
        }

        navigate(projectLandingPath, {
            replace: true,
        })
    }, [navigate, projectLandingPath, shouldRedirectToProjectLanding])

    const pageTitle = projectIdFromRoute && projectResult.project?.name
        ? projectResult.project.name
        : 'Challenges'
    const canManageProject = !!projectResult.project
        && checkCanManageProject(userRoles, loginUserInfo?.userId, projectResult.project)
    const canEditProjectDetails = canRenderProjectDetailsEditAction(
        userRoles,
        loginUserInfo?.userId,
        projectResult.project,
    )
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
        canEditProjectDetails,
        projectId: projectIdFromRoute,
        projectStatus: projectResult.project?.status,
    })

    if (projectRouteAccess.isLoading) {
        return <TableLoading />
    }

    if (projectRouteAccess.isDenied) {
        return (
            <PageWrapper
                pageTitle='Challenges'
                breadCrumb={[]}
            >
                <ErrorMessage message={PROJECT_ACCESS_DENIED_MESSAGE} />
            </PageWrapper>
        )
    }

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
                displayMemberPaymentDetailsToCopilots:
                    projectResult.project?.details?.displayMemberPaymentDetailsToCopilots,
                projectId: projectIdFromRoute,
            })}
            {projectIdFromRoute
                ? <ProjectListTabs projectId={projectIdFromRoute} />
                : undefined}
            <div className={styles.summaryRow}>
                <div className={styles.totalChallenges}>
                    {totalChallenges}
                    {' '}
                    challenges
                </div>
                {contextualActions}
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
                isWaitingForMemberScope,
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
