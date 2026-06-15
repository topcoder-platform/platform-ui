import {
    ChangeEvent,
    CSSProperties,
    FC,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { Navigate } from 'react-router-dom'

import { EnvironmentConfig } from '~/config'
import { ReportsAppContext, ReportsAppContextModel } from '~/apps/reports/src/lib'
import { Pagination } from '~/apps/admin/src/lib'
import { UserRole } from '~/libs/core'
import {
    Button,
    IconOutline,
    LoadingSpinner,
    PageTitle,
} from '~/libs/ui'

import {
    downloadBlobFile,
    downloadOpenToWorkTalentCsv,
    fetchOpenToWorkTalent,
    OpenToWorkTalentAvailability,
    OpenToWorkTalentMember,
    OpenToWorkTalentResponse,
    OpenToWorkTalentRoleCount,
} from '../../lib/services'
import { handleError } from '../../lib/utils'
import { reportsPageRouteId, rootRoute } from '../../config/routes.config'

import {
    formatAvailability,
    formatMemberSince,
    formatPreferredRole,
} from './TalentPage.utils'
import styles from './TalentPage.module.scss'

const pageTitle = 'Talent'
const rowsPerPageOptions = [10, 25, 50]
const chartColors = [
    '#0f62fe',
    '#2ebac6',
    '#6aae3f',
    '#ff8a00',
    '#6c5ce7',
    '#e82f72',
    '#f6b31a',
    '#2d7f75',
    '#8f6448',
    '#aeb5c8',
    '#4b7bec',
    '#d653a3',
]

const reportsLandingRoute = rootRoute || `/${reportsPageRouteId}`

type TalentRoleSegment = OpenToWorkTalentRoleCount & {
    color: string
    label: string
    percent: number
}

type AvailabilityOption = {
    label: string
    value?: OpenToWorkTalentAvailability
}

const availabilityOptions: AvailabilityOption[] = [
    { label: 'All', value: undefined },
    { label: 'Full-time', value: 'FULL_TIME' },
    { label: 'Part-time', value: 'PART_TIME' },
]

/**
 * Returns true when the loaded token belongs to an administrator.
 * @param roles Roles from the decoded Topcoder token.
 * @returns Whether the role list includes the administrator role.
 */
function hasAdministratorRole(roles?: string[]): boolean {
    return !!roles?.some(role => role.toLowerCase() === UserRole.administrator)
}

/**
 * Builds the conic-gradient background used by the role summary chart.
 * @param segments Role count segments with colors and percentages.
 * @returns CSS background value for the donut chart.
 */
function buildDonutBackground(segments: TalentRoleSegment[]): string {
    if (!segments.length) {
        return '#e8ebf2'
    }

    let cursor = 0
    const stops = segments.map(segment => {
        const start = cursor
        const end = cursor + segment.percent
        cursor = end
        return `${segment.color} ${start}% ${end}%`
    })

    return `conic-gradient(${stops.join(', ')})`
}

/**
 * Formats member first/last name values for table display.
 * @param member Open-to-work member row.
 * @returns Display name, falling back to handle.
 */
function formatMemberName(member: OpenToWorkTalentMember): string {
    const name = [member.firstName, member.lastName]
        .map(value => value?.trim())
        .filter(Boolean)
        .join(' ')

    return name || member.handle
}

/**
 * Admin-only Talent report page for open-to-work members.
 *
 * It fetches preferred-role aggregates, renders a role-filterable member list,
 * and downloads the matching CSV export from reports-api.
 */
// eslint-disable-next-line complexity
const TalentPage: FC = () => {
    const { loginUserInfo }: ReportsAppContextModel = useContext(ReportsAppContext)
    const isAuthLoaded = loginUserInfo !== undefined
    const isAdministrator = hasAdministratorRole(loginUserInfo?.roles)

    const [selectedRole, setSelectedRole] = useState<string | undefined>(undefined)
    const [availability, setAvailability] = useState<OpenToWorkTalentAvailability | undefined>(undefined)
    const [page, setPage] = useState<number>(1)
    const [perPage, setPerPage] = useState<number>(rowsPerPageOptions[0])
    const [data, setData] = useState<OpenToWorkTalentResponse | undefined>(undefined)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isDownloading, setIsDownloading] = useState<boolean>(false)
    const [refreshKey, setRefreshKey] = useState<number>(0)

    const roleSegments = useMemo<TalentRoleSegment[]>(() => {
        const roleTotal = (data?.roleCounts ?? [])
            .reduce((total, roleCount) => total + roleCount.count, 0)

        return (data?.roleCounts ?? []).map((roleCount, index) => ({
            ...roleCount,
            color: chartColors[index % chartColors.length],
            label: formatPreferredRole(roleCount.role),
            percent: roleTotal > 0 ? (roleCount.count / roleTotal) * 100 : 0,
        }))
    }, [data])

    const donutStyle = useMemo<CSSProperties>(() => ({
        background: buildDonutBackground(roleSegments),
    }), [roleSegments])

    const selectedRoleLabel = selectedRole ? formatPreferredRole(selectedRole) : 'All roles'
    const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / perPage))
    const totalShownStart = data?.total ? ((page - 1) * perPage) + 1 : 0
    const totalShownEnd = Math.min(page * perPage, data?.total ?? 0)
    const paginationLabel = `Showing ${totalShownStart}-${totalShownEnd} of ${
        (data?.total ?? 0).toLocaleString()
    } members`

    useEffect(() => {
        if (!isAdministrator) {
            return undefined
        }

        let cancelled = false
        setIsLoading(true)

        fetchOpenToWorkTalent({
            availability,
            page,
            perPage,
            role: selectedRole,
        })
            .then(response => {
                if (!cancelled) {
                    setData(response)
                }
            })
            .catch(handleError)
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [availability, isAdministrator, page, perPage, refreshKey, selectedRole])

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages)
        }
    }, [page, totalPages])

    const handleSelectAllRoles = useCallback(() => {
        setSelectedRole(undefined)
        setPage(1)
    }, [])

    const createHandleRoleClick = useCallback((role: string) => () => {
        setSelectedRole(role)
        setPage(1)
    }, [])

    const createHandleAvailabilityClick = useCallback((
        nextAvailability?: OpenToWorkTalentAvailability,
    ) => () => {
        setAvailability(nextAvailability)
        setPage(1)
    }, [])

    const handleRowsPerPageChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
        setPerPage(Number(event.target.value))
        setPage(1)
    }, [])

    const handleRefresh = useCallback(() => {
        setRefreshKey(key => key + 1)
    }, [])

    const handleDownload = useCallback(async (): Promise<void> => {
        try {
            setIsDownloading(true)
            const blob = await downloadOpenToWorkTalentCsv({
                availability,
                role: selectedRole,
            })
            const rolePart = selectedRole ? selectedRole.toLowerCase() : 'all-roles'
            downloadBlobFile(blob, `open-to-work-talent-${rolePart}.csv`)
        } catch (error) {
            handleError(error)
        } finally {
            setIsDownloading(false)
        }
    }, [availability, selectedRole])

    if (isAuthLoaded && !isAdministrator) {
        return <Navigate to={reportsLandingRoute} replace />
    }

    if (!isAuthLoaded) {
        return <LoadingSpinner />
    }

    return (
        <>
            <PageTitle>{pageTitle}</PageTitle>
            {(isLoading || isDownloading) && (
                <LoadingSpinner
                    overlay
                    message={isDownloading ? 'Generating Report…' : 'Loading talent…'}
                />
            )}

            <div className={styles.page}>
                <div className={styles.header}>
                    <div>
                        <h1>Talent</h1>
                        <p>Open-to-work Topcoder members grouped by preferred role.</p>
                    </div>
                    <div className={styles.headerActions}>
                        <Button
                            secondary
                            icon={IconOutline.RefreshIcon}
                            iconToLeft
                            disabled={isLoading}
                            onClick={handleRefresh}
                        >
                            Refresh
                        </Button>
                        <Button
                            primary
                            icon={IconOutline.DownloadIcon}
                            iconToLeft
                            disabled={isDownloading || isLoading || !data?.totalMembers}
                            onClick={handleDownload}
                        >
                            Download CSV
                        </Button>
                    </div>
                </div>

                <section className={styles.summaryGrid}>
                    <div className={styles.metricPanel}>
                        <span className={styles.panelLabel}>Open to work</span>
                        <strong>{(data?.totalMembers ?? 0).toLocaleString()}</strong>
                        <span className={styles.metricMeta}>members with preferred roles</span>
                    </div>

                    <div className={styles.rolesPanel}>
                        <div className={styles.rolesChartWrap}>
                            <div className={styles.donut} style={donutStyle}>
                                <div className={styles.donutInner}>
                                    <strong>{(data?.totalMembers ?? 0).toLocaleString()}</strong>
                                    <span>members</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.roleList}>
                            <button
                                type='button'
                                className={!selectedRole ? styles.activeRole : ''}
                                onClick={handleSelectAllRoles}
                            >
                                <span className={styles.roleName}>All roles</span>
                                <span>{(data?.totalMembers ?? 0).toLocaleString()}</span>
                            </button>
                            {roleSegments.map(segment => (
                                <button
                                    type='button'
                                    key={segment.role}
                                    className={selectedRole === segment.role ? styles.activeRole : ''}
                                    onClick={createHandleRoleClick(segment.role)}
                                >
                                    <span className={styles.roleName}>
                                        <span
                                            className={styles.swatch}
                                            style={{ backgroundColor: segment.color }}
                                        />
                                        {segment.label}
                                    </span>
                                    <span>{segment.count.toLocaleString()}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                <section className={styles.membersSection}>
                    <div className={styles.membersHeader}>
                        <div>
                            <h2>Members open to work</h2>
                            <span className={styles.countBadge}>{(data?.total ?? 0).toLocaleString()}</span>
                        </div>
                        <div className={styles.filterGroup}>
                            <span>{selectedRoleLabel}</span>
                            <div className={styles.segmentedControl}>
                                {availabilityOptions.map(option => (
                                    <button
                                        type='button'
                                        key={option.value ?? 'all'}
                                        className={availability === option.value ? styles.activeSegment : ''}
                                        onClick={createHandleAvailabilityClick(option.value)}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className={styles.tableWrap}>
                        <table className={styles.membersTable}>
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Preferred roles</th>
                                    <th>Availability</th>
                                    <th>Country</th>
                                    <th>Member since</th>
                                    <th>Rating</th>
                                    <th>Wins</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data?.data ?? []).map(member => (
                                    <tr key={member.userId}>
                                        <td>
                                            <div className={styles.memberCell}>
                                                <strong>{formatMemberName(member)}</strong>
                                                <span>{member.handle}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.roleChips}>
                                                {member.preferredRoles.map(role => (
                                                    <span key={role}>{formatPreferredRole(role)}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>{formatAvailability(member.availability)}</td>
                                        <td>{member.country || 'Not available'}</td>
                                        <td>{formatMemberSince(member.memberSince)}</td>
                                        <td>{member.maxRating ?? 'Not rated'}</td>
                                        <td>{member.totalWins.toLocaleString()}</td>
                                        <td>
                                            <a
                                                className={styles.profileLink}
                                                href={`${EnvironmentConfig.USER_PROFILE_URL}/${member.handle}`}
                                                target='_blank'
                                                rel='noreferrer'
                                            >
                                                View profile
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {!isLoading && data?.data.length === 0 && (
                            <div className={styles.emptyState}>No members match the selected filters.</div>
                        )}
                    </div>

                    <div className={styles.paginationBar}>
                        <span>{paginationLabel}</span>
                        <div className={styles.rowsControl}>
                            <label htmlFor='talent-rows-per-page'>Rows per page</label>
                            <select
                                id='talent-rows-per-page'
                                value={perPage}
                                onChange={handleRowsPerPageChange}
                            >
                                {rowsPerPageOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            disabled={isLoading}
                        />
                    </div>
                </section>
            </div>
        </>
    )
}

export default TalentPage
