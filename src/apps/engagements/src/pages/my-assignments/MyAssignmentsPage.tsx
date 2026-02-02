import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { EnvironmentConfig } from '~/config'
import { useProfileContext } from '~/libs/core'
import { Button, ContentLayout, IconOutline, LoadingSpinner } from '~/libs/ui'
import { Pagination } from '~/apps/admin/src/lib/components/common/Pagination'

import { APPLICATIONS_PER_PAGE } from '../../config/constants'
import type { Engagement, EngagementAssignment } from '../../lib/models'
import {
    acceptAssignmentOffer,
    getMyAssignedEngagements,
    rejectAssignmentOffer,
} from '../../lib/services/engagements.service'
import {
    AssignmentCard,
    AssignmentOfferModal,
    EngagementsTabs,
    MemberExperienceModal,
} from '../../components'
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

const getShowEmptyState = (
    loading: boolean,
    error: string | undefined,
    assignments: Engagement[],
): boolean => (
    !loading && !error && assignments.length === 0
)

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
    const [offerModalOpen, setOfferModalOpen] = useState<boolean>(false)
    const [offerAction, setOfferAction] = useState<'accept' | 'reject' | undefined>(undefined)
    const [offerEngagement, setOfferEngagement] = useState<Engagement | undefined>(undefined)
    const [offerAssignment, setOfferAssignment] = useState<EngagementAssignment | undefined>(undefined)
    const [offerSaving, setOfferSaving] = useState<boolean>(false)
    const offerCloseTimeoutRef = useRef<number | undefined>(undefined)

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

            if (offerCloseTimeoutRef.current !== undefined) {
                window.clearTimeout(offerCloseTimeoutRef.current)
                offerCloseTimeoutRef.current = undefined
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

    const handleOpenOfferModal = useCallback((
        engagement: Engagement,
        action: 'accept' | 'reject',
    ) => {
        const assignment = getUserAssignment(engagement)
        if (!assignment) {
            toast.error('Unable to find your assignment for this engagement.')
            return
        }

        if (offerCloseTimeoutRef.current !== undefined) {
            window.clearTimeout(offerCloseTimeoutRef.current)
            offerCloseTimeoutRef.current = undefined
        }

        setOfferEngagement(engagement)
        setOfferAssignment(assignment)
        setOfferAction(action)
        setOfferModalOpen(true)
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

    const handleCloseOfferModal = useCallback(() => {
        setOfferModalOpen(false)

        if (offerCloseTimeoutRef.current !== undefined) {
            window.clearTimeout(offerCloseTimeoutRef.current)
            offerCloseTimeoutRef.current = undefined
        }

        offerCloseTimeoutRef.current = window.setTimeout(() => {
            setOfferEngagement(undefined)
            setOfferAssignment(undefined)
            setOfferAction(undefined)
            offerCloseTimeoutRef.current = undefined
        }, 200)
    }, [])

    const handleConfirmOffer = useCallback(async (): Promise<void> => {
        if (offerSaving || !offerEngagement || !offerAssignment || !offerAction) {
            return
        }

        setOfferSaving(true)

        try {
            if (offerAction === 'accept') {
                await acceptAssignmentOffer(offerEngagement.id, offerAssignment.id)
                toast.success('Offer accepted. Your assignment is now active.')
            } else {
                await rejectAssignmentOffer(offerEngagement.id, offerAssignment.id)
                toast.success('Offer rejected.')
            }

            await fetchAssignments()
            handleCloseOfferModal()
        } catch (err: any) {
            const message = err?.response?.data?.message
                || err?.message
                || 'Unable to update the offer status. Please try again.'
            toast.error(message)
        } finally {
            setOfferSaving(false)
        }
    }, [
        fetchAssignments,
        handleCloseOfferModal,
        offerAction,
        offerAssignment,
        offerEngagement,
        offerSaving,
    ])

    const skeletonCards = useMemo(() => Array.from({ length: 6 }, (_, index) => index), [])
    const showEmptyState = getShowEmptyState(loading, error, assignments)
    const showExperienceModal = useMemo(
        () => [selectedEngagement, selectedAssignmentId].every(Boolean),
        [selectedEngagement, selectedAssignmentId],
    )
    const showOfferModal = useMemo(
        () => [offerEngagement, offerAssignment, offerAction].every(Boolean),
        [offerAction, offerAssignment, offerEngagement],
    )

    const renderLoadingState = (): JSX.Element | undefined => {
        if (!loading) {
            return undefined
        }

        return (
            <div className={styles.loadingState}>
                <LoadingSpinner className={styles.loadingSpinner} />
                <span>Loading your assignments...</span>
            </div>
        )
    }

    return (
        <ContentLayout title='My Assignments' contentClass={styles.pageContent}>
            <EngagementsTabs activeTab='assignments' />
            {renderLoadingState()}
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

                        const handleAcceptOfferClick = function (): void {
                            handleOpenOfferModal(engagement, 'accept')
                        }

                        const handleRejectOfferClick = function (): void {
                            handleOpenOfferModal(engagement, 'reject')
                        }

                        return (
                            <AssignmentCard
                                key={engagement.id}
                                engagement={engagement}
                                assignment={assignment}
                                contactEmail={contactEmail}
                                onViewPayments={handleViewPayments}
                                onDocumentExperience={handleDocumentExperienceClick}
                                onAcceptOffer={handleAcceptOfferClick}
                                onRejectOffer={handleRejectOfferClick}
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
            {showExperienceModal && (
                <MemberExperienceModal
                    open={modalOpen}
                    onClose={handleCloseModal}
                    engagement={selectedEngagement as Engagement}
                    assignmentId={selectedAssignmentId as string}
                />
            )}
            {showOfferModal && (
                <AssignmentOfferModal
                    open={offerModalOpen}
                    onClose={handleCloseOfferModal}
                    onConfirm={handleConfirmOffer}
                    engagement={offerEngagement as Engagement}
                    assignment={offerAssignment as EngagementAssignment}
                    mode={offerAction as 'accept' | 'reject'}
                    loading={offerSaving}
                />
            )}
        </ContentLayout>
    )
}

export default MyAssignmentsPage
