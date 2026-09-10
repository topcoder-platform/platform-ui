/* eslint-disable react/jsx-no-bind, complexity */

import {
    FC,
    MouseEvent,
    ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import classNames from 'classnames'

import { copyTextToClipboard } from '~/libs/shared'
import { Button, IconOutline, Tooltip } from '~/libs/ui'

import {
    engagementLeadsRouteId,
    rootRoute,
} from '../../../config/routes.config'
import {
    ENGAGEMENTS_APP_URL,
    PAGE_SIZE,
} from '../../constants'
import {
    EngagementLead,
} from '../../models/EngagementLead.model'
import {
    fetchEngagementLeads,
} from '../../services/engagement-leads.service'
import {
    fetchEngagement,
} from '../../services/engagements.service'
import {
    ErrorMessage,
    LoadingSpinner,
    Pagination,
} from '..'
import {
    CreateEngagementFromLeadModal,
} from '../CreateEngagementFromLeadModal'
import {
    EngagementLeadsFilter,
    EngagementLeadsListFilters,
} from '../EngagementLeadsFilter'
import {
    canCreateEngagementFromLead,
    formatLeadAge,
    formatLeadDate,
    formatLeadLabel,
    getLeadDisplayStatus,
    getLeadDisplayStatusClassName,
    getLeadIntakeUrl,
} from '../../utils/engagement-leads.utils'
import {
    extractErrorMessage,
    showErrorToast,
    showSuccessToast,
} from '../../utils'
import { withQueryParams } from '../../utils/navigation.utils'

import styles from './EngagementLeadsTab.module.scss'

type LeadSortField = 'createdAt' | 'preferredStartDate' | 'priority'

interface LeadColumnDefinition {
    compact?: boolean
    fieldName?: LeadSortField
    label: string
    sortable?: boolean
}

const columns: LeadColumnDefinition[] = [
    { label: 'Lead ID' },
    { label: 'Account' },
    { label: 'SPOC' },
    { label: 'SMU' },
    { label: 'Role Title' },
    { label: 'Experience Level' },
    { compact: true, label: 'No. of Resources' },
    {
        fieldName: 'preferredStartDate',
        label: 'Expected Start Date',
        sortable: true,
    },
    { compact: true, label: 'Expected Duration' },
    {
        fieldName: 'priority',
        label: 'Priority',
        sortable: true,
    },
    { label: 'Status' },
    {
        fieldName: 'createdAt',
        label: 'Created Date',
        sortable: true,
    },
    { label: 'Actions' },
]

function getColumnHeaderContent(column: LeadColumnDefinition): ReactNode {
    if (column.label === 'No. of Resources') {
        return (
            <>
                No. of
                <br />
                Resources
            </>
        )
    }

    if (column.label === 'Expected Duration') {
        return (
            <>
                Expected
                <br />
                Duration
            </>
        )
    }

    return column.label
}

function getSortIndicator(
    currentSortBy: LeadSortField | undefined,
    currentSortOrder: 'asc' | 'desc' | undefined,
    fieldName: LeadSortField,
): string {
    if (currentSortBy !== fieldName) {
        return ''
    }

    return currentSortOrder === 'asc' ? ' \u2191' : ' \u2193'
}

function getPriorityClassName(priority: string): string {
    if (priority === 'CRITICAL') {
        return styles.priorityCritical
    }

    if (priority === 'HIGH') {
        return styles.priorityHigh
    }

    return ''
}

function areLeadFiltersEqual(
    left: EngagementLeadsListFilters,
    right: EngagementLeadsListFilters,
): boolean {
    return left.accountName === right.accountName
        && left.smu === right.smu
        && left.engagementModel === right.engagementModel
        && left.roleTitle === right.roleTitle
        && left.experienceLevel === right.experienceLevel
        && left.priority === right.priority
        && left.statusGroup === right.statusGroup
        && left.sortBy === right.sortBy
        && left.sortOrder === right.sortOrder
}

export const EngagementLeadsTab: FC = () => {
    const navigate = useNavigate()
    const intakeUrl = useMemo(() => getLeadIntakeUrl(ENGAGEMENTS_APP_URL), [])

    const [leads, setLeads] = useState<EngagementLead[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | undefined>(undefined)
    const [page, setPage] = useState<number>(1)
    const [perPage, setPerPage] = useState<number>(PAGE_SIZE)
    const [totalCount, setTotalCount] = useState<number>(0)
    const [filters, setFilters] = useState<EngagementLeadsListFilters>({
        sortBy: 'createdAt',
        sortOrder: 'desc',
    })
    const [selectedLead, setSelectedLead] = useState<EngagementLead | undefined>(undefined)
    const [viewingEngagementId, setViewingEngagementId] = useState<string | undefined>(undefined)

    const loadLeads = useCallback(async (): Promise<void> => {
        setLoading(true)
        setError(undefined)

        try {
            const response = await fetchEngagementLeads({
                accountName: filters.accountName,
                engagementModel: filters.engagementModel,
                experienceLevel: filters.experienceLevel,
                page,
                perPage,
                priority: filters.priority,
                roleTitle: filters.roleTitle,
                smu: filters.smu,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder,
                statusGroup: filters.statusGroup,
            })

            setLeads(response.data)
            setTotalCount(response.meta.totalCount || 0)
        } catch (err: unknown) {
            setError(extractErrorMessage(err, 'Unable to load engagement leads.'))
        } finally {
            setLoading(false)
        }
    }, [
        filters.accountName,
        filters.engagementModel,
        filters.experienceLevel,
        filters.priority,
        filters.roleTitle,
        filters.smu,
        filters.sortBy,
        filters.sortOrder,
        filters.statusGroup,
        page,
        perPage,
    ])

    useEffect(() => {
        loadLeads()
            .catch(() => undefined)
    }, [loadLeads])

    const handleFiltersChange = useCallback((patch: Partial<EngagementLeadsListFilters>): void => {
        setFilters(currentFilters => {
            const nextFilters = {
                ...currentFilters,
                ...patch,
            }

            if (areLeadFiltersEqual(currentFilters, nextFilters)) {
                return currentFilters
            }

            return nextFilters
        })
        setPage(1)
    }, [])

    const handleSort = useCallback((fieldName: LeadSortField): void => {
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
        setPage(1)
    }, [])

    const handleSortButtonClick = useCallback((event: MouseEvent<HTMLButtonElement>): void => {
        const fieldName = event.currentTarget.dataset.fieldName as LeadSortField | undefined

        if (!fieldName) {
            return
        }

        handleSort(fieldName)
    }, [handleSort])

    const handleCopyIntakeLink = useCallback(async (): Promise<void> => {
        try {
            await copyTextToClipboard(intakeUrl)
            showSuccessToast('Lead intake form link copied to clipboard.')
        } catch (err: unknown) {
            showErrorToast(extractErrorMessage(err, 'Unable to copy link.'))
        }
    }, [intakeUrl])

    const handleCreateEngagementOpen = useCallback((lead: EngagementLead): void => {
        setSelectedLead(lead)
    }, [])

    const handleCreateEngagementCancel = useCallback((): void => {
        setSelectedLead(undefined)
    }, [])

    const handleCreateEngagementConfirm = useCallback((projectId: string): void => {
        if (!selectedLead) {
            return
        }

        const createUrl = withQueryParams(
            `${rootRoute}/projects/${encodeURIComponent(projectId)}/engagements/new`,
            { leadId: selectedLead.id },
        )

        setSelectedLead(undefined)
        navigate(createUrl)
    }, [navigate, selectedLead])

    const handleViewEngagement = useCallback(async (engagementId: string): Promise<void> => {
        if (viewingEngagementId) {
            return
        }

        setViewingEngagementId(engagementId)

        try {
            const engagement = await fetchEngagement(engagementId)
            const projectId = String(engagement.projectId || engagement.project?.id || '')
                .trim()

            if (!projectId) {
                showErrorToast('Unable to locate the project for this engagement.')
                return
            }

            navigate(`${rootRoute}/projects/${projectId}/engagements/${engagementId}/view`)
        } catch (err: unknown) {
            showErrorToast(extractErrorMessage(err, 'Unable to open engagement.'))
        } finally {
            setViewingEngagementId(undefined)
        }
    }, [navigate, viewingEngagementId])

    const getLeadDetailUrl = useCallback((leadId: string): string => (
        `${rootRoute}/${engagementLeadsRouteId}/${leadId}`
    ), [])

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <p className={styles.description}>
                    Review engagement requirements submitted through the public intake form.
                </p>
                <Button
                    label='Copy Lead Form Link'
                    onClick={() => {
                        handleCopyIntakeLink()
                            .catch(() => undefined)
                    }}
                    primary
                    size='md'
                />
            </div>

            <EngagementLeadsFilter
                filters={filters}
                onFiltersChange={handleFiltersChange}
            />

            {loading && <LoadingSpinner />}

            {error && (
                <ErrorMessage
                    message={error}
                    onRetry={() => {
                        loadLeads()
                            .catch(() => undefined)
                    }}
                />
            )}

            {!loading && !error && leads.length === 0 && (
                <div className={styles.emptyState}>
                    No engagement leads found.
                </div>
            )}

            {!loading && !error && leads.length > 0 && (
                <>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    {columns.map(column => (
                                        <th
                                            key={column.label}
                                            className={column.compact ? styles.compactColumn : undefined}
                                        >
                                            {column.sortable && column.fieldName
                                                ? (
                                                    <button
                                                        className={styles.sortButton}
                                                        data-field-name={column.fieldName}
                                                        type='button'
                                                        onClick={handleSortButtonClick}
                                                    >
                                                        {getColumnHeaderContent(column)}
                                                        {getSortIndicator(
                                                            filters.sortBy,
                                                            filters.sortOrder,
                                                            column.fieldName,
                                                        )}
                                                    </button>
                                                )
                                                : (
                                                    <span>{getColumnHeaderContent(column)}</span>
                                                )}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {leads.map(lead => (
                                    <tr key={lead.id}>
                                        <td>
                                            <Link
                                                className={styles.link}
                                                to={getLeadDetailUrl(lead.id)}
                                            >
                                                {lead.id}
                                            </Link>
                                        </td>
                                        <td>{lead.accountName}</td>
                                        <td>{lead.workEmail}</td>
                                        <td>{lead.smu}</td>
                                        <td>{lead.roleTitle}</td>
                                        <td>{formatLeadLabel(String(lead.experienceLevel))}</td>
                                        <td className={styles.compactCell}>{lead.resourcesRequired}</td>
                                        <td>{formatLeadDate(lead.preferredStartDate)}</td>
                                        <td className={styles.compactCell}>{lead.engagementDuration}</td>
                                        <td className={getPriorityClassName(String(lead.priority))}>
                                            {formatLeadLabel(String(lead.priority))}
                                        </td>
                                        <td>
                                            <span
                                                className={classNames(
                                                    styles.statusPill,
                                                    getLeadDisplayStatusClassName(
                                                        String(lead.status),
                                                        styles,
                                                    ),
                                                )}
                                            >
                                                {getLeadDisplayStatus(String(lead.status))}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.ageCell}>
                                                <span>{formatLeadAge(lead.createdAt)}</span>
                                                <span className={styles.createdDate}>
                                                    {formatLeadDate(lead.createdAt)}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                {lead.convertedEngagementId
                                                    ? (
                                                        <Tooltip
                                                            content='View Engagement'
                                                            triggerOn='click-hover'
                                                        >
                                                            <button
                                                                aria-label='View Engagement'
                                                                className={styles.actionIconButton}
                                                                disabled={
                                                                    viewingEngagementId
                                                                        === lead.convertedEngagementId
                                                                }
                                                                type='button'
                                                                onClick={() => {
                                                                    handleViewEngagement(
                                                                        lead.convertedEngagementId as string,
                                                                    )
                                                                        .catch(() => undefined)
                                                                }}
                                                            >
                                                                <IconOutline.EyeIcon
                                                                    aria-hidden
                                                                    className={styles.actionIcon}
                                                                />
                                                            </button>
                                                        </Tooltip>
                                                    )
                                                    : canCreateEngagementFromLead(String(lead.status))
                                                        ? (
                                                            <Tooltip
                                                                content='Create Engagement'
                                                                triggerOn='click-hover'
                                                            >
                                                                <button
                                                                    aria-label='Create Engagement'
                                                                    className={styles.actionIconButton}
                                                                    type='button'
                                                                    onClick={() => {
                                                                        handleCreateEngagementOpen(lead)
                                                                    }}
                                                                >
                                                                    <IconOutline.PlusIcon
                                                                        aria-hidden
                                                                        className={styles.actionIcon}
                                                                    />
                                                                </button>
                                                            </Tooltip>
                                                        )
                                                        : (
                                                            <span className={styles.actionMuted}>
                                                                —
                                                            </span>
                                                        )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        page={page}
                        perPage={perPage}
                        total={totalCount}
                        itemLabel='leads'
                        onPageChange={setPage}
                        onPerPageChange={(nextPerPage: number) => {
                            setPerPage(nextPerPage)
                            setPage(1)
                        }}
                    />
                </>
            )}

            {selectedLead && (
                <CreateEngagementFromLeadModal
                    accountName={selectedLead.accountName}
                    isOpen
                    leadId={selectedLead.id}
                    roleTitle={selectedLead.roleTitle}
                    onCancel={handleCreateEngagementCancel}
                    onConfirm={handleCreateEngagementConfirm}
                />
            )}
        </div>
    )
}

export default EngagementLeadsTab
