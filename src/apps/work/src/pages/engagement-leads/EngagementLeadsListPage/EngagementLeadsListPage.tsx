/* eslint-disable react/jsx-no-bind */

import {
    FC,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { PageWrapper } from '~/apps/review/src/lib'
import { Button } from '~/libs/ui'

import {
    engagementLeadsRouteId,
    rootRoute,
} from '../../../config/routes.config'
import {
    ENGAGEMENTS_APP_URL,
    PAGE_SIZE,
} from '../../../lib/constants'
import {
    EngagementLead,
    EngagementLeadStatus,
} from '../../../lib/models/EngagementLead.model'
import {
    fetchEngagementLeads,
} from '../../../lib/services/engagement-leads.service'
import {
    ErrorMessage,
    LoadingSpinner,
    Pagination,
} from '../../../lib/components'
import {
    extractErrorMessage,
} from '../../../lib/utils'

import styles from './EngagementLeadsListPage.module.scss'

function formatStatusLabel(status: string): string {
    return status
        .toLowerCase()
        .replace(/_/g, ' ')
}

function getStatusClassName(status: string): string {
    switch (status) {
        case EngagementLeadStatus.UNDER_REVIEW:
            return styles.statusUnderReview
        case EngagementLeadStatus.QUALIFIED:
            return styles.statusQualified
        case EngagementLeadStatus.CONVERTED:
            return styles.statusConverted
        case EngagementLeadStatus.REJECTED:
            return styles.statusRejected
        default:
            return styles.statusSubmitted
    }
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

function formatDate(value: string): string {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleDateString()
}

export const EngagementLeadsListPage: FC = () => {
    const [leads, setLeads] = useState<EngagementLead[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | undefined>(undefined)
    const [page, setPage] = useState<number>(1)
    const [perPage, setPerPage] = useState<number>(PAGE_SIZE)
    const [totalCount, setTotalCount] = useState<number>(0)
    const [statusFilter, setStatusFilter] = useState<string>('')

    const intakeUrl = useMemo(
        () => `${ENGAGEMENTS_APP_URL}/intake`,
        [],
    )

    const loadLeads = useCallback(async (): Promise<void> => {
        setLoading(true)
        setError(undefined)

        try {
            const response = await fetchEngagementLeads({
                page,
                perPage,
                status: statusFilter || undefined,
            })

            setLeads(response.data)
            setTotalCount(response.meta.totalCount || 0)
        } catch (err: unknown) {
            setError(extractErrorMessage(err, 'Unable to load engagement leads.'))
        } finally {
            setLoading(false)
        }
    }, [page, perPage, statusFilter])

    useEffect(() => {
        loadLeads()
            .catch(() => undefined)
    }, [loadLeads])

    const handleStatusFilterChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        setStatusFilter(event.target.value)
        setPage(1)
    }, [])

    return (
        <PageWrapper
            breadCrumb={[]}
            pageTitle='Engagement Leads'
        >
            <div className={styles.container}>
                <div className={styles.header}>
                    <p className={styles.intakeLink}>
                        Public intake form:
                        {' '}
                        <a href={intakeUrl} rel='noopener noreferrer' target='_blank'>
                            {intakeUrl}
                        </a>
                    </p>
                    <div className={styles.filters}>
                        <select
                            className={styles.filterSelect}
                            value={statusFilter}
                            onChange={handleStatusFilterChange}
                        >
                            <option value=''>All statuses</option>
                            <option value={EngagementLeadStatus.SUBMITTED}>Submitted</option>
                            <option value={EngagementLeadStatus.UNDER_REVIEW}>Under Review</option>
                            <option value={EngagementLeadStatus.QUALIFIED}>Qualified</option>
                            <option value={EngagementLeadStatus.CONVERTED}>Converted</option>
                            <option value={EngagementLeadStatus.REJECTED}>Rejected</option>
                        </select>
                        <Button secondary onClick={() => loadLeads()}>
                            Refresh
                        </Button>
                    </div>
                </div>

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
                                        <th>Account</th>
                                        <th>Role Title</th>
                                        <th>SPOC Email</th>
                                        <th>Priority</th>
                                        <th>Status</th>
                                        <th>Submitted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.map(lead => (
                                        <tr key={lead.id}>
                                            <td>
                                                <Link
                                                    className={styles.rowLink}
                                                    to={`${rootRoute}/${engagementLeadsRouteId}/${lead.id}`}
                                                >
                                                    {lead.accountName}
                                                </Link>
                                            </td>
                                            <td>{lead.roleTitle}</td>
                                            <td>{lead.workEmail}</td>
                                            <td className={getPriorityClassName(String(lead.priority))}>
                                                {formatStatusLabel(String(lead.priority))}
                                            </td>
                                            <td>
                                                <span
                                                    className={classNames(
                                                        styles.statusPill,
                                                        getStatusClassName(String(lead.status)),
                                                    )}
                                                >
                                                    {formatStatusLabel(String(lead.status))}
                                                </span>
                                            </td>
                                            <td>{formatDate(lead.createdAt)}</td>
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
            </div>
        </PageWrapper>
    )
}

export default EngagementLeadsListPage
