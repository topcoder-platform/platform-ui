import { ChangeEvent, FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useProfileContext } from '~/libs/core'
import { Button, ContentLayout, IconOutline, InputSelect, LoadingSpinner } from '~/libs/ui'
import { Pagination } from '~/apps/admin/src/lib/components/common/Pagination'

import { APPLICATIONS_PER_PAGE } from '../../config/constants'
import { Application, ApplicationStatus, Engagement } from '../../lib/models'
import { getMyApplications } from '../../lib/services/applications.service'
import { getEngagementById } from '../../lib/services/engagements.service'
import { ApplicationCard } from '../../components/application-card'
import { ApplicationDetailModal } from '../../components/application-detail-modal'
import { EngagementsTabs } from '../../components'
import { rootRoute } from '../../engagements.routes'

import styles from './MyApplicationsPage.module.scss'

type StatusFilterValue = ApplicationStatus | 'active' | 'past'

const ACTIVE_STATUSES = [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW]
const PAST_STATUSES = [ApplicationStatus.SELECTED, ApplicationStatus.REJECTED]

const PER_PAGE = APPLICATIONS_PER_PAGE

const MyApplicationsPage: FC = () => {
    const navigate = useNavigate()
    const profileContext = useProfileContext()
    const isLoggedIn = profileContext.isLoggedIn
    const userId = profileContext.profile?.userId

    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | undefined>(undefined)
    const [page, setPage] = useState<number>(1)
    const [totalPages, setTotalPages] = useState<number>(1)
    const [selectedStatus, setSelectedStatus] = useState<StatusFilterValue>('active')
    const [selectedApplication, setSelectedApplication] = useState<Application | undefined>()
    const [modalOpen, setModalOpen] = useState<boolean>(false)
    const engagementCacheRef = useRef<Map<string, Engagement>>(new Map())

    const statusOptions = useMemo(() => (
        [
            { label: 'All Active', value: 'active' },
            { label: 'Submitted', value: ApplicationStatus.SUBMITTED },
            { label: 'Under Review', value: ApplicationStatus.UNDER_REVIEW },
            { label: 'All Past', value: 'past' },
            { label: 'Selected', value: ApplicationStatus.SELECTED },
            { label: 'Rejected', value: ApplicationStatus.REJECTED },
        ]
    ), [])

    const statusFilter = useMemo(() => {
        if (selectedStatus === 'active') {
            return ACTIVE_STATUSES.join(',')
        }

        if (selectedStatus === 'past') {
            return PAST_STATUSES.join(',')
        }

        return selectedStatus
    }, [selectedStatus])

    const hydrateApplications = useCallback(async (
        applicationsToHydrate: Application[],
    ): Promise<Application[]> => {
        if (!applicationsToHydrate.length) {
            return applicationsToHydrate
        }

        const cache = engagementCacheRef.current
        applicationsToHydrate.forEach(application => {
            if (application.engagement) {
                cache.set(application.engagement.id || application.engagementId, application.engagement)
            }
        })

        const engagementIds = Array.from(new Set(
            applicationsToHydrate
                .map(application => application.engagementId)
                .filter(Boolean),
        ))
        const missingEngagementIds = engagementIds.filter(id => !cache.has(id))

        if (missingEngagementIds.length) {
            await Promise.all(missingEngagementIds.map(async engagementId => {
                try {
                    const engagement = await getEngagementById(engagementId)
                    cache.set(engagementId, engagement)
                } catch (err) {
                    // Keep application data even if engagement lookup fails.
                }
            }))
        }

        return applicationsToHydrate.map(application => {
            if (application.engagement) {
                return application
            }

            const engagement = cache.get(application.engagementId)
            if (!engagement) {
                return application
            }

            return {
                ...application,
                engagement,
            }
        })
    }, [])

    const fetchApplications = useCallback(async (): Promise<void> => {
        if (!isLoggedIn || userId === undefined) {
            return
        }

        setLoading(true)
        setError(undefined)

        try {
            const response = await getMyApplications({
                page,
                perPage: PER_PAGE,
                status: statusFilter,
                userId,
            })
            const hydratedApplications = await hydrateApplications(response.data)
            setApplications(hydratedApplications)
            setTotalPages(response.totalPages || 1)
        } catch (err) {
            setError('Unable to load your applications. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [page, statusFilter, isLoggedIn, hydrateApplications, userId])

    useEffect(() => {
        fetchApplications()
    }, [fetchApplications])

    const handleStatusChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setSelectedStatus(event.target.value as StatusFilterValue)
        setPage(1)
    }, [])

    const handlePageChange = useCallback((nextPage: number) => {
        setPage(nextPage)
    }, [])

    const handleApplicationClick = useCallback(
        (application: Application) => (): void => {
            setSelectedApplication(application)
            setModalOpen(true)
        },
        [],
    )

    const handleCloseModal = useCallback(() => {
        setModalOpen(false)
        setSelectedApplication(undefined)
    }, [])

    const handleViewEngagement = useCallback(() => {
        if (!selectedApplication?.engagement?.nanoId) {
            return
        }

        setModalOpen(false)
        navigate(`${rootRoute}/${selectedApplication.engagement.nanoId}`)
    }, [navigate, selectedApplication])

    const handleRetry = useCallback(() => {
        fetchApplications()
    }, [fetchApplications])

    const handleBrowseEngagements = useCallback(() => {
        navigate(rootRoute || '/')
    }, [navigate])

    const skeletonCards = useMemo(() => Array.from({ length: 6 }, (_, index) => index), [])

    const showEmptyState = !loading && !error && applications.length === 0
    const selectedStatusLabel = useMemo(() => {
        if (selectedStatus === 'active' || selectedStatus === 'past') {
            return undefined
        }

        const option = statusOptions.find(statusOption => statusOption.value === selectedStatus)
        return option?.label ?? selectedStatus
    }, [selectedStatus, statusOptions])
    const emptyMessage = selectedStatusLabel
        ? `You haven't applied to any engagements with status ${selectedStatusLabel}.`
        : selectedStatus === 'past'
            ? 'No past applications.'
            : "You don't have any active applications yet."

    return (
        <ContentLayout title='My Applications' contentClass={styles.pageContent}>
            <EngagementsTabs activeTab='applications' />
            <div className={styles.controls}>
                <div className={styles.statusFilter}>
                    <InputSelect
                        label='Status'
                        name='status'
                        options={statusOptions}
                        value={selectedStatus}
                        onChange={handleStatusChange}
                    />
                </div>
            </div>
            {loading && (
                <div className={styles.loadingState}>
                    <LoadingSpinner className={styles.loadingSpinner} />
                    <span>Loading your applications...</span>
                </div>
            )}
            {error && (
                <div className={styles.errorState}>
                    <IconOutline.ExclamationIcon className={styles.errorIcon} />
                    <div>
                        <p className={styles.errorText}>{error}</p>
                        <Button label='Retry' onClick={handleRetry} primary />
                    </div>
                </div>
            )}
            {showEmptyState && (
                <div className={styles.emptyState}>
                    <IconOutline.SearchIcon className={styles.emptyIcon} />
                    <h3>{emptyMessage}</h3>
                    <p>Browse current engagements to find your next opportunity.</p>
                    <Button label='Browse Engagements' secondary onClick={handleBrowseEngagements} />
                </div>
            )}
            {!error && (
                <div className={styles.grid}>
                    {loading ? skeletonCards.map(card => (
                        <div key={`skeleton-${card}`} className={styles.skeletonCard} />
                    )) : applications.map(application => (
                        <ApplicationCard
                            key={application.id}
                            application={application}
                            onClick={handleApplicationClick(application)}
                        />
                    ))}
                </div>
            )}
            {!error && applications.length > 0 && (
                <div className={styles.pagination}>
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        disabled={loading}
                    />
                </div>
            )}
            <ApplicationDetailModal
                application={selectedApplication}
                open={modalOpen}
                onClose={handleCloseModal}
                onViewEngagement={handleViewEngagement}
            />
        </ContentLayout>
    )
}

export default MyApplicationsPage
