import { ChangeEvent, FC, FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { authUrlLogin, useProfileContext, UserRole } from '~/libs/core'
import { BaseModal, Button, ContentLayout, IconOutline, IconSolid, LoadingSpinner } from '~/libs/ui'
import { copyTextToClipboard } from '~/libs/shared'

import type {
    Application,
    CreateFeedbackRequest,
    Engagement,
    Feedback,
    GenerateFeedbackLinkResponse,
} from '../../lib/models'
import { ApplicationStatus, EngagementStatus } from '../../lib/models'
import {
    checkExistingApplication,
    createFeedback,
    generateFeedbackLink,
    getEngagementByNanoId,
    getFeedbackForEngagement,
} from '../../lib/services'
import {
    formatDate,
    formatDeadlineCountdown,
    formatDuration,
    formatLocation,
    getDaysUntilDeadline,
    isDeadlinePassed,
} from '../../lib/utils'
import { FeedbackForm, FeedbackList, StatusBadge } from '../../components'
import { rootRoute } from '../../engagements.routes'

import styles from './EngagementDetailPage.module.scss'

const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
    [ApplicationStatus.SUBMITTED]: 'Submitted',
    [ApplicationStatus.UNDER_REVIEW]: 'Under review',
    [ApplicationStatus.ACCEPTED]: 'Accepted',
    [ApplicationStatus.REJECTED]: 'Rejected',
}

const CUSTOMER_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const EngagementDetailPage: FC = () => {
    const params = useParams<{ nanoId: string }>()
    const nanoId = params.nanoId
    const navigate = useNavigate()
    const profileContext = useProfileContext()
    const isLoggedIn = profileContext.isLoggedIn
    const profile = profileContext.profile

    const [engagement, setEngagement] = useState<Engagement | undefined>(undefined)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | undefined>(undefined)
    const [application, setApplication] = useState<Application | undefined>(undefined)
    const [hasApplied, setHasApplied] = useState<boolean>(false)
    const [checkingApplication, setCheckingApplication] = useState<boolean>(false)
    const [applicationError, setApplicationError] = useState<string | undefined>(undefined)
    const [feedback, setFeedback] = useState<Feedback[]>([])
    const [feedbackLoading, setFeedbackLoading] = useState<boolean>(false)
    const [feedbackError, setFeedbackError] = useState<string | undefined>(undefined)
    const [showAddFeedbackModal, setShowAddFeedbackModal] = useState<boolean>(false)
    const [showGenerateLinkModal, setShowGenerateLinkModal] = useState<boolean>(false)
    const [generatedLink, setGeneratedLink] = useState<GenerateFeedbackLinkResponse | undefined>(undefined)
    const [customerEmail, setCustomerEmail] = useState<string>('')

    const isPMOrAdmin = useMemo(() => profile?.roles?.some(
        role => role === UserRole.administrator || role === UserRole.projectManager,
    ), [profile])

    const fetchEngagement = useCallback(async (): Promise<void> => {
        if (!nanoId) {
            navigate(rootRoute || '/', {
                replace: true,
                state: { engagementError: 'Engagement not found.' },
            })
            return
        }

        setLoading(true)
        setError(undefined)

        try {
            const response = await getEngagementByNanoId(nanoId)
            setEngagement(response)
        } catch (err: any) {
            const status = err?.response?.status
            if (status === 404) {
                navigate(rootRoute || '/', {
                    replace: true,
                    state: { engagementError: 'Engagement not found.' },
                })
                return
            }

            setError('Unable to load engagement details. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [nanoId, navigate])

    const checkApplication = useCallback(async (): Promise<void> => {
        if (!isLoggedIn || !engagement?.id) {
            return
        }

        setCheckingApplication(true)
        setApplicationError(undefined)

        try {
            const response = await checkExistingApplication(engagement.id)
            setHasApplied(response.hasApplied)
            setApplication(response.application)
        } catch (err) {
            setApplicationError('Unable to confirm your application status. Please try again.')
        } finally {
            setCheckingApplication(false)
        }
    }, [engagement?.id, isLoggedIn])

    const fetchFeedback = useCallback(async (): Promise<void> => {
        if (!engagement?.id || !isPMOrAdmin) {
            return
        }

        setFeedbackLoading(true)
        setFeedbackError(undefined)

        try {
            const response = await getFeedbackForEngagement(engagement.id)
            setFeedback(response)
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message
                || err?.message
                || 'Unable to load feedback. Please try again.'
            setFeedbackError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setFeedbackLoading(false)
        }
    }, [engagement?.id, isPMOrAdmin])

    useEffect(() => {
        fetchEngagement()
    }, [fetchEngagement])

    useEffect(() => {
        checkApplication()
    }, [checkApplication])

    useEffect(() => {
        fetchFeedback()
    }, [fetchFeedback])

    const handleApplyClick = useCallback(() => {
        if (!nanoId) {
            return
        }

        navigate(`${rootRoute}/${nanoId}/apply`)
    }, [nanoId, navigate])

    const handleBackClick = useCallback(() => navigate(rootRoute || '/'), [navigate])

    const handleViewApplications = useCallback(
        () => navigate(`${rootRoute}/my-applications`),
        [navigate],
    )

    const handleRetry = useCallback(() => fetchEngagement(), [fetchEngagement])

    const handleAddFeedback = useCallback(async (data: CreateFeedbackRequest): Promise<void> => {
        if (!engagement?.id) {
            return
        }

        try {
            await createFeedback(engagement.id, data)
            setShowAddFeedbackModal(false)
            toast.success('Feedback submitted successfully.')
            await fetchFeedback()
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message
                || err?.message
                || 'Unable to submit feedback. Please try again.'
            toast.error(errorMessage)
            throw err
        }
    }, [engagement?.id, fetchFeedback])

    const handleGenerateLink = useCallback(async (): Promise<void> => {
        if (!engagement?.id) {
            return
        }

        const trimmedEmail = customerEmail.trim()
        if (!trimmedEmail) {
            toast.error('Customer email is required.')
            return
        }

        if (!CUSTOMER_EMAIL_PATTERN.test(trimmedEmail)) {
            toast.error('Enter a valid email address.')
            return
        }

        try {
            const response = await generateFeedbackLink(engagement.id, { customerEmail: trimmedEmail })
            setGeneratedLink(response)
            toast.success('Feedback link generated successfully.')
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message
                || err?.message
                || 'Unable to generate feedback link. Please try again.'
            toast.error(errorMessage)
        }
    }, [customerEmail, engagement?.id])

    const handleCopyLink = useCallback(async (): Promise<void> => {
        if (!generatedLink?.feedbackUrl) {
            return
        }

        try {
            await copyTextToClipboard(generatedLink.feedbackUrl)
            toast.success('Link copied to clipboard')
        } catch (err: any) {
            const errorMessage = err?.message || 'Unable to copy link. Please try again.'
            toast.error(errorMessage)
        }
    }, [generatedLink?.feedbackUrl])

    const handleCloseAddFeedbackModal = useCallback(() => setShowAddFeedbackModal(false), [])

    const handleCloseGenerateLinkModal = useCallback(() => {
        setShowGenerateLinkModal(false)
        setGeneratedLink(undefined)
        setCustomerEmail('')
    }, [])

    const handleOpenAddFeedbackModal = useCallback(() => setShowAddFeedbackModal(true), [])

    const handleOpenGenerateLinkModal = useCallback(
        () => setShowGenerateLinkModal(true),
        [],
    )

    const handleCustomerEmailChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>): void => {
            setCustomerEmail(event.target.value)
        },
        [],
    )

    const handleGenerateLinkSubmit = useCallback(
        (event: FormEvent<HTMLFormElement>): void => {
            event.preventDefault()
            handleGenerateLink()
        },
        [handleGenerateLink],
    )

    const deadlinePassed = useMemo(() => (
        engagement?.applicationDeadline
            ? isDeadlinePassed(engagement.applicationDeadline)
            : false
    ), [engagement?.applicationDeadline])

    const daysUntilDeadline = useMemo(() => (
        engagement?.applicationDeadline
            ? getDaysUntilDeadline(engagement.applicationDeadline)
            : 0
    ), [engagement?.applicationDeadline])

    const deadlineCountdown = useMemo(() => (
        engagement?.applicationDeadline
            ? formatDeadlineCountdown(engagement.applicationDeadline)
            : 'Deadline TBD'
    ), [engagement?.applicationDeadline])

    const isDeadlineSoon = daysUntilDeadline > 0 && daysUntilDeadline <= 7

    const applicationStatusLabel = application?.status
        ? APPLICATION_STATUS_LABELS[application.status]
        : undefined

    const renderApplySection = (): JSX.Element => {
        if (!engagement) {
            return (
                <div className={styles.applyMessage}>
                    <span>Engagement details are unavailable.</span>
                </div>
            )
        }

        if (!isLoggedIn) {
            return (
                <div className={styles.applyMessage}>
                    <span>Sign in to apply for this engagement.</span>
                    <a className={styles.signInLink} href={authUrlLogin()}>
                        Sign in
                    </a>
                </div>
            )
        }

        if (engagement.status === EngagementStatus.CLOSED) {
            return (
                <div className={styles.applyMessage}>
                    <span>Applications are closed for this engagement.</span>
                </div>
            )
        }

        if (deadlinePassed) {
            return (
                <div className={styles.applyMessage}>
                    <span>The application deadline has passed.</span>
                </div>
            )
        }

        if (checkingApplication) {
            return (
                <div className={styles.applyMessage}>
                    <LoadingSpinner className={styles.inlineSpinner} />
                    <span>Checking your application status...</span>
                </div>
            )
        }

        if (applicationError) {
            return (
                <div className={styles.applyMessage}>
                    <span>{applicationError}</span>
                    <Button label='Retry' onClick={checkApplication} secondary />
                </div>
            )
        }

        if (hasApplied) {
            return (
                <div className={styles.applyMessage}>
                    <div className={styles.appliedActions}>
                        <Button label='Already Applied' secondary disabled />
                        <Button label='View My Applications' onClick={handleViewApplications} link />
                    </div>
                    {applicationStatusLabel && (
                        <span className={styles.applicationStatus}>
                            {`Application status: ${applicationStatusLabel}`}
                        </span>
                    )}
                </div>
            )
        }

        return (
            <div className={styles.applyActions}>
                <Button label='Apply Now' onClick={handleApplyClick} primary />
            </div>
        )
    }

    const renderLoadingState = (): JSX.Element => (
        <div className={styles.loadingSection}>
            <LoadingSpinner className={styles.loadingSpinner} />
            <div className={styles.skeletonBlock} />
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
        </div>
    )

    const renderErrorState = (): JSX.Element => (
        <div className={styles.errorState}>
            <IconOutline.ExclamationIcon className={styles.errorIcon} />
            <div>
                <p className={styles.errorText}>{error}</p>
                <Button label='Retry' onClick={handleRetry} primary />
            </div>
        </div>
    )

    const renderMissingEngagementState = (): JSX.Element => (
        <div className={styles.emptyState}>
            <IconOutline.SearchIcon className={styles.emptyIcon} />
            <h3>Engagement not available</h3>
            <p>We could not find the engagement you were looking for.</p>
            <Button label='Back to Engagements' secondary onClick={handleBackClick} />
        </div>
    )

    const renderApplyHint = (): JSX.Element | undefined => {
        if (!engagement) {
            return undefined
        }

        if (engagement.status === EngagementStatus.CLOSED || deadlinePassed) {
            return undefined
        }

        return (
            <span className={styles.applyHint}>Applications are open.</span>
        )
    }

    const renderFeedbackPendingMessage = (): JSX.Element | undefined => {
        if (!engagement || engagement.status !== EngagementStatus.PENDING_ASSIGNMENT) {
            return undefined
        }

        return (
            <div className={styles.applyMessage}>
                <span>
                    This engagement has not been assigned yet. Feedback will be available once a member
                    is assigned.
                </span>
            </div>
        )
    }

    const renderFeedbackSection = (): JSX.Element | undefined => {
        if (!isLoggedIn || !isPMOrAdmin) {
            return undefined
        }

        return (
            <div className={styles.feedbackSection}>
                <div className={styles.feedbackHeader}>
                    <div>
                        <h2>Feedback</h2>
                        <p>Capture internal notes and gather customer feedback.</p>
                    </div>
                </div>
                {renderFeedbackPendingMessage()}
                <FeedbackList
                    feedback={feedback}
                    loading={feedbackLoading}
                    error={feedbackError}
                    onRetry={fetchFeedback}
                />
                <div className={styles.feedbackActions}>
                    <Button
                        label='Add Feedback'
                        onClick={handleOpenAddFeedbackModal}
                        primary
                    />
                    <Button
                        label='Generate Customer Feedback Link'
                        onClick={handleOpenGenerateLinkModal}
                        secondary
                    />
                </div>
            </div>
        )
    }

    const renderDetailSection = (): JSX.Element => {
        if (!engagement) {
            return renderMissingEngagementState()
        }

        return (
            <div className={styles.detail}>
                <div className={styles.statusRow}>
                    <StatusBadge status={engagement.status} size='md' />
                    <span className={styles.statusHint}>
                        {`Updated ${formatDate(engagement.updatedAt)}`}
                    </span>
                </div>
                <div className={styles.descriptionBlock}>
                    <h2>Overview</h2>
                    <p className={styles.description}>{engagement.description}</p>
                </div>
                <div className={styles.metaGrid}>
                    <div className={styles.metaItem}>
                        <IconSolid.ClockIcon className={styles.metaIcon} />
                        <div>
                            <div className={styles.metaLabel}>Duration</div>
                            <div className={styles.metaValue}>{formatDuration(engagement.duration)}</div>
                        </div>
                    </div>
                    <div className={styles.metaItem}>
                        <IconSolid.LocationMarkerIcon className={styles.metaIcon} />
                        <div>
                            <div className={styles.metaLabel}>Location</div>
                            <div className={styles.metaValue}>
                                {formatLocation(engagement.countries ?? [], engagement.timeZones ?? [])}
                            </div>
                        </div>
                    </div>
                    <div className={styles.metaItem}>
                        <IconSolid.CalendarIcon className={styles.metaIcon} />
                        <div>
                            <div className={styles.metaLabel}>Application Deadline</div>
                            <div className={styles.metaValue}>
                                {formatDate(engagement.applicationDeadline)}
                            </div>
                            <span
                                className={styles.deadlineCountdown}
                                data-deadline-soon={isDeadlineSoon}
                                data-deadline-passed={deadlinePassed}
                            >
                                {deadlineCountdown}
                            </span>
                        </div>
                    </div>
                    <div className={styles.metaItem}>
                        <IconSolid.BriefcaseIcon className={styles.metaIcon} />
                        <div>
                            <div className={styles.metaLabel}>Role</div>
                            <div className={styles.metaValue}>{engagement.role || 'Not specified'}</div>
                        </div>
                    </div>
                    <div className={styles.metaItem}>
                        <IconSolid.ClockIcon className={styles.metaIcon} />
                        <div>
                            <div className={styles.metaLabel}>Workload</div>
                            <div className={styles.metaValue}>{engagement.workload || 'Not specified'}</div>
                        </div>
                    </div>
                    <div className={styles.metaItem}>
                        <IconSolid.CurrencyDollarIcon className={styles.metaIcon} />
                        <div>
                            <div className={styles.metaLabel}>Compensation</div>
                            <div className={styles.metaValue}>
                                {engagement.compensationRange || 'Not specified'}
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.skillsSection}>
                    <h2>Required Skills</h2>
                    <div className={styles.skillsList}>
                        {engagement.requiredSkills.map(skill => (
                            <span
                                key={`${engagement.nanoId}-${skill}`}
                                className={styles.skillPill}
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
                <div className={styles.applySection}>
                    <div className={styles.applyHeader}>
                        <h2>Apply</h2>
                        {renderApplyHint()}
                    </div>
                    {renderApplySection()}
                </div>
                {renderFeedbackSection()}
            </div>
        )
    }

    const renderContent = (): JSX.Element => {
        if (loading) {
            return renderLoadingState()
        }

        if (error) {
            return renderErrorState()
        }

        if (!engagement) {
            return renderMissingEngagementState()
        }

        return renderDetailSection()
    }

    return (
        <ContentLayout
            title={engagement?.title ?? 'Engagement Details'}
            secondaryButtonConfig={{
                label: 'Back to Engagements',
                onClick: handleBackClick,
            }}
        >
            {renderContent()}
            <BaseModal
                open={showAddFeedbackModal}
                onClose={handleCloseAddFeedbackModal}
                title='Add Feedback'
                size='md'
            >
                <div className={styles.modalForm}>
                    <FeedbackForm
                        key={showAddFeedbackModal ? 'feedback-open' : 'feedback-closed'}
                        onSubmit={handleAddFeedback}
                        onCancel={handleCloseAddFeedbackModal}
                        submitLabel='Submit Feedback'
                    />
                </div>
            </BaseModal>
            <BaseModal
                open={showGenerateLinkModal}
                onClose={handleCloseGenerateLinkModal}
                title='Generate Customer Feedback Link'
                size='md'
            >
                {!generatedLink && (
                    <form
                        className={styles.modalForm}
                        onSubmit={handleGenerateLinkSubmit}
                    >
                        <div>
                            <label className={styles.modalLabel} htmlFor='customer-email'>Customer Email</label>
                            <input
                                id='customer-email'
                                type='email'
                                className={styles.modalInput}
                                value={customerEmail}
                                onChange={handleCustomerEmailChange}
                                placeholder='customer@example.com'
                                required
                            />
                        </div>
                        <div className={styles.modalActions}>
                            <Button
                                label='Generate Link'
                                type='submit'
                                primary
                            />
                            <Button
                                label='Cancel'
                                onClick={handleCloseGenerateLinkModal}
                                type='button'
                                secondary
                            />
                        </div>
                    </form>
                )}
                {generatedLink && (
                    <div className={styles.modalForm}>
                        <div>Feedback link generated successfully.</div>
                        <div className={styles.linkDisplay}>
                            <input
                                className={styles.linkInput}
                                type='text'
                                value={generatedLink.feedbackUrl}
                                readOnly
                            />
                            <Button
                                label='Copy Link'
                                onClick={handleCopyLink}
                                icon={IconOutline.DocumentDuplicateIcon}
                                secondary
                            />
                        </div>
                        <div className={styles.linkMeta}>
                            {`Expires on ${formatDate(generatedLink.expiresAt)}`}
                        </div>
                        <div className={styles.modalActions}>
                            <Button
                                label='Close'
                                onClick={handleCloseGenerateLinkModal}
                                primary
                            />
                        </div>
                    </div>
                )}
            </BaseModal>
        </ContentLayout>
    )
}

export default EngagementDetailPage
