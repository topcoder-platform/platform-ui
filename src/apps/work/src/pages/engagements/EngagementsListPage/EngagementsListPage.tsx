/* eslint-disable react/jsx-no-bind, complexity */

import {
    FC,
    MouseEvent,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import classNames from 'classnames'

import { PageWrapper } from '~/apps/review/src/lib'
import {
    Button,
    IconOutline,
} from '~/libs/ui'

import {
    ENGAGEMENTS_APP_URL,
    PAGE_SIZE,
} from '../../../lib/constants'
import {
    WorkAppContext,
} from '../../../lib/contexts'
import {
    useFetchEngagements,
    useFetchProject,
} from '../../../lib/hooks'
import {
    Engagement,
    EngagementFilters,
    WorkAppContextModel,
} from '../../../lib/models'
import {
    EngagementsFilter,
    EngagementsListFilters,
    ErrorMessage,
    LoadingSpinner,
    Pagination,
    ProjectBillingAccountExpiredNotice,
    ProjectListTabs,
} from '../../../lib/components'
import {
    formatEngagementStatus,
    getApplicationsCount,
    getAssignedMembersCount,
} from '../../../lib/utils'

import styles from './EngagementsListPage.module.scss'

type SortOrder = 'asc' | 'desc'

type EngagementSortField =
    | 'anticipatedStart'
    | 'applications'
    | 'membersAssigned'
    | 'status'
    | 'title'
    | 'visibility'

interface ColumnDefinition {
    fieldName?: EngagementSortField
    label: string
    sortable?: boolean
}

const columns: ColumnDefinition[] = [
    {
        label: 'Project Name',
    },
    {
        fieldName: 'title',
        label: 'Engagement Title',
        sortable: true,
    },
    {
        fieldName: 'visibility',
        label: 'Visibility',
        sortable: true,
    },
    {
        fieldName: 'status',
        label: 'Status',
        sortable: true,
    },
    {
        fieldName: 'applications',
        label: 'Applications',
        sortable: true,
    },
    {
        fieldName: 'membersAssigned',
        label: 'Members Assigned',
        sortable: true,
    },
    {
        label: 'Actions',
    },
]

function getSortValue(engagement: Engagement, fieldName: EngagementSortField): number | string {
    if (fieldName === 'anticipatedStart') {
        const orderMap: Record<string, number> = {
            FEW_DAYS: 2,
            FEW_WEEKS: 3,
            IMMEDIATE: 1,
        }

        const anticipatedStart = String(engagement.anticipatedStart || '')
            .toUpperCase()

        return orderMap[anticipatedStart] || 99
    }

    if (fieldName === 'title') {
        return String(engagement.title || '')
            .toLowerCase()
    }

    if (fieldName === 'visibility') {
        return engagement.isPrivate ? 'private' : 'public'
    }

    if (fieldName === 'status') {
        return formatEngagementStatus(engagement.status || '')
            .toLowerCase()
    }

    if (fieldName === 'applications') {
        return getApplicationsCount(engagement)
    }

    if (fieldName === 'membersAssigned') {
        return getAssignedMembersCount(engagement)
    }

    return engagement.createdAt || ''
}

function compareSortValues(valueA: number | string, valueB: number | string): number {
    if (typeof valueA === 'number' && typeof valueB === 'number') {
        return valueA - valueB
    }

    return String(valueA)
        .localeCompare(String(valueB))
}

function getSortIndicator(currentSortBy: EngagementSortField | undefined, currentSortOrder: SortOrder): string {
    if (!currentSortBy) {
        return ''
    }

    return currentSortOrder === 'asc'
        ? ' \u2191'
        : ' \u2193'
}

function getAssignedMemberHandles(engagement: Engagement): string[] {
    const assignments = Array.isArray(engagement.assignments)
        ? engagement.assignments
        : []

    const assignmentHandles = assignments
        .map(assignment => assignment.memberHandle)
        .filter(Boolean)

    if (assignmentHandles.length > 0) {
        return assignmentHandles
    }

    return Array.isArray(engagement.assignedMemberHandles)
        ? engagement.assignedMemberHandles.filter(Boolean)
        : []
}

function getExternalEngagementViewUrl(engagement: Engagement): string {
    return `${ENGAGEMENTS_APP_URL}/opportunities/${engagement.id}`
}

function getStatusPillClass(status: string): string {
    const normalizedStatus = status.trim()
        .toLowerCase()

    if (normalizedStatus === 'active') {
        return styles.statusGreen
    }

    if (normalizedStatus === 'open' || normalizedStatus === 'pending assignment') {
        return styles.statusYellow
    }

    if (normalizedStatus === 'closed') {
        return styles.statusBlue
    }

    if (normalizedStatus === 'cancelled') {
        return styles.statusRed
    }

    return styles.statusGray
}

function renderEngagementStatus(status?: string): JSX.Element {
    const statusText = formatEngagementStatus(status || '')

    return (
        <span className={classNames(styles.statusPill, getStatusPillClass(statusText))}>
            {statusText}
        </span>
    )
}

function renderMembersAssignedCell(
    engagement: Engagement,
    engagementProjectId: string,
    assignmentsBackUrl: string,
): JSX.Element {
    const count = getAssignedMembersCount(engagement)
    const handles = getAssignedMemberHandles(engagement)

    const hasAssignmentsRoute = !!engagementProjectId && !!engagement.id && count > 0
    const countElement = hasAssignmentsRoute
        ? (
            <Link
                className={styles.link}
                to={`/projects/${engagementProjectId}/engagements/${engagement.id}/assignments`}
                state={assignmentsBackUrl
                    ? {
                        backUrl: assignmentsBackUrl,
                    }
                    : undefined}
            >
                {count}
            </Link>
        )
        : <span>{count}</span>

    if (!handles.length) {
        return countElement
    }

    return (
        <span title={handles.join(', ')}>
            {countElement}
        </span>
    )
}

function getEngagementProjectId(
    engagement: Engagement,
    fallbackProjectId?: string,
): string {
    return String(
        engagement.projectId
        || engagement.project?.id
        || fallbackProjectId
        || '',
    )
}

function getEngagementProjectName(
    engagement: Engagement,
    projectNameLookup: Record<string, string>,
    fallbackProjectName?: string,
    fallbackProjectId?: string,
): string {
    const engagementProjectId = getEngagementProjectId(engagement, fallbackProjectId)

    return engagement.projectName
        || engagement.project?.name
        || projectNameLookup[engagementProjectId]
        || fallbackProjectName
        || ''
}

function renderEngagementRows(
    engagements: Engagement[],
    canManage: boolean,
    assignmentsBackUrl: string,
    projectNameLookup: Record<string, string>,
    fallbackProjectId?: string,
    fallbackProjectName?: string,
): JSX.Element[] {
    return engagements.map(engagement => {
        const applicationsCount = getApplicationsCount(engagement)
        const engagementProjectId = getEngagementProjectId(engagement, fallbackProjectId)
        const projectName = getEngagementProjectName(
            engagement,
            projectNameLookup,
            fallbackProjectName,
            fallbackProjectId,
        )
            || engagementProjectId
            || '-'
        const projectChallengesRoute = engagementProjectId
            ? `/projects/${engagementProjectId}/challenges`
            : undefined

        return (
            <tr key={String(engagement.id)}>
                <td className={styles.projectName}>
                    {projectChallengesRoute
                        ? (
                            <Link className={styles.link} to={projectChallengesRoute}>
                                {projectName}
                            </Link>
                        )
                        : projectName}
                </td>
                <td className={styles.engagementTitle}>{engagement.title || '-'}</td>
                <td>{engagement.isPrivate ? 'Private' : 'Public'}</td>
                <td>{renderEngagementStatus(engagement.status)}</td>
                <td>
                    {engagementProjectId
                        ? (
                            <Link
                                className={styles.link}
                                to={`/projects/${engagementProjectId}/engagements/${engagement.id}/applications`}
                            >
                                {applicationsCount}
                            </Link>
                        )
                        : applicationsCount}
                </td>
                <td>{renderMembersAssignedCell(engagement, engagementProjectId, assignmentsBackUrl)}</td>
                <td>
                    <div className={styles.actions}>
                        <a
                            className={styles.actionLink}
                            href={getExternalEngagementViewUrl(engagement)}
                            rel='noreferrer noopener'
                            target='_blank'
                        >
                            View
                        </a>
                        {canManage && engagementProjectId
                            ? (
                                <Link
                                    className={styles.actionLink}
                                    to={`/projects/${engagementProjectId}/engagements/${engagement.id}`}
                                >
                                    Edit
                                </Link>
                            )
                            : undefined}
                    </div>
                </td>
            </tr>
        )
    })
}

export const EngagementsListPage: FC = () => {
    const params: Readonly<{ projectId?: string }> = useParams<'projectId'>()
    const location = useLocation()
    const projectId = params.projectId
    const isAllEngagementsPage = !projectId

    const workAppContext = useContext(WorkAppContext)
    const contextValue = workAppContext as WorkAppContextModel

    const canManage = contextValue.isAdmin || contextValue.isManager

    const [filters, setFilters] = useState<EngagementsListFilters>(() => ({
        projectName: undefined,
        sortBy: isAllEngagementsPage
            ? 'anticipatedStart'
            : undefined,
        sortOrder: isAllEngagementsPage
            ? 'asc'
            : undefined,
        status: undefined,
        title: undefined,
        visibility: undefined,
    }))
    const [page, setPage] = useState<number>(1)
    const [perPage, setPerPage] = useState<number>(PAGE_SIZE)

    const requestFilters = useMemo<EngagementFilters>(() => ({
        includePrivate: canManage,
        projectId: isAllEngagementsPage ? undefined : projectId,
        sortBy: isAllEngagementsPage
            ? 'anticipatedStart'
            : undefined,
        sortOrder: isAllEngagementsPage
            ? 'asc'
            : undefined,
        status: filters.status,
        title: filters.title,
    }), [canManage, filters.status, filters.title, isAllEngagementsPage, projectId])

    const engagementsResult = useFetchEngagements(
        projectId,
        requestFilters,
        {
            enabled: isAllEngagementsPage || !!projectId,
        },
    )
    const projectResult = useFetchProject(projectId)

    const projectNameLookup = useMemo<Record<string, string>>(() => {
        const lookup: Record<string, string> = {}

        engagementsResult.engagements.forEach(engagement => {
            const id = getEngagementProjectId(engagement, projectId)
            const name = String(engagement.projectName || engagement.project?.name || '')
                .trim()

            if (id && name && !lookup[id]) {
                lookup[id] = name
            }
        })

        return lookup
    }, [engagementsResult.engagements, projectId])

    const filteredEngagements = useMemo(() => {
        const titleFilter = (filters.title || '')
            .trim()
            .toLowerCase()
        const projectNameFilter = (filters.projectName || '')
            .trim()
            .toLowerCase()
        const fallbackProjectName = projectResult.project?.name || ''

        const filteredResults = engagementsResult.engagements
            .filter(engagement => {
                if (!titleFilter) {
                    return true
                }

                return (engagement.title || '')
                    .toLowerCase()
                    .includes(titleFilter)
            })
            .filter(engagement => {
                if (!projectNameFilter) {
                    return true
                }

                const engagementProjectName = getEngagementProjectName(
                    engagement,
                    projectNameLookup,
                    fallbackProjectName,
                    projectId,
                )
                    .toLowerCase()
                const engagementProjectId = getEngagementProjectId(engagement, projectId)
                    .toLowerCase()

                return (
                    engagementProjectName.includes(projectNameFilter)
                    || engagementProjectId.includes(projectNameFilter)
                )
            })
            .filter(engagement => {
                if (!filters.visibility) {
                    return true
                }

                return filters.visibility === 'private'
                    ? engagement.isPrivate
                    : !engagement.isPrivate
            })

        if (!filters.sortBy || !filters.sortOrder) {
            return filteredResults
        }

        const sortBy = filters.sortBy as EngagementSortField

        return [...filteredResults]
            .sort((engagementA, engagementB) => {
                const comparisonResult = compareSortValues(
                    getSortValue(engagementA, sortBy),
                    getSortValue(engagementB, sortBy),
                )

                if (comparisonResult < 0) {
                    return filters.sortOrder === 'asc' ? -1 : 1
                }

                if (comparisonResult > 0) {
                    return filters.sortOrder === 'asc' ? 1 : -1
                }

                return 0
            })
    }, [
        engagementsResult.engagements,
        filters.projectName,
        filters.sortBy,
        filters.sortOrder,
        filters.title,
        filters.visibility,
        projectId,
        projectNameLookup,
        projectResult.project?.name,
    ])

    const handleSort = useCallback((fieldName: EngagementSortField): void => {
        if (isAllEngagementsPage) {
            setPage(1)
        }

        setFilters(currentFilters => {
            const isCurrentField = currentFilters.sortBy === fieldName

            return {
                ...currentFilters,
                sortBy: fieldName,
                sortOrder: isCurrentField
                    ? currentFilters.sortOrder === 'asc'
                        ? 'desc'
                        : 'asc'
                    : 'asc',
            }
        })
    }, [isAllEngagementsPage])

    function handleSortButtonClick(event: MouseEvent<HTMLButtonElement>): void {
        const fieldName = event.currentTarget.dataset.fieldName as EngagementSortField | undefined

        if (!fieldName) {
            return
        }

        handleSort(fieldName)
    }

    const handleFiltersChange = useCallback((nextFilters: EngagementsListFilters): void => {
        setFilters(nextFilters)

        if (isAllEngagementsPage) {
            setPage(1)
        }
    }, [isAllEngagementsPage])

    const paginatedEngagements = useMemo(() => {
        if (!isAllEngagementsPage) {
            return filteredEngagements
        }

        const start = (page - 1) * perPage
        return filteredEngagements.slice(start, start + perPage)
    }, [filteredEngagements, isAllEngagementsPage, page, perPage])

    useEffect(() => {
        if (!isAllEngagementsPage) {
            return
        }

        const totalPages = Math.max(1, Math.ceil(filteredEngagements.length / perPage) || 1)

        if (page > totalPages) {
            setPage(totalPages)
        }
    }, [filteredEngagements.length, isAllEngagementsPage, page, perPage])

    const pageTitle = isAllEngagementsPage
        ? 'All Engagements'
        : (
            projectResult.project?.name
                ? `${projectResult.project.name} Engagements`
                : 'Engagements'
        )
    const assignmentsBackUrl = isAllEngagementsPage
        ? '/engagements'
        : `/projects/${projectId}/engagements`

    const rightHeader = projectId
        ? (
            <div className={styles.headerActions}>
                <Link
                    className={styles.headerActionLink}
                    to={`/projects/${projectId}/challenges/new`}
                >
                    <Button
                        label='Create Challenge'
                        primary
                        size='md'
                    />
                </Link>

                <Link
                    className={styles.headerActionLink}
                    to={`/projects/${projectId}/engagements/new`}
                >
                    <Button
                        label='Create Engagement'
                        secondary
                        size='md'
                    />
                </Link>
            </div>
        )
        : undefined

    const titleAction = projectId
        ? (
            <div className={styles.projectTitleActions}>
                <Link
                    aria-label='Edit project'
                    className={styles.projectEditLink}
                    to={`/projects/${projectId}/edit`}
                >
                    <IconOutline.PencilIcon className={styles.projectEditIcon} />
                </Link>
                <Link
                    aria-label='Manage project users'
                    className={styles.projectUsersLink}
                    state={{
                        backTo: `${location.pathname}${location.search}${location.hash}`,
                    }}
                    to={`/projects/${projectId}/users`}
                >
                    <IconOutline.UserIcon className={styles.projectUsersIcon} />
                </Link>
                <Link
                    aria-label='Open project assets'
                    className={styles.projectAssetsLink}
                    to={`/projects/${projectId}/assets`}
                >
                    <IconOutline.DocumentTextIcon className={styles.projectAssetsIcon} />
                </Link>
            </div>
        )
        : undefined

    const projectTabs = !isAllEngagementsPage
        ? <ProjectListTabs projectId={projectId as string} />
        : undefined
    const billingAccountExpiredNotice = !isAllEngagementsPage && projectId
        ? (
            <ProjectBillingAccountExpiredNotice
                billingAccountId={projectResult.project?.billingAccountId}
                billingAccountName={projectResult.project?.billingAccountName}
                projectId={projectId}
                projectStatus={projectResult.project?.status}
            />
        )
        : undefined

    if (
        engagementsResult.isLoading
        || (!isAllEngagementsPage && projectResult.isLoading)
    ) {
        return (
            <PageWrapper
                pageTitle={pageTitle}
                breadCrumb={[]}
                rightHeader={rightHeader}
                titleAction={titleAction}
            >
                {billingAccountExpiredNotice}
                {projectTabs}
                <LoadingSpinner />
            </PageWrapper>
        )
    }

    if (engagementsResult.error) {
        return (
            <PageWrapper
                pageTitle={pageTitle}
                breadCrumb={[]}
                rightHeader={rightHeader}
                titleAction={titleAction}
            >
                {billingAccountExpiredNotice}
                {projectTabs}
                <ErrorMessage
                    message={engagementsResult.error.message}
                    onRetry={() => {
                        engagementsResult.mutate()
                            .catch(() => undefined)
                    }}
                />
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
            {billingAccountExpiredNotice}
            {projectTabs}
            <div className={styles.container}>
                <EngagementsFilter
                    filters={filters}
                    showProjectNameFilter={isAllEngagementsPage}
                    onFiltersChange={handleFiltersChange}
                />

                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                {columns.map(column => (
                                    <th key={column.label}>
                                        {column.sortable && column.fieldName
                                            ? (
                                                <button
                                                    type='button'
                                                    className={styles.sortButton}
                                                    data-field-name={column.fieldName}
                                                    onClick={handleSortButtonClick}
                                                >
                                                    {column.label}
                                                    {filters.sortBy === column.fieldName
                                                        ? getSortIndicator(
                                                            filters.sortBy as EngagementSortField | undefined,
                                                            (filters.sortOrder || 'asc') as SortOrder,
                                                        )
                                                        : ''}
                                                </button>
                                            )
                                            : <span>{column.label}</span>}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedEngagements.length
                                ? renderEngagementRows(
                                    paginatedEngagements,
                                    canManage,
                                    assignmentsBackUrl,
                                    projectNameLookup,
                                    projectId,
                                    projectResult.project?.name || '',
                                )
                                : (
                                    <tr>
                                        <td colSpan={7} className={styles.emptyRow}>
                                            No engagements found.
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>

                {isAllEngagementsPage && filteredEngagements.length > 0 && (
                    <Pagination
                        page={page}
                        perPage={perPage}
                        total={filteredEngagements.length}
                        itemLabel='engagements'
                        onPageChange={setPage}
                        onPerPageChange={nextPerPage => {
                            setPerPage(nextPerPage)
                            setPage(1)
                        }}
                    />
                )}
            </div>
        </PageWrapper>
    )
}

export default EngagementsListPage
