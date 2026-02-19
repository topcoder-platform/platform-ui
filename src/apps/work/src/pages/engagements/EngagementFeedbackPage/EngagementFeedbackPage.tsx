/* eslint-disable react/jsx-no-bind */

import {
    ChangeEvent,
    FC,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useParams } from 'react-router-dom'
import classNames from 'classnames'

import { PageWrapper } from '~/apps/review/src/lib'
import { copyTextToClipboard } from '~/libs/shared'
import {
    BaseModal,
    Button,
} from '~/libs/ui'

import {
    ErrorMessage,
    LoadingSpinner,
} from '../../../lib/components'
import {
    WorkAppContext,
} from '../../../lib/contexts'
import {
    useFetchEngagement,
} from '../../../lib/hooks'
import {
    WorkAppContextModel,
} from '../../../lib/models'
import {
    createEngagementFeedback,
    EngagementFeedback,
    fetchEngagementFeedback,
    generateEngagementFeedbackLink,
} from '../../../lib/services'
import {
    normalizeAssignmentStatus,
    showErrorToast,
    showSuccessToast,
} from '../../../lib/utils'

import styles from './EngagementFeedbackPage.module.scss'

interface GeneratedFeedbackLink {
    expiresAt?: string
    feedbackUrl?: string
    secretToken?: string
}

const CUSTOMER_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const FEEDBACK_TEXT_LIMIT = 2000

function formatDate(value?: string): string {
    if (!value) {
        return '-'
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message.trim()) {
        return error.message
    }

    return fallbackMessage
}

function getFeedbackAuthorLabel(item: EngagementFeedback): string {
    if (item.givenByHandle) {
        return `Topcoder PM: ${item.givenByHandle}`
    }

    return `Customer: ${item.givenByEmail || 'Unknown'}`
}

function getAssignmentUpdatedAt(assignment: unknown): string | undefined {
    if (!assignment || typeof assignment !== 'object') {
        return undefined
    }

    const updatedAt = (assignment as { updatedAt?: unknown }).updatedAt
    return typeof updatedAt === 'string'
        ? updatedAt
        : undefined
}

function getAssignmentLabel(
    memberHandle?: string,
    memberId?: number | string,
    fallback?: string,
): string {
    const trimmedHandle = String(memberHandle || '')
        .trim()
    const trimmedMemberId = String(memberId || '')
        .trim()

    if (trimmedHandle && trimmedMemberId) {
        return `${trimmedHandle} (${trimmedMemberId})`
    }

    if (trimmedHandle) {
        return trimmedHandle
    }

    if (trimmedMemberId) {
        return `Member ${trimmedMemberId}`
    }

    return fallback || 'Not assigned'
}

// eslint-disable-next-line complexity
export const EngagementFeedbackPage: FC = () => {
    const params: Readonly<{
        assignmentId?: string
        engagementId?: string
        projectId?: string
    }> = useParams<'assignmentId' | 'engagementId' | 'projectId'>()

    const projectId = params.projectId || ''
    const engagementId = params.engagementId || ''
    const assignmentId = params.assignmentId || ''

    const workAppContext = useContext(WorkAppContext)
    const contextValue = workAppContext as WorkAppContextModel
    const canManage = contextValue.isAdmin || contextValue.isManager

    const engagementResult = useFetchEngagement(engagementId)

    const [customerEmail, setCustomerEmail] = useState<string>('')
    const [feedback, setFeedback] = useState<EngagementFeedback[]>([])
    const [feedbackError, setFeedbackError] = useState<string>('')
    const [feedbackFormError, setFeedbackFormError] = useState<string>('')
    const [feedbackText, setFeedbackText] = useState<string>('')
    const [generateError, setGenerateError] = useState<string>('')
    const [generatedLink, setGeneratedLink] = useState<GeneratedFeedbackLink | undefined>(undefined)
    const [isGeneratingLink, setIsGeneratingLink] = useState<boolean>(false)
    const [isLoadingFeedback, setIsLoadingFeedback] = useState<boolean>(false)
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false)
    const [rating, setRating] = useState<string>('')
    const [showAddFeedbackModal, setShowAddFeedbackModal] = useState<boolean>(false)
    const [showGenerateLinkModal, setShowGenerateLinkModal] = useState<boolean>(false)

    const selectedAssignment = useMemo(
        () => engagementResult.engagement?.assignments.find(
            assignment => String(assignment.id) === assignmentId,
        ),
        [assignmentId, engagementResult.engagement?.assignments],
    )
    const hasSelectedAssignment = !!selectedAssignment

    const assignmentLabel = useMemo(
        () => getAssignmentLabel(
            selectedAssignment?.memberHandle,
            selectedAssignment?.memberId,
            assignmentId,
        ),
        [assignmentId, selectedAssignment?.memberHandle, selectedAssignment?.memberId],
    )

    const assignmentStatus = useMemo(
        () => normalizeAssignmentStatus(String(selectedAssignment?.status || '')) || '-',
        [selectedAssignment?.status],
    )
    const assignmentLastUpdated = useMemo(
        () => formatDate(
            getAssignmentUpdatedAt(selectedAssignment)
                || engagementResult.engagement?.updatedAt
                || '',
        ),
        [engagementResult.engagement?.updatedAt, selectedAssignment],
    )

    const rightHeader = useMemo(
        () => (
            <div className={styles.headerMeta}>
                <div className={styles.headerMetaItem}>
                    <span className={styles.headerMetaLabel}>Status:</span>
                    <span>{assignmentStatus}</span>
                </div>
                <div className={styles.headerMetaItem}>
                    <span className={styles.headerMetaLabel}>Last updated:</span>
                    <span>{assignmentLastUpdated}</span>
                </div>
            </div>
        ),
        [assignmentLastUpdated, assignmentStatus],
    )

    const loadFeedback = useCallback(async (): Promise<void> => {
        if (!engagementId || !assignmentId || !hasSelectedAssignment || !canManage) {
            setFeedback([])
            setFeedbackError('')
            setIsLoadingFeedback(false)
            return
        }

        setIsLoadingFeedback(true)
        setFeedbackError('')

        try {
            const response = await fetchEngagementFeedback(engagementId, assignmentId)
            setFeedback(Array.isArray(response) ? response : [])
        } catch (error) {
            const message = getErrorMessage(error, 'Failed to load feedback')
            setFeedbackError(message)
        } finally {
            setIsLoadingFeedback(false)
        }
    }, [assignmentId, canManage, engagementId, hasSelectedAssignment])

    useEffect(() => {
        loadFeedback()
            .catch(() => undefined)
    }, [loadFeedback])

    const resetAddFeedbackForm = useCallback(() => {
        setFeedbackFormError('')
        setFeedbackText('')
        setIsSubmittingFeedback(false)
        setRating('')
    }, [])

    const resetGenerateLinkForm = useCallback(() => {
        setCustomerEmail('')
        setGenerateError('')
        setGeneratedLink(undefined)
        setIsGeneratingLink(false)
    }, [])

    const handleCloseAddFeedbackModal = useCallback(() => {
        setShowAddFeedbackModal(false)
        resetAddFeedbackForm()
    }, [resetAddFeedbackForm])

    const handleCloseGenerateLinkModal = useCallback(() => {
        setShowGenerateLinkModal(false)
        resetGenerateLinkForm()
    }, [resetGenerateLinkForm])

    const handleOpenAddFeedbackModal = useCallback(() => {
        resetAddFeedbackForm()
        setShowAddFeedbackModal(true)
    }, [resetAddFeedbackForm])

    const handleOpenGenerateLinkModal = useCallback(() => {
        resetGenerateLinkForm()
        setShowGenerateLinkModal(true)
    }, [resetGenerateLinkForm])

    const handleAddFeedbackSubmit = useCallback(async (): Promise<void> => {
        if (isSubmittingFeedback) {
            return
        }

        if (!engagementId) {
            setFeedbackFormError('Engagement is required to submit feedback.')
            return
        }

        if (!assignmentId || !hasSelectedAssignment) {
            setFeedbackFormError('Assignment is required to submit feedback.')
            return
        }

        const trimmedFeedback = feedbackText.trim()
        if (!trimmedFeedback) {
            setFeedbackFormError('Feedback is required.')
            return
        }

        if (trimmedFeedback.length > FEEDBACK_TEXT_LIMIT) {
            setFeedbackFormError(`Feedback must be ${FEEDBACK_TEXT_LIMIT} characters or less.`)
            return
        }

        let ratingValue: number | undefined
        const trimmedRating = rating.trim()
        if (trimmedRating) {
            const parsedRating = Number(trimmedRating)
            if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
                setFeedbackFormError('Rating must be a whole number between 1 and 5.')
                return
            }

            ratingValue = parsedRating
        }

        setFeedbackFormError('')
        setIsSubmittingFeedback(true)

        try {
            await createEngagementFeedback(engagementId, assignmentId, {
                feedbackText: trimmedFeedback,
                rating: ratingValue,
            })
            showSuccessToast('Feedback submitted successfully')
            handleCloseAddFeedbackModal()
            await loadFeedback()
        } catch (error) {
            const message = getErrorMessage(error, 'Failed to create feedback')
            setFeedbackFormError(message)
            showErrorToast(message)
        } finally {
            setIsSubmittingFeedback(false)
        }
    }, [
        assignmentId,
        engagementId,
        feedbackText,
        handleCloseAddFeedbackModal,
        hasSelectedAssignment,
        isSubmittingFeedback,
        loadFeedback,
        rating,
    ])

    const handleGenerateFeedbackLink = useCallback(async (): Promise<void> => {
        if (isGeneratingLink) {
            return
        }

        if (!engagementId) {
            setGenerateError('Engagement is required to generate a link.')
            return
        }

        if (!assignmentId || !hasSelectedAssignment) {
            setGenerateError('Assignment is required to generate a link.')
            return
        }

        const trimmedEmail = customerEmail.trim()
        if (!trimmedEmail) {
            setGenerateError('Customer email is required.')
            return
        }

        if (!CUSTOMER_EMAIL_PATTERN.test(trimmedEmail)) {
            setGenerateError('Enter a valid email address.')
            return
        }

        setGenerateError('')
        setIsGeneratingLink(true)

        try {
            const response = await generateEngagementFeedbackLink(engagementId, assignmentId, {
                customerEmail: trimmedEmail,
            })
            setGeneratedLink(response)
            showSuccessToast('Feedback link generated successfully')
        } catch (error) {
            const message = getErrorMessage(error, 'Failed to generate feedback link')
            setGenerateError(message)
            showErrorToast(message)
        } finally {
            setIsGeneratingLink(false)
        }
    }, [
        assignmentId,
        customerEmail,
        engagementId,
        hasSelectedAssignment,
        isGeneratingLink,
    ])

    const handleCopyLink = useCallback(async (): Promise<void> => {
        const feedbackUrl = String(generatedLink?.feedbackUrl || '')
            .trim()
        if (!feedbackUrl) {
            return
        }

        try {
            await copyTextToClipboard(feedbackUrl)
            showSuccessToast('Link copied to clipboard')
        } catch (error) {
            const message = getErrorMessage(error, 'Unable to copy link. Please try again.')
            showErrorToast(message)
        }
    }, [generatedLink?.feedbackUrl])

    const pageTitle = engagementResult.engagement?.title
        ? `${engagementResult.engagement.title} Feedback`
        : 'Feedback'
    const pendingAssignment = engagementResult.engagement?.status === 'Pending Assignment'

    const feedbackContent = useMemo(
        () => {
            if (!canManage) {
                return (
                    <div className={styles.emptyState}>
                        Feedback is available to admins, project managers, and talent managers only.
                    </div>
                )
            }

            if (!hasSelectedAssignment) {
                return (
                    <div className={styles.emptyState}>
                        Assignment not found.
                    </div>
                )
            }

            if (isLoadingFeedback) {
                return (
                    <div className={styles.loadingState}>
                        Loading feedback...
                    </div>
                )
            }

            if (feedbackError) {
                return (
                    <div className={styles.errorState}>
                        <span>{feedbackError}</span>
                        <Button
                            label='Retry'
                            onClick={() => {
                                loadFeedback()
                                    .catch(() => undefined)
                            }}
                            secondary
                            size='sm'
                        />
                    </div>
                )
            }

            if (!feedback.length) {
                return (
                    <div className={styles.emptyState}>
                        No feedback yet.
                    </div>
                )
            }

            return (
                <div className={styles.feedbackList}>
                    {feedback.map(item => {
                        const feedbackBody = String(item.feedbackText || '')
                        const isPendingFeedback = feedbackBody.trim().length === 0
                        const authorLabel = getFeedbackAuthorLabel(item)
                        const createdAt = formatDate(item.createdAt)

                        return (
                            <div key={String(item.id || `${authorLabel}-${createdAt}`)} className={styles.feedbackItem}>
                                <p
                                    className={classNames(
                                        styles.feedbackText,
                                        isPendingFeedback && styles.pendingText,
                                    )}
                                >
                                    {isPendingFeedback
                                        ? 'Pending'
                                        : feedbackBody}
                                </p>
                                <div className={styles.feedbackMeta}>
                                    <span className={styles.feedbackAuthor}>{authorLabel}</span>
                                    {item.rating
                                        ? <span className={styles.feedbackRating}>{`Rating: ${item.rating}/5`}</span>
                                        : undefined}
                                    <span className={styles.feedbackDate}>{createdAt}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )
        },
        [
            canManage,
            feedback,
            feedbackError,
            hasSelectedAssignment,
            isLoadingFeedback,
            loadFeedback,
        ],
    )

    if (engagementResult.isLoading) {
        return (
            <PageWrapper
                backUrl={`/projects/${projectId}/engagements/${engagementId}/assignments`}
                breadCrumb={[]}
                pageTitle={pageTitle}
                rightHeader={rightHeader}
            >
                <LoadingSpinner />
            </PageWrapper>
        )
    }

    if (engagementResult.error) {
        return (
            <PageWrapper
                backUrl={`/projects/${projectId}/engagements/${engagementId}/assignments`}
                breadCrumb={[]}
                pageTitle={pageTitle}
                rightHeader={rightHeader}
            >
                <ErrorMessage message={engagementResult.error.message} />
            </PageWrapper>
        )
    }

    return (
        <PageWrapper
            backUrl={`/projects/${projectId}/engagements/${engagementId}/assignments`}
            breadCrumb={[]}
            pageTitle={pageTitle}
            rightHeader={rightHeader}
        >
            <div className={styles.container}>
                <div className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <div className={styles.panelTitle}>Feedback</div>
                            <div className={styles.panelDescription}>
                                Capture internal notes and gather customer feedback.
                            </div>
                            <div className={styles.assignmentRow}>
                                <span className={styles.assignmentLabel}>Assignment:</span>
                                <span className={styles.assignmentValue}>{assignmentLabel}</span>
                            </div>
                        </div>
                        {canManage && (
                            <div className={styles.panelActions}>
                                <Button
                                    label='Add Feedback'
                                    onClick={handleOpenAddFeedbackModal}
                                    primary
                                    size='sm'
                                    disabled={!hasSelectedAssignment}
                                />
                                <Button
                                    label='Generate Customer Feedback Link'
                                    onClick={handleOpenGenerateLinkModal}
                                    secondary
                                    size='sm'
                                    disabled={!hasSelectedAssignment}
                                />
                            </div>
                        )}
                    </div>

                    {pendingAssignment && (
                        <div className={styles.notice}>
                            This engagement has not been assigned yet. Feedback will be available once a member is
                            assigned.
                        </div>
                    )}

                    {feedbackContent}
                </div>
            </div>

            <BaseModal
                open={showAddFeedbackModal}
                onClose={handleCloseAddFeedbackModal}
                title='Add Feedback'
                size='md'
                buttons={(
                    <>
                        <Button
                            label='Cancel'
                            onClick={handleCloseAddFeedbackModal}
                            secondary
                            disabled={isSubmittingFeedback}
                        />
                        <Button
                            label={isSubmittingFeedback
                                ? 'Submitting...'
                                : 'Submit Feedback'}
                            onClick={() => {
                                handleAddFeedbackSubmit()
                                    .catch(() => undefined)
                            }}
                            primary
                            disabled={isSubmittingFeedback || !hasSelectedAssignment}
                        />
                    </>
                )}
            >
                <div className={styles.modalContent}>
                    <div className={styles.modalField}>
                        <label className={styles.modalLabel} htmlFor='feedback-assignment'>Assignment</label>
                        <div className={styles.modalAssignmentValue} id='feedback-assignment'>
                            {assignmentLabel}
                        </div>
                    </div>
                    <div className={styles.modalField}>
                        <label className={styles.modalLabel} htmlFor='feedback-text'>Internal Performance Review</label>
                        <textarea
                            id='feedback-text'
                            className={styles.textarea}
                            maxLength={FEEDBACK_TEXT_LIMIT}
                            value={feedbackText}
                            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setFeedbackText(event.target.value)}
                            placeholder='Share your feedback...'
                            disabled={isSubmittingFeedback}
                        />
                        <div className={styles.characterCount}>
                            {`${feedbackText.length} / ${FEEDBACK_TEXT_LIMIT} characters`}
                        </div>
                    </div>

                    <div className={styles.modalField}>
                        <label className={styles.modalLabel} htmlFor='feedback-rating'>
                            Communication with Customer (optional)
                        </label>
                        <input
                            id='feedback-rating'
                            type='number'
                            min='1'
                            max='5'
                            step='1'
                            className={styles.input}
                            value={rating}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => setRating(event.target.value)}
                            disabled={isSubmittingFeedback}
                        />
                    </div>

                    {feedbackFormError && (
                        <div className={styles.formError}>{feedbackFormError}</div>
                    )}
                </div>
            </BaseModal>

            <BaseModal
                open={showGenerateLinkModal}
                onClose={handleCloseGenerateLinkModal}
                title='Generate Customer Feedback Link'
                size='md'
                buttons={generatedLink
                    ? (
                        <Button
                            label='Close'
                            onClick={handleCloseGenerateLinkModal}
                            primary
                        />
                    )
                    : (
                        <>
                            <Button
                                label='Cancel'
                                onClick={handleCloseGenerateLinkModal}
                                secondary
                                disabled={isGeneratingLink}
                            />
                            <Button
                                label={isGeneratingLink
                                    ? 'Generating...'
                                    : 'Generate Link'}
                                onClick={() => {
                                    handleGenerateFeedbackLink()
                                        .catch(() => undefined)
                                }}
                                primary
                                disabled={isGeneratingLink || !hasSelectedAssignment}
                            />
                        </>
                    )}
            >
                <div className={styles.modalContent}>
                    {!generatedLink
                        ? (
                            <>
                                <div className={styles.modalField}>
                                    <label className={styles.modalLabel} htmlFor='generate-feedback-assignment'>
                                        Assignment
                                    </label>
                                    <div className={styles.modalAssignmentValue} id='generate-feedback-assignment'>
                                        {assignmentLabel}
                                    </div>
                                </div>
                                <div className={styles.modalField}>
                                    <label className={styles.modalLabel} htmlFor='customer-email'>Customer Email</label>
                                    <input
                                        id='customer-email'
                                        type='email'
                                        className={styles.input}
                                        value={customerEmail}
                                        onChange={
                                            (event: ChangeEvent<HTMLInputElement>) => {
                                                setCustomerEmail(event.target.value)
                                            }
                                        }
                                        placeholder='customer@example.com'
                                        disabled={isGeneratingLink}
                                    />
                                </div>
                                {generateError && (
                                    <div className={styles.formError}>{generateError}</div>
                                )}
                            </>
                        )
                        : (
                            <>
                                <div className={styles.linkMessage}>Feedback link generated successfully.</div>
                                {generatedLink.expiresAt && (
                                    <div className={styles.linkMeta}>
                                        {`Expires on ${formatDate(generatedLink.expiresAt)}`}
                                    </div>
                                )}
                                <div className={styles.linkDisplay}>
                                    <input
                                        className={styles.linkInput}
                                        type='text'
                                        value={generatedLink.feedbackUrl || ''}
                                        readOnly
                                    />
                                    <Button
                                        className={styles.copyLinkButton}
                                        label='Copy Link'
                                        onClick={() => {
                                            handleCopyLink()
                                                .catch(() => undefined)
                                        }}
                                        secondary
                                        disabled={!generatedLink.feedbackUrl}
                                    />
                                </div>
                            </>
                        )}
                </div>
            </BaseModal>
        </PageWrapper>
    )
}

export default EngagementFeedbackPage
