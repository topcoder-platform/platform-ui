import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown, { type Options as ReactMarkdownOptions } from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'

import { authUrlLogin, useProfileContext } from '~/libs/core'
import { Button, ContentLayout, IconOutline, IconSolid, LoadingSpinner } from '~/libs/ui'

import type { Application, Engagement } from '../../lib/models'
import { ApplicationStatus, EngagementStatus } from '../../lib/models'
import {
    checkExistingApplication,
    getEngagementByNanoId,
} from '../../lib/services'
import {
    formatDate,
    formatDeadlineCountdown,
    formatDuration,
    formatLocation,
    getDaysUntilDeadline,
    isDeadlinePassed,
} from '../../lib/utils'
import { StatusBadge } from '../../components'
import { rootRoute } from '../../engagements.routes'

import styles from './EngagementDetailPage.module.scss'

const Markdown = ReactMarkdown as unknown as FC<ReactMarkdownOptions>

const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
    [ApplicationStatus.SUBMITTED]: 'Submitted',
    [ApplicationStatus.UNDER_REVIEW]: 'Under review',
    [ApplicationStatus.ACCEPTED]: 'Accepted',
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
    const normalizedUserId = userId !== undefined && userId !== null ? String(userId) : undefined
    const normalizedCreatedBy = engagement?.createdBy?.trim()
    const normalizedCreatorEmail = engagement?.createdByEmail
        ?.trim()
        .toLowerCase()
    const normalizedUserEmail = profileContext.profile?.email
        ?.trim()
        .toLowerCase()
    const isEngagementCreator = Boolean(
        (normalizedUserId && normalizedCreatedBy && normalizedCreatedBy === normalizedUserId)
        || (normalizedCreatorEmail && normalizedUserEmail && normalizedCreatorEmail === normalizedUserEmail),
    )

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
        if (!isLoggedIn || !engagement?.id || userId === undefined || isEngagementCreator) {
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
    }, [engagement?.id, isEngagementCreator, isLoggedIn, userId])

    useEffect(() => {
        fetchEngagement()
    }, [fetchEngagement])

    useEffect(() => {
        checkApplication()
    }, [checkApplication])

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
    const isEngagementOpen = engagement?.status === EngagementStatus.OPEN
    const isPrivateEngagement = Boolean(engagement?.isPrivate)

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

        if (isLoggedIn && checkingApplication) {
            return (
                <div className={styles.applyMessage}>
                    <LoadingSpinner className={styles.inlineSpinner} />
                    <span>Checking your application status...</span>
                </div>
            )
        }

        if (isLoggedIn && applicationError) {
            return (
                <div className={styles.applyMessage}>
                    <span>{applicationError}</span>
                    <Button label='Retry' onClick={checkApplication} secondary />
                </div>
            )
        }

        if (isLoggedIn && hasApplied) {
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

        if (isPrivateEngagement) {
            return (
                <div className={styles.applyMessage}>
                    <span>This engagement is private and not accepting applications.</span>
                </div>
            )
        }

        if (!isEngagementOpen) {
            return (
                <div className={styles.applyMessage}>
                    <span>This engagement is not accepting applications.</span>
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
                    ? 'Only task managers, talent managers, project managers, administrators, '
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

        if (isPrivateEngagement || !isEngagementOpen || deadlinePassed) {
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

    const pageTitle = engagement && canViewPrivateEngagement
        ? engagement.title
        : 'Engagement Details'

    return (
        <ContentLayout
            title={pageTitle}
            secondaryButtonConfig={{
                label: 'Back to Engagements',
                onClick: handleBackClick,
            }}
        >
            {renderContent()}
        </ContentLayout>
    )
}

export default EngagementDetailPage
