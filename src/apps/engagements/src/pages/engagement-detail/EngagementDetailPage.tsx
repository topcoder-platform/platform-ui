import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { authUrlLogin, useProfileContext } from '~/libs/core'
import { Button, ContentLayout, IconOutline, IconSolid, LoadingSpinner } from '~/libs/ui'
import { SkillPill } from '~/libs/shared'

import {
    Application,
    ApplicationStatus,
    Engagement,
    EngagementStatus,
} from '../../lib/models'
import { checkExistingApplication, getEngagementByNanoId } from '../../lib/services'
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

const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
    [ApplicationStatus.SUBMITTED]: 'Submitted',
    [ApplicationStatus.UNDER_REVIEW]: 'Under review',
    [ApplicationStatus.ACCEPTED]: 'Accepted',
    [ApplicationStatus.REJECTED]: 'Rejected',
}

const EngagementDetailPage: FC = () => {
    const { nanoId } = useParams<{ nanoId: string }>()
    const navigate = useNavigate()
    const { isLoggedIn } = useProfileContext()

    const [engagement, setEngagement] = useState<Engagement | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [application, setApplication] = useState<Application | undefined>(undefined)
    const [hasApplied, setHasApplied] = useState<boolean>(false)
    const [checkingApplication, setCheckingApplication] = useState<boolean>(false)
    const [applicationError, setApplicationError] = useState<string | null>(null)

    const fetchEngagement = useCallback(async (): Promise<void> => {
        if (!nanoId) {
            navigate(rootRoute || '/', {
                replace: true,
                state: { engagementError: 'Engagement not found.' },
            })
            return
        }

        setLoading(true)
        setError(null)

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
        setApplicationError(null)
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

    const handleBackClick = useCallback(() => {
        navigate(rootRoute || '/')
    }, [navigate])

    const handleViewApplications = useCallback(() => {
        navigate(`${rootRoute}/my-applications`)
    }, [navigate])

    const handleRetry = useCallback(() => {
        fetchEngagement()
    }, [fetchEngagement])

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
                            Application status: {applicationStatusLabel}
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

    return (
        <ContentLayout
            title={engagement?.title ?? 'Engagement Details'}
            secondaryButtonConfig={{
                label: 'Back to Engagements',
                onClick: handleBackClick,
            }}
        >
            {loading && (
                <div className={styles.loadingSection}>
                    <LoadingSpinner className={styles.loadingSpinner} />
                    <div className={styles.skeletonBlock} />
                    <div className={styles.skeletonLine} />
                    <div className={styles.skeletonLine} />
                </div>
            )}
            {!loading && error && (
                <div className={styles.errorState}>
                    <IconOutline.ExclamationIcon className={styles.errorIcon} />
                    <div>
                        <p className={styles.errorText}>{error}</p>
                        <Button label='Retry' onClick={handleRetry} primary />
                    </div>
                </div>
            )}
            {!loading && !error && !engagement && (
                <div className={styles.emptyState}>
                    <IconOutline.SearchIcon className={styles.emptyIcon} />
                    <h3>Engagement not available</h3>
                    <p>We could not find the engagement you were looking for.</p>
                    <Button label='Back to Engagements' secondary onClick={handleBackClick} />
                </div>
            )}
            {!loading && !error && engagement && (
                <div className={styles.detail}>
                    <div className={styles.statusRow}>
                        <StatusBadge status={engagement.status} size='md' />
                        <span className={styles.statusHint}>Updated {formatDate(engagement.updatedAt)}</span>
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
                    </div>
                    <div className={styles.skillsSection}>
                        <h2>Required Skills</h2>
                        <div className={styles.skillsList}>
                            {engagement.requiredSkills.map(skill => (
                                <SkillPill
                                    key={`${engagement.nanoId}-${skill}`}
                                    skill={{ name: skill, levels: [] }}
                                    theme='presentation'
                                />
                            ))}
                        </div>
                    </div>
                    <div className={styles.applySection}>
                        <div className={styles.applyHeader}>
                            <h2>Apply</h2>
                            {engagement.status !== EngagementStatus.CLOSED && !deadlinePassed && (
                                <span className={styles.applyHint}>Applications are open.</span>
                            )}
                        </div>
                        {renderApplySection()}
                    </div>
                </div>
            )}
        </ContentLayout>
    )
}

export default EngagementDetailPage
