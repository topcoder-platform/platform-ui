import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { EnvironmentConfig } from '~/config'
import { useProfileContext } from '~/libs/core'
import { Button, ContentLayout, IconOutline, LoadingSpinner } from '~/libs/ui'
import { Pagination } from '~/apps/admin/src/lib/components/common/Pagination'

import { APPLICATIONS_PER_PAGE } from '../../config/constants'
import type { Engagement, EngagementAssignment } from '../../lib/models'
import { getMyAssignedEngagements } from '../../lib/services/engagements.service'
import { AssignmentCard, EngagementsTabs, MemberExperienceModal } from '../../components'
import { rootRoute } from '../../engagements.routes'

import styles from './MyAssignmentsPage.module.scss'

const PER_PAGE = APPLICATIONS_PER_PAGE
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const IP_ADDRESS_PATTERN = /^(?:\d{1,3}\.){3}\d{1,3}$/

const getBaseDomainFromHostname = (hostname: string): string | undefined => {
    const normalized = hostname.trim()
        .toLowerCase()
    if (!normalized || normalized === 'localhost' || normalized.endsWith('.localhost')) {
        return undefined
    }

    if (IP_ADDRESS_PATTERN.test(normalized)) {
        return undefined
    }

    const parts = normalized.split('.')
        .filter(Boolean)
    if (parts.length < 2) {
        return undefined
    }

    return parts.slice(-2)
        .join('.')
}

const normalizeContactEmail = (contactEmail?: string): string | undefined => {
    const normalized = contactEmail?.trim()
    if (!normalized) {
        return undefined
    }

    const email = normalized.replace(/^mailto:/i, '')
    if (!EMAIL_PATTERN.test(email)) {
        return undefined
    }

    return email
}

const MyAssignmentsPage: FC = () => {
    const navigate = useNavigate()
    const profileContext = useProfileContext()
    const isLoggedIn = profileContext.isLoggedIn
    const userId = profileContext.profile?.userId

    const [assignments, setAssignments] = useState<Engagement[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | undefined>(undefined)
    const [page, setPage] = useState<number>(1)
    const [totalPages, setTotalPages] = useState<number>(1)
    const [selectedEngagement, setSelectedEngagement] = useState<Engagement | undefined>(undefined)
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | undefined>(undefined)
    const [modalOpen, setModalOpen] = useState<boolean>(false)
    const closeTimeoutRef = useRef<number | undefined>(undefined)

    const fetchAssignments = useCallback(async (): Promise<void> => {
        if (!isLoggedIn) {
            return
        }

        setLoading(true)
        setError(undefined)

        try {
            const response = await getMyAssignedEngagements({
                page,
                perPage: PER_PAGE,
            })
            setAssignments(response.data)
            setTotalPages(response.totalPages || 1)
        } catch (err) {
            setError('Unable to load your assignments. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [isLoggedIn, page])

    useEffect(() => {
        fetchAssignments()
    }, [fetchAssignments])

    useEffect(() => (
        () => {
            if (closeTimeoutRef.current !== undefined) {
                window.clearTimeout(closeTimeoutRef.current)
                closeTimeoutRef.current = undefined
            }
        }
    ), [])

    const handlePageChange = useCallback((nextPage: number) => {
        setPage(nextPage)
    }, [])

    const handleRetry = useCallback(() => {
        fetchAssignments()
    }, [fetchAssignments])

    const handleBrowseEngagements = useCallback(() => {
        navigate(rootRoute || '/')
    }, [navigate])

    const handleViewPayments = useCallback(() => {
        const hostname = typeof window === 'undefined' ? '' : window.location.hostname
        const baseDomain = getBaseDomainFromHostname(hostname)
        const walletHost = baseDomain ? `wallet.${baseDomain}` : `wallet.${EnvironmentConfig.TC_DOMAIN}`
        window.open(`https://${walletHost}`, '_blank')
    }, [])

    const handleContactTalentManager = useCallback((contactEmail?: string) => {
        if (!contactEmail) {
            return
        }

        window.open(`mailto:${contactEmail}`, '_blank')
    }, [])

    const getUserAssignment = useCallback((engagement: Engagement): EngagementAssignment | undefined => {
        if (!userId) {
            return undefined
        }

        return engagement.assignments?.find(
            candidate => candidate.memberId === String(userId),
        )
    }, [userId])

    const handleDocumentExperience = useCallback((engagement: Engagement) => {
        const assignment = getUserAssignment(engagement)
        const assignmentId = assignment?.id

        if (!assignmentId) {
            toast.error('Unable to find your assignment for this engagement.')
            return
        }

        if (closeTimeoutRef.current !== undefined) {
            window.clearTimeout(closeTimeoutRef.current)
            closeTimeoutRef.current = undefined
        }

        setSelectedEngagement(engagement)
        setSelectedAssignmentId(assignmentId)
        setModalOpen(true)
    }, [getUserAssignment])

    const handleCloseModal = useCallback(() => {
        setModalOpen(false)

        if (closeTimeoutRef.current !== undefined) {
            window.clearTimeout(closeTimeoutRef.current)
            closeTimeoutRef.current = undefined
        }

        closeTimeoutRef.current = window.setTimeout(() => {
            setSelectedEngagement(undefined)
            setSelectedAssignmentId(undefined)
            closeTimeoutRef.current = undefined
        }, 200)
    }, [])

    const skeletonCards = useMemo(() => Array.from({ length: 6 }, (_, index) => index), [])
    const showEmptyState = !loading && !error && assignments.length === 0

    return (
        <ContentLayout title='My Assignments' contentClass={styles.pageContent}>
            <EngagementsTabs activeTab='assignments' />
            {loading && (
                <div className={styles.loadingState}>
                    <LoadingSpinner className={styles.loadingSpinner} />
                    <span>Loading your assignments...</span>
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
                    <h3>No assignments yet.</h3>
                    <p>Browse current engagements to find your next opportunity.</p>
                    <Button label='Browse Engagements' secondary onClick={handleBrowseEngagements} />
                </div>
            )}
            {!error && (
                <div className={styles.grid}>
                    {loading ? skeletonCards.map(card => (
                        <div key={`skeleton-${card}`} className={styles.skeletonCard} />
                    )) : assignments.map(engagement => {
                        const contactEmail = normalizeContactEmail(engagement.createdByEmail)
                        const assignment = getUserAssignment(engagement)
                        const handleDocumentExperienceClick = function (): void {
                            handleDocumentExperience(engagement)
                        }

                        return (
                            <AssignmentCard
                                key={engagement.id}
                                engagement={engagement}
                                assignment={assignment}
                                contactEmail={contactEmail}
                                onViewPayments={handleViewPayments}
                                onDocumentExperience={handleDocumentExperienceClick}
                                onContactTalentManager={handleContactTalentManager}
                                canContactTalentManager={Boolean(contactEmail)}
                            />
                        )
                    })}
                </div>
            )}
            {!error && assignments.length > 0 && (
                <div className={styles.pagination}>
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        disabled={loading}
                    />
                </div>
            )}
            {selectedEngagement && selectedAssignmentId && (
                <MemberExperienceModal
                    open={modalOpen}
                    onClose={handleCloseModal}
                    engagement={selectedEngagement}
                    assignmentId={selectedAssignmentId}
                />
            )}
        </ContentLayout>
    )
}

export default MyAssignmentsPage
