/* eslint-disable react/jsx-no-bind */

import {
    FC,
    useContext,
    useMemo,
    useState,
} from 'react'
import { Link, useParams } from 'react-router-dom'

import { PageWrapper } from '~/apps/review/src/lib'
import { Button } from '~/libs/ui'

import {
    ENGAGEMENTS_APP_URL,
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
} from '../../../lib/components'
import {
    formatAnticipatedStart,
    formatDuration,
    formatLocation,
    getApplicationsCount,
    getAssignedMembersCount,
} from '../../../lib/utils'

import styles from './EngagementsListPage.module.scss'

function getSortValue(engagement: Engagement, fieldName: string): number | string {
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

    return engagement.createdAt || ''
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

function renderMembersAssignedCell(engagement: Engagement): JSX.Element {
    const count = getAssignedMembersCount(engagement)
    const handles = getAssignedMemberHandles(engagement)

    if (!handles.length) {
        return <span>{count}</span>
    }

    return (
        <span title={handles.join(', ')}>
            {count}
        </span>
    )
}

function renderEngagementRows(
    engagements: Engagement[],
    canManage: boolean,
    projectId: string,
): JSX.Element[] {
    return engagements.map(engagement => {
        const applicationsCount = getApplicationsCount(engagement)

        return (
            <tr key={String(engagement.id)}>
                <td>{engagement.title || '-'}</td>
                <td>{formatDuration(engagement)}</td>
                <td>{formatLocation(engagement)}</td>
                <td>{formatAnticipatedStart(engagement.anticipatedStart)}</td>
                <td>
                    <Link to={`/projects/${projectId}/engagements/${engagement.id}/applications`}>
                        {applicationsCount}
                    </Link>
                </td>
                <td>{engagement.isPrivate ? 'Private' : 'Public'}</td>
                <td>{engagement.requiredMemberCount || 0}</td>
                <td>{renderMembersAssignedCell(engagement)}</td>
                <td>
                    <span className={styles.status}>{engagement.status || '-'}</span>
                </td>
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
                        {canManage
                            ? (
                                <Link
                                    className={styles.actionLink}
                                    to={`/projects/${projectId}/engagements/${engagement.id}`}
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
    const projectId = params.projectId || ''

    const workAppContext = useContext(WorkAppContext)
    const contextValue = workAppContext as WorkAppContextModel

    const canManage = contextValue.isAdmin || contextValue.isManager

    const [filters, setFilters] = useState<EngagementsListFilters>({
        sortBy: 'anticipatedStart',
        sortOrder: 'asc',
        status: undefined,
        title: undefined,
    })

    const requestFilters = useMemo<EngagementFilters>(() => ({
        includePrivate: canManage,
        projectId,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        status: filters.status,
        title: filters.title,
    }), [canManage, filters.sortBy, filters.sortOrder, filters.status, filters.title, projectId])

    const engagementsResult = useFetchEngagements(projectId, requestFilters)
    const projectResult = useFetchProject(projectId)

    const filteredEngagements = useMemo(() => {
        const list = [...engagementsResult.engagements]

        if (filters.title) {
            const query = filters.title.trim()
                .toLowerCase()
            return list
                .filter(engagement => engagement.title.toLowerCase()
                    .includes(query))
                .sort((engagementA, engagementB) => {
                    const sortValueA = getSortValue(engagementA, filters.sortBy || 'anticipatedStart')
                    const sortValueB = getSortValue(engagementB, filters.sortBy || 'anticipatedStart')

                    if (sortValueA < sortValueB) {
                        return filters.sortOrder === 'asc' ? -1 : 1
                    }

                    if (sortValueA > sortValueB) {
                        return filters.sortOrder === 'asc' ? 1 : -1
                    }

                    return 0
                })
        }

        return list.sort((engagementA, engagementB) => {
            const sortValueA = getSortValue(engagementA, filters.sortBy || 'anticipatedStart')
            const sortValueB = getSortValue(engagementB, filters.sortBy || 'anticipatedStart')

            if (sortValueA < sortValueB) {
                return filters.sortOrder === 'asc' ? -1 : 1
            }

            if (sortValueA > sortValueB) {
                return filters.sortOrder === 'asc' ? 1 : -1
            }

            return 0
        })
    }, [engagementsResult.engagements, filters.sortBy, filters.sortOrder, filters.title])

    const pageTitle = projectResult.project?.name
        ? `${projectResult.project.name} Engagements`
        : 'Engagements'

    const breadCrumb = useMemo(
        () => [{
            index: 1,
            label: 'Engagements',
        }],
        [],
    )

    if (engagementsResult.isLoading || projectResult.isLoading) {
        return (
            <PageWrapper pageTitle={pageTitle} breadCrumb={breadCrumb}>
                <LoadingSpinner />
            </PageWrapper>
        )
    }

    if (engagementsResult.error) {
        return (
            <PageWrapper pageTitle={pageTitle} breadCrumb={breadCrumb}>
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
        <PageWrapper pageTitle={pageTitle} breadCrumb={breadCrumb}>
            <div className={styles.container}>
                <div className={styles.headerActions}>
                    {canManage
                        ? (
                            <Link to={`/projects/${projectId}/engagements/new`}>
                                <Button
                                    label='New Engagement'
                                    primary
                                    size='lg'
                                />
                            </Link>
                        )
                        : undefined}
                </div>

                <EngagementsFilter
                    filters={filters}
                    onFiltersChange={setFilters}
                />

                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Duration</th>
                                <th>Location</th>
                                <th>Anticipated Start</th>
                                <th>Applications</th>
                                <th>Visibility</th>
                                <th>Members Required</th>
                                <th>Members Assigned</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEngagements.length
                                ? renderEngagementRows(filteredEngagements, canManage, projectId)
                                : (
                                    <tr>
                                        <td colSpan={10} className={styles.emptyRow}>
                                            No engagements found.
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>
            </div>
        </PageWrapper>
    )
}

export default EngagementsListPage
