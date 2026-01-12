import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useProfileContext } from '~/libs/core'
import { Button, ContentLayout, IconOutline, InputSelect, LoadingSpinner, TabsNavbar, TabsNavItem } from '~/libs/ui'
import { Pagination } from '~/apps/admin/src/lib/components/common/Pagination'

import { APPLICATIONS_PER_PAGE } from '../../config/constants'
import { Application, ApplicationStatus } from '../../lib/models'
import { getMyApplications } from '../../lib/services/applications.service'
import { ApplicationCard } from '../../components/application-card'
import { ApplicationDetailModal } from '../../components/application-detail-modal'
import { rootRoute } from '../../engagements.routes'

import styles from './MyApplicationsPage.module.scss'

type ApplicationsTab = 'active' | 'past'
type StatusFilterValue = ApplicationStatus | 'all'

const ACTIVE_STATUSES = [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW]
const PAST_STATUSES = [ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED]

const PER_PAGE = APPLICATIONS_PER_PAGE

const MyApplicationsPage: FC = () => {
    const navigate = useNavigate()
    const profileContext = useProfileContext()
    const isLoggedIn = profileContext.isLoggedIn

    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | undefined>(undefined)
    const [page, setPage] = useState<number>(1)
    const [totalPages, setTotalPages] = useState<number>(1)
    const [activeTab, setActiveTab] = useState<ApplicationsTab>('active')
    const [selectedStatus, setSelectedStatus] = useState<StatusFilterValue>('all')
    const [selectedApplication, setSelectedApplication] = useState<Application | undefined>()
    const [modalOpen, setModalOpen] = useState<boolean>(false)

    const tabsConfig = useMemo<TabsNavItem<ApplicationsTab>[]>(() => ([
        { id: 'active', title: 'Active' },
        { id: 'past', title: 'Past' },
    ]), [])

    const statusOptions = useMemo(() => (
        activeTab === 'active'
            ? [
                { label: 'All Active', value: 'all' },
                { label: 'Submitted', value: ApplicationStatus.SUBMITTED },
                { label: 'Under Review', value: ApplicationStatus.UNDER_REVIEW },
            ]
            : [
                { label: 'All Past', value: 'all' },
                { label: 'Accepted', value: ApplicationStatus.ACCEPTED },
                { label: 'Rejected', value: ApplicationStatus.REJECTED },
            ]
    ), [activeTab])

    const statusFilter = useMemo(() => {
        if (selectedStatus === 'all') {
            return (activeTab === 'active' ? ACTIVE_STATUSES : PAST_STATUSES).join(',')
        }

        return selectedStatus
    }, [activeTab, selectedStatus])

    const fetchApplications = useCallback(async (): Promise<void> => {
        if (!isLoggedIn) {
            return
        }

        setLoading(true)
        setError(undefined)

        try {
            const response = await getMyApplications({
                page,
                perPage: PER_PAGE,
                status: statusFilter,
            })
            setApplications(response.data)
            setTotalPages(response.totalPages || 1)
        } catch (err) {
            setError('Unable to load your applications. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [page, statusFilter, isLoggedIn])

    useEffect(() => {
        fetchApplications()
    }, [fetchApplications])

    const handleTabChange = useCallback((tabId: ApplicationsTab) => {
        setActiveTab(tabId)
        setPage(1)
        setSelectedStatus('all')
    }, [])

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
    const emptyMessage = activeTab === 'active'
        ? "You haven't applied to any engagements yet."
        : 'No past applications.'

    return (
        <ContentLayout title='My Applications' contentClass={styles.pageContent}>
            <div className={styles.controls}>
                <div className={styles.tabs}>
                    <TabsNavbar
                        defaultActive={activeTab}
                        onChange={handleTabChange}
                        tabs={tabsConfig}
                    />
                </div>
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
