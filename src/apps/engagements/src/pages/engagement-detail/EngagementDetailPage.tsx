import { FC, SyntheticEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown, { type Options as ReactMarkdownOptions } from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'

import { EnvironmentConfig } from '~/config'
import { authUrlLogin, useProfileContext } from '~/libs/core'
import { BaseModal, Button, ContentLayout, IconOutline, IconSolid, LoadingSpinner } from '~/libs/ui'

import type { Application, Engagement, TermDetails } from '../../lib/models'
import { ApplicationStatus, EngagementStatus } from '../../lib/models'
import {
    agreeToTerm,
    checkExistingApplication,
    getDocuSignUrl,
    getEngagementByNanoId,
    getTermDetails,
} from '../../lib/services'
import {
    extractTermId,
    formatDate,
    formatDuration,
    formatLocation,
} from '../../lib/utils'
import { StatusBadge } from '../../components'
import { rootRoute } from '../../engagements.routes'

import styles from './EngagementDetailPage.module.scss'

const Markdown = ReactMarkdown as unknown as FC<ReactMarkdownOptions>

const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
    [ApplicationStatus.SUBMITTED]: 'Submitted',
    [ApplicationStatus.UNDER_REVIEW]: 'Under review',
    [ApplicationStatus.SELECTED]: 'Selected',
    [ApplicationStatus.REJECTED]: 'Rejected',
}

const PRIVATE_ENGAGEMENT_ROLE_KEYWORDS = ['project manager', 'task manager', 'talent manager', 'admin']

const formatEnumLabel = (value?: string): string | undefined => {
    if (!value) {
        return undefined
    }

    const normalized = value
        .replace(/_/g, ' ')
        .trim()
    if (!normalized) {
        return undefined
    }

    return normalized
        .toLowerCase()
        .replace(/\b\w/g, character => character.toUpperCase())
}

type TermsConfig = {
    id: string
    label: string
    url?: string
}

const TERMS_ID = extractTermId(EnvironmentConfig.TERMS_URL)
const NDA_TERMS_ID = extractTermId(EnvironmentConfig.NDA_TERMS_URL)

const TERMS_CONFIG: TermsConfig[] = [
    { id: TERMS_ID ?? '', label: 'Standard Topcoder Terms', url: EnvironmentConfig.TERMS_URL },
    { id: NDA_TERMS_ID ?? '', label: 'Topcoder NDA', url: EnvironmentConfig.NDA_TERMS_URL },
].filter(term => term.id)

const DOCUSIGN_POLL_DELAY_MS = 5000
const DOCUSIGN_POLL_MAX_ATTEMPTS = 5
const DOCUSIGN_RETURN_PARAM = 'docusignReturn'
const DOCUSIGN_RETURN_VALUE = '1'

const delay = (durationMs: number): Promise<void> => (
    new Promise(resolve => {
        window.setTimeout(resolve, durationMs)
    })
)

const buildDocuSignReturnUrl = (): string => {
    const url = new URL(window.location.href)
    url.searchParams.set(DOCUSIGN_RETURN_PARAM, DOCUSIGN_RETURN_VALUE)
    return url.toString()
}

const isDocuSignReturnUrl = (url?: string): boolean => {
    if (!url) {
        return false
    }

    try {
        const parsed = new URL(url)
        return parsed.origin === window.location.origin
            && parsed.searchParams.get(DOCUSIGN_RETURN_PARAM) === DOCUSIGN_RETURN_VALUE
    } catch {
        return false
    }
}

const normalizeRoleNames = (roles?: string[]): string[] => (
    (roles ?? [])
        .filter((role): role is string => typeof role === 'string')
        .map(role => role
            .trim()
            .toLowerCase())
)

const hasPrivateEngagementRoleMatch = (roles: string[]): boolean => (
    roles.some(role => PRIVATE_ENGAGEMENT_ROLE_KEYWORDS.some(keyword => role.includes(keyword)))
)

const isAssignedMemberToEngagement = (
    assignments: Engagement['assignments'],
    userId?: number | string,
): boolean => {
    if (!assignments || userId === undefined || userId === null) {
        return false
    }

    const normalizedUserId = String(userId)
    return assignments.some(assignment => (
        assignment.memberId && String(assignment.memberId) === normalizedUserId
    ))
}

type PrivateEngagementAccess = {
    isAccessPending: boolean
    canViewPrivateEngagement: boolean
    shouldRestrictEngagement: boolean
}

const getPrivateEngagementAccess = ({
    isPrivateEngagement,
    isProfileReady,
    isLoggedIn,
    hasPrivateEngagementRole,
    isAssignedMember,
}: {
    isPrivateEngagement: boolean
    isProfileReady: boolean
    isLoggedIn: boolean
    hasPrivateEngagementRole: boolean
    isAssignedMember: boolean
}): PrivateEngagementAccess => {
    if (!isPrivateEngagement) {
        return {
            canViewPrivateEngagement: true,
            isAccessPending: false,
            shouldRestrictEngagement: false,
        }
    }

    if (!isProfileReady) {
        return {
            canViewPrivateEngagement: false,
            isAccessPending: true,
            shouldRestrictEngagement: false,
        }
    }

    const canViewPrivateEngagement = isLoggedIn && (hasPrivateEngagementRole || isAssignedMember)
    return {
        canViewPrivateEngagement,
        isAccessPending: false,
        shouldRestrictEngagement: !canViewPrivateEngagement,
    }
}

const normalizeUserId = (userId?: number | string): string | undefined => {
    if (userId === undefined || userId === null) {
        return undefined
    }

    return String(userId)
}

const isEngagementCreatorMatch = ({
    normalizedUserId,
    normalizedCreatedBy,
    normalizedCreatorEmail,
    normalizedUserEmail,
}: {
    normalizedUserId?: string
    normalizedCreatedBy?: string
    normalizedCreatorEmail?: string
    normalizedUserEmail?: string
}): boolean => {
    if (normalizedUserId && normalizedCreatedBy && normalizedCreatedBy === normalizedUserId) {
        return true
    }

    if (normalizedCreatorEmail && normalizedUserEmail && normalizedCreatorEmail === normalizedUserEmail) {
        return true
    }

    return false
}

const getApplicationStatusLabel = (application?: Application): string | undefined => {
    if (!application?.status) {
        return undefined
    }

    return APPLICATION_STATUS_LABELS[application.status]
}

type TermsViewData = {
    termsTitle: string
    termsBody?: string
    isElectronicallyAgreeable: boolean
}

const getTermsViewData = (termsDetails?: TermDetails): TermsViewData => {
    const termsTitle = termsDetails?.title || 'Terms & Conditions of Use'
    const termsBody = termsDetails?.text
        ? termsDetails.text.replace(/topcoder/gi, 'Topcoder')
        : undefined
    const isElectronicallyAgreeable = termsDetails?.agreeabilityType
        ? termsDetails.agreeabilityType === 'Electronically-agreeable'
        : true

    return {
        isElectronicallyAgreeable,
        termsBody,
        termsTitle,
    }
}

const getPageTitle = (
    engagement?: Engagement,
    canViewPrivateEngagement?: boolean,
): string => {
    if (!engagement || !canViewPrivateEngagement) {
        return 'Engagement Details'
    }

    return engagement.title
}

const renderApplicationStatus = (label?: string): JSX.Element | undefined => {
    if (!label) {
        return undefined
    }

    return (
        <span className={styles.applicationStatus}>
            {`Application status: ${label}`}
        </span>
    )
}

type TermsModalProps = {
    open: boolean
    onClose: () => void
    termsLabel?: string
    termsTitle: string
    termsBody?: string
    termsLoading: boolean
    termsError?: string
    termsAgreeing: boolean
    isElectronicallyAgreeable: boolean
    isDocuSignTerm: boolean
    docuSignUrl?: string
    docuSignLoading: boolean
    termsUrl?: string
    onAgree: () => void
    onOpenTermsLink: () => void
    onDocuSignFrameLoad?: (event: SyntheticEvent<HTMLIFrameElement>) => void
}

type TermsModalButtonProps = Pick<
    TermsModalProps,
    | 'isDocuSignTerm'
    | 'isElectronicallyAgreeable'
    | 'termsAgreeing'
    | 'termsLoading'
    | 'termsUrl'
    | 'onClose'
    | 'onAgree'
    | 'onOpenTermsLink'
>

type TermsModalDocuSignProps = Pick<
    TermsModalProps,
    | 'docuSignLoading'
    | 'docuSignUrl'
    | 'termsAgreeing'
    | 'termsTitle'
    | 'termsUrl'
    | 'onDocuSignFrameLoad'
>

type TermsModalBodyProps = Pick<
    TermsModalProps,
    | 'termsBody'
    | 'termsUrl'
>

type TermsModalContentProps = TermsModalDocuSignProps
    & TermsModalBodyProps
    & Pick<TermsModalProps, 'isDocuSignTerm' | 'termsLoading'>

const getTermsModalDescription = (termsLabel?: string): string => (
    termsLabel
        ? `You are seeing the ${termsLabel} because you are applying to an engagement. `
            + 'You must agree to continue.'
        : 'You are seeing these Terms & Conditions because you are applying to an engagement. '
            + 'You must agree to continue.'
)

const renderTermsModalButtons = (props: TermsModalButtonProps): JSX.Element => {
    if (props.isDocuSignTerm) {
        return (
            <Button
                secondary
                label='Close'
                onClick={props.onClose}
                disabled={props.termsAgreeing}
            />
        )
    }

    if (props.isElectronicallyAgreeable) {
        return (
            <>
                <Button
                    secondary
                    label='I Disagree'
                    onClick={props.onClose}
                    disabled={props.termsAgreeing}
                />
                <Button
                    primary
                    label='I Agree'
                    onClick={props.onAgree}
                    disabled={props.termsAgreeing || props.termsLoading}
                    loading={props.termsAgreeing}
                />
            </>
        )
    }

    return (
        <>
            <Button
                secondary
                label='Close'
                onClick={props.onClose}
                disabled={props.termsAgreeing}
            />
            <Button
                primary
                label='Open Terms'
                onClick={props.onOpenTermsLink}
                disabled={!props.termsUrl}
            />
        </>
    )
}

const renderTermsDocuSignSection = (props: TermsModalDocuSignProps): JSX.Element => {
    const isProcessing = props.docuSignLoading || props.termsAgreeing
    const statusMessage = props.docuSignLoading
        ? 'Loading agreement...'
        : 'Finalizing your agreement...'

    return (
        <div className={styles.termsDocuSign}>
            {isProcessing && (
                <div className={styles.termsDocuSignOverlay}>
                    <LoadingSpinner className={styles.termsModalSpinner} />
                    <span className={styles.termsDocuSignStatus}>{statusMessage}</span>
                </div>
            )}
            {!isProcessing && props.docuSignUrl && (
                <iframe
                    className={styles.termsDocuSignFrame}
                    src={props.docuSignUrl}
                    title={props.termsTitle}
                    onLoad={props.onDocuSignFrameLoad}
                />
            )}
            {!isProcessing && !props.docuSignUrl && (
                <div className={styles.termsModalFallback}>
                    <p>We couldn’t load the agreement.</p>
                    {props.termsUrl && (
                        <a
                            className={styles.termsModalLink}
                            href={props.termsUrl}
                            target='_blank'
                            rel='noreferrer'
                        >
                            Open Terms of Use
                        </a>
                    )}
                </div>
            )}
        </div>
    )
}

const renderTermsBodySection = (props: TermsModalBodyProps): JSX.Element => (
    <div className={styles.termsModalBody}>
        {props.termsBody ? (
            <div
                className={styles.description}
                dangerouslySetInnerHTML={{ __html: props.termsBody }}
            />
        ) : (
            <div className={styles.termsModalFallback}>
                <p>We couldn’t load the full terms text.</p>
                {props.termsUrl && (
                    <a
                        className={styles.termsModalLink}
                        href={props.termsUrl}
                        target='_blank'
                        rel='noreferrer'
                    >
                        Open Terms of Use
                    </a>
                )}
            </div>
        )}
    </div>
)

const renderTermsModalContent = (props: TermsModalContentProps): JSX.Element => {
    if (props.termsLoading) {
        return (
            <div className={styles.termsModalLoading}>
                <LoadingSpinner className={styles.termsModalSpinner} />
            </div>
        )
    }

    if (props.isDocuSignTerm) {
        return renderTermsDocuSignSection(props)
    }

    return renderTermsBodySection(props)
}

const TermsModal: FC<TermsModalProps> = (props: TermsModalProps): JSX.Element => {
    const description = getTermsModalDescription(props.termsLabel)
    const buttonProps: TermsModalButtonProps = {
        isDocuSignTerm: props.isDocuSignTerm,
        isElectronicallyAgreeable: props.isElectronicallyAgreeable,
        onAgree: props.onAgree,
        onClose: props.onClose,
        onOpenTermsLink: props.onOpenTermsLink,
        termsAgreeing: props.termsAgreeing,
        termsLoading: props.termsLoading,
        termsUrl: props.termsUrl,
    }
    const contentProps: TermsModalContentProps = {
        docuSignLoading: props.docuSignLoading,
        docuSignUrl: props.docuSignUrl,
        isDocuSignTerm: props.isDocuSignTerm,
        onDocuSignFrameLoad: props.onDocuSignFrameLoad,
        termsAgreeing: props.termsAgreeing,
        termsBody: props.termsBody,
        termsLoading: props.termsLoading,
        termsTitle: props.termsTitle,
        termsUrl: props.termsUrl,
    }

    return (
        <BaseModal
            open={props.open}
            onClose={props.onClose}
            size='lg'
            title={props.termsTitle}
            buttons={renderTermsModalButtons(buttonProps)}
        >
            <div className={styles.termsModalDescription}>
                {description}
            </div>
            {renderTermsModalContent(contentProps)}
            {props.termsError && props.open && (
                <div className={styles.termsModalError}>{props.termsError}</div>
            )}
        </BaseModal>
    )
}

const EngagementDetailPage: FC = () => {
    const params = useParams<{ nanoId: string }>()
    const nanoId = params.nanoId
    const navigate = useNavigate()
    const profileContext = useProfileContext()
    const isProfileReady = profileContext.initialized
    const isLoggedIn = profileContext.isLoggedIn
    const userId = profileContext.profile?.userId

    const [engagement, setEngagement] = useState<Engagement | undefined>(undefined)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | undefined>(undefined)
    const [application, setApplication] = useState<Application | undefined>(undefined)
    const [hasApplied, setHasApplied] = useState<boolean>(false)
    const [checkingApplication, setCheckingApplication] = useState<boolean>(false)
    const [applicationError, setApplicationError] = useState<string | undefined>(undefined)
    const [termsModalOpen, setTermsModalOpen] = useState<boolean>(false)
    const [activeTerm, setActiveTerm] = useState<TermsConfig | undefined>(undefined)
    const [termsDetails, setTermsDetails] = useState<TermDetails | undefined>(undefined)
    const [termsLoading, setTermsLoading] = useState<boolean>(false)
    const [termsError, setTermsError] = useState<string | undefined>(undefined)
    const [termsAgreeing, setTermsAgreeing] = useState<boolean>(false)
    const [docuSignUrl, setDocuSignUrl] = useState<string | undefined>(undefined)
    const [docuSignLoading, setDocuSignLoading] = useState<boolean>(false)
    const docuSignCallbackHandledRef = useRef(false)
    const termsUrl = activeTerm?.url
    const normalizedUserId = normalizeUserId(userId)
    const normalizedCreatedBy = engagement?.createdBy?.trim()
    const normalizedCreatorEmail = engagement?.createdByEmail
        ?.trim()
        .toLowerCase()
    const normalizedUserEmail = profileContext.profile?.email
        ?.trim()
        .toLowerCase()
    const isEngagementCreator = isEngagementCreatorMatch({
        normalizedCreatedBy,
        normalizedCreatorEmail,
        normalizedUserEmail,
        normalizedUserId,
    })
    const isPrivateEngagement = Boolean(engagement?.isPrivate)

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
        if (!isLoggedIn || !engagement?.id || userId === undefined || isEngagementCreator || isPrivateEngagement) {
            return
        }

        setCheckingApplication(true)
        setApplicationError(undefined)

        try {
            const response = await checkExistingApplication(engagement.id, userId)
            setHasApplied(response.hasApplied)
            setApplication(response.application)
        } catch (err) {
            setApplicationError('Unable to confirm your application status. Please try again.')
        } finally {
            setCheckingApplication(false)
        }
    }, [engagement?.id, isEngagementCreator, isLoggedIn, isPrivateEngagement, userId])

    useEffect(() => {
        fetchEngagement()
    }, [fetchEngagement])

    useEffect(() => {
        checkApplication()
    }, [checkApplication])

    const navigateToApply = useCallback(() => {
        if (!nanoId) {
            return
        }

        navigate(`${rootRoute}/${nanoId}/apply`)
    }, [nanoId, navigate])

    const fetchPendingTerm = useCallback(async (): Promise<{
        pendingTerm?: TermsConfig
        details?: TermDetails
    } | undefined> => {
        if (!TERMS_ID || !NDA_TERMS_ID) {
            setTermsError('Unable to verify terms and NDA. Please try again later.')
            return undefined
        }

        setTermsError(undefined)
        setTermsLoading(true)

        try {
            const results = await Promise.all(
                TERMS_CONFIG.map(async term => ({
                    details: await getTermDetails(term.id),
                    term,
                })),
            )
            const nextPending = results.find(entry => !entry.details?.agreed)
            if (!nextPending) {
                return {}
            }

            return {
                details: nextPending.details,
                pendingTerm: nextPending.term,
            }
        } catch {
            setTermsError('Unable to verify terms of use. Please try again.')
            return undefined
        } finally {
            setTermsLoading(false)
        }
    }, [])

    const openNextPendingTerm = useCallback(async () => {
        const pending = await fetchPendingTerm()
        if (!pending) {
            return
        }

        if (!pending.pendingTerm || !pending.details) {
            setActiveTerm(undefined)
            setTermsDetails(undefined)
            setTermsModalOpen(false)
            navigateToApply()
            return
        }

        setActiveTerm(pending.pendingTerm)
        setTermsDetails(pending.details)
        setTermsModalOpen(true)
    }, [fetchPendingTerm, navigateToApply])

    const handleApplyClick = useCallback(() => {
        openNextPendingTerm()
    }, [openNextPendingTerm])

    const handleBackClick = useCallback(() => navigate(rootRoute || '/'), [navigate])

    const handleViewApplications = useCallback(
        () => navigate(`${rootRoute}/my-applications`),
        [navigate],
    )

    const handleRetry = useCallback(() => fetchEngagement(), [fetchEngagement])

    const handleTermsClose = useCallback(() => {
        setTermsModalOpen(false)
        setTermsError(undefined)
        setTermsAgreeing(false)
        setDocuSignUrl(undefined)
        setDocuSignLoading(false)
        setActiveTerm(undefined)
        setTermsDetails(undefined)
        docuSignCallbackHandledRef.current = false
    }, [])

    const handleAgreeTerms = useCallback(async () => {
        if (!activeTerm?.id) {
            setTermsError('Unable to verify terms of use. Please try again later.')
            return
        }

        setTermsAgreeing(true)
        setTermsError(undefined)

        try {
            const response = await agreeToTerm(activeTerm.id)
            if (response?.success === false) {
                throw new Error('Terms agreement failed')
            }

            await openNextPendingTerm()
        } catch {
            setTermsError('Unable to save your agreement. Please try again.')
        } finally {
            setTermsAgreeing(false)
        }
    }, [activeTerm?.id, openNextPendingTerm])

    const handleOpenTermsLink = useCallback(() => {
        if (!termsUrl) {
            return
        }

        window.open(termsUrl, '_blank', 'noopener,noreferrer')
    }, [termsUrl])

    const handleDocuSignComplete = useCallback(async () => {
        if (!activeTerm?.id) {
            return
        }

        const termId = activeTerm.id
        const checkAgreement = async (attempt: number): Promise<TermDetails> => {
            const details = await getTermDetails(termId)
            setTermsDetails(details)

            if (details.agreed || attempt >= DOCUSIGN_POLL_MAX_ATTEMPTS) {
                return details
            }

            await delay(DOCUSIGN_POLL_DELAY_MS)
            return checkAgreement(attempt + 1)
        }

        setTermsAgreeing(true)
        setTermsError(undefined)

        try {
            const details = await checkAgreement(1)
            if (!details.agreed) {
                setTermsError('We could not confirm your signature yet. Please try again.')
                return
            }

            await openNextPendingTerm()
        } catch {
            setTermsError('Unable to verify your agreement. Please try again.')
        } finally {
            setTermsAgreeing(false)
        }
    }, [activeTerm?.id, openNextPendingTerm])

    const handleDocuSignCallback = useCallback(() => {
        if (docuSignCallbackHandledRef.current) {
            return
        }

        docuSignCallbackHandledRef.current = true
        setTermsModalOpen(false)
        handleDocuSignComplete()
    }, [handleDocuSignComplete])

    const handleDocuSignFrameLoad = useCallback((event: SyntheticEvent<HTMLIFrameElement>) => {
        try {
            const frameLocation = event.currentTarget.contentWindow?.location?.href
            if (isDocuSignReturnUrl(frameLocation)) {
                handleDocuSignCallback()
            }
        } catch {
            // Ignore cross-origin iframe loads.
        }
    }, [handleDocuSignCallback])

    const docuSignTemplateId = termsDetails?.docusignTemplateId
    const isDocuSignTerm = Boolean(
        termsDetails?.agreeabilityType
            && termsDetails.agreeabilityType !== 'Electronically-agreeable'
            && docuSignTemplateId,
    )

    useEffect(() => {
        if (!termsModalOpen || !isDocuSignTerm || !docuSignTemplateId) {
            setDocuSignUrl(undefined)
            setDocuSignLoading(false)
            return
        }

        docuSignCallbackHandledRef.current = false
        const returnUrl = buildDocuSignReturnUrl()
        setDocuSignLoading(true)
        setDocuSignUrl(undefined)
        getDocuSignUrl(docuSignTemplateId, returnUrl)
            .then(url => setDocuSignUrl(url))
            .catch(() => setTermsError('Unable to load the agreement. Please try again.'))
            .finally(() => setDocuSignLoading(false))
    }, [docuSignTemplateId, isDocuSignTerm, termsModalOpen])

    useEffect(() => {
        if (!termsModalOpen || !docuSignUrl) {
            return undefined
        }

        const handler = (event: MessageEvent): void => {
            if (!event?.data || event.data.type !== 'DocuSign') {
                return
            }

            if (event.data.event === 'signing_complete' || event.data.event === 'viewing_complete') {
                handleDocuSignCallback()
            } else {
                handleTermsClose()
            }
        }

        window.addEventListener('message', handler)
        return () => window.removeEventListener('message', handler)
    }, [docuSignUrl, handleDocuSignCallback, handleTermsClose, termsModalOpen])

    const isEngagementOpen = engagement?.status === EngagementStatus.OPEN

    const normalizedRoles = normalizeRoleNames(profileContext.profile?.roles)
    const hasPrivateEngagementRole = hasPrivateEngagementRoleMatch(normalizedRoles)
    const isAssignedMember = isAssignedMemberToEngagement(engagement?.assignments, userId)
    const {
        isAccessPending,
        canViewPrivateEngagement,
        shouldRestrictEngagement,
    }: PrivateEngagementAccess = getPrivateEngagementAccess({
        hasPrivateEngagementRole,
        isAssignedMember,
        isLoggedIn,
        isPrivateEngagement,
        isProfileReady,
    })

    const applicationStatusLabel = getApplicationStatusLabel(application)
    const termsLabel = activeTerm?.label
    const { termsTitle, termsBody, isElectronicallyAgreeable }: TermsViewData = getTermsViewData(termsDetails)

    const renderTermsGate = (): JSX.Element | undefined => {
        if (termsLoading) {
            return (
                <div className={styles.applyMessage}>
                    <LoadingSpinner className={styles.inlineSpinner} />
                    <span>Checking terms and NDA...</span>
                </div>
            )
        }

        if (termsAgreeing && !termsModalOpen) {
            return (
                <div className={styles.applyMessage}>
                    <LoadingSpinner className={styles.inlineSpinner} />
                    <span>Finalizing your agreement...</span>
                </div>
            )
        }

        if (termsError && !termsModalOpen) {
            return (
                <div className={styles.applyMessage}>
                    <span className={styles.termsError}>{termsError}</span>
                    <Button label='Try Again' onClick={handleApplyClick} primary />
                </div>
            )
        }

        return undefined
    }

    const renderApplySection = (): JSX.Element => {
        if (!engagement) {
            return (
                <div className={styles.applyMessage}>
                    <span>Engagement details are unavailable.</span>
                </div>
            )
        }

        if (isPrivateEngagement) {
            return (
                <div className={styles.applyMessage}>
                    <span>This engagement is private and not accepting applications.</span>
                </div>
            )
        }

        if (isLoggedIn) {
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
                        {renderApplicationStatus(applicationStatusLabel)}
                    </div>
                )
            }
        }

        if (!isEngagementOpen) {
            return (
                <div className={styles.applyMessage}>
                    <span>This engagement is not accepting applications.</span>
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

        const termsGate = renderTermsGate()
        if (termsGate) {
            return termsGate
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

    const renderRestrictedEngagementState = (): JSX.Element => (
        <div className={styles.emptyState}>
            <IconOutline.LockClosedIcon className={styles.emptyIcon} />
            <h3>Private engagement</h3>
            <p>
                {isLoggedIn
                    ? 'Only talent managers, project managers, administrators, '
                        + 'and assigned members can view this engagement.'
                    : 'Sign in to confirm your access to this private engagement.'}
            </p>
            {!isLoggedIn && (
                <a className={styles.signInLink} href={authUrlLogin()}>
                    Sign in
                </a>
            )}
            <Button label='Back to Engagements' secondary onClick={handleBackClick} />
        </div>
    )

    const renderApplyHint = (): JSX.Element | undefined => {
        if (!engagement) {
            return undefined
        }

        if (isPrivateEngagement || !isEngagementOpen) {
            return undefined
        }

        return (
            <span className={styles.applyHint}>Applications are open.</span>
        )
    }

    const renderDetailSection = (): JSX.Element => {
        if (!engagement) {
            return renderMissingEngagementState()
        }

        const roleLabel = formatEnumLabel(engagement.role)
        const workloadLabel = formatEnumLabel(engagement.workload)
        const anticipatedStartLabel = formatEnumLabel(engagement.anticipatedStart)
        const { locationLabel, timeZoneLabel }: ReturnType<typeof formatLocation> = formatLocation(
            engagement.countries ?? [],
            engagement.timeZones ?? [],
        )

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
                    <div className={styles.description}>
                        <Markdown
                            remarkPlugins={[
                                remarkFrontmatter,
                                [remarkGfm, { singleTilde: false }],
                                remarkBreaks,
                            ]}
                        >
                            {engagement.description}
                        </Markdown>
                    </div>
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
                        <IconSolid.GlobeAltIcon className={styles.metaIcon} />
                        <div>
                            <div className={styles.metaLabel}>Timezone</div>
                            <div className={styles.metaValue}>{timeZoneLabel}</div>
                        </div>
                    </div>
                    <div className={styles.metaItem}>
                        <IconSolid.LocationMarkerIcon className={styles.metaIcon} />
                        <div>
                            <div className={styles.metaLabel}>Location</div>
                            <div className={styles.metaValue}>{locationLabel}</div>
                        </div>
                    </div>
                    <div className={styles.metaItem}>
                        <IconSolid.CalendarIcon className={styles.metaIcon} />
                        <div>
                            <div className={styles.metaLabel}>Anticipated Start</div>
                            <div className={styles.metaValue}>{anticipatedStartLabel ?? 'Not specified'}</div>
                        </div>
                    </div>
                    <div className={styles.metaItem}>
                        <IconSolid.BriefcaseIcon className={styles.metaIcon} />
                        <div>
                            <div className={styles.metaLabel}>Role</div>
                            <div className={styles.metaValue}>{roleLabel ?? 'Not specified'}</div>
                        </div>
                    </div>
                    <div className={styles.metaItem}>
                        <IconSolid.ClockIcon className={styles.metaIcon} />
                        <div>
                            <div className={styles.metaLabel}>Workload</div>
                            <div className={styles.metaValue}>{workloadLabel ?? 'Not specified'}</div>
                        </div>
                    </div>
                    <div className={styles.metaItem}>
                        <IconSolid.CurrencyDollarIcon className={styles.metaIcon} />
                        <div>
                            <div className={styles.metaLabel}>Weekly Compensation</div>
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
                {!isEngagementCreator && (
                    <div className={styles.applySection}>
                        <div className={styles.applyHeader}>
                            <h2>Apply</h2>
                            {renderApplyHint()}
                        </div>
                        {renderApplySection()}
                    </div>
                )}
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

        if (isAccessPending) {
            return renderLoadingState()
        }

        if (shouldRestrictEngagement) {
            return renderRestrictedEngagementState()
        }

        return renderDetailSection()
    }

    const pageTitle = getPageTitle(engagement, canViewPrivateEngagement)

    return (
        <ContentLayout
            title={pageTitle}
            secondaryButtonConfig={{
                label: 'Back to Engagements',
                onClick: handleBackClick,
            }}
        >
            {renderContent()}
            <TermsModal
                open={termsModalOpen}
                onClose={handleTermsClose}
                termsLabel={termsLabel}
                termsTitle={termsTitle}
                termsBody={termsBody}
                termsLoading={termsLoading}
                termsError={termsError}
                termsAgreeing={termsAgreeing}
                isElectronicallyAgreeable={isElectronicallyAgreeable}
                isDocuSignTerm={isDocuSignTerm}
                docuSignUrl={docuSignUrl}
                docuSignLoading={docuSignLoading}
                termsUrl={termsUrl}
                onAgree={handleAgreeTerms}
                onOpenTermsLink={handleOpenTermsLink}
                onDocuSignFrameLoad={handleDocuSignFrameLoad}
            />
        </ContentLayout>
    )
}

export default EngagementDetailPage
