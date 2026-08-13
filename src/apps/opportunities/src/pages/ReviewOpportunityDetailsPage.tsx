/* eslint-disable no-use-before-define, react/jsx-no-bind */
import {
    ChangeEvent,
    FC,
    useEffect,
    useState,
} from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import useSWR, { SWRResponse } from 'swr'

import {
    authUrlLogin,
    ProfileContextData,
    useProfileContext,
} from '~/libs/core'
import { IconOutline, LoadingSpinner } from '~/libs/ui'

import { ChallengeMarkdown, ReportIssueModal } from '../components'
import { ReviewApplicationSummary, ReviewOpportunity } from '../models'
import { applyToReviewOpportunity, getReviewOpportunity } from '../services'

import styles from './ReviewOpportunityDetailsPage.module.scss'

type ReviewTab = 'requirements' | 'applications'

const REASON_LABELS: Record<string, string> = {
    ALREADY_APPLIED: 'Application submitted',
    CHALLENGE_NOT_ACTIVE: 'Challenge is no longer active',
    NO_OPEN_POSITIONS: 'All reviewer positions are filled',
    NOT_AUTHENTICATED: 'Sign in to apply',
    NOT_REVIEWER: 'Reviewer role required',
    OPPORTUNITY_CLOSED: 'Applications are closed',
}

/** Returns challenge data as a safely displayable string. */
function challengeField(opportunity: ReviewOpportunity, key: string, fallback: string): string {
    const value = opportunity.challengeData?.[key]
    if (typeof value === 'string' || typeof value === 'number') return String(value)
    if (value && typeof value === 'object' && 'name' in value) {
        return String((value as { name?: unknown }).name ?? fallback)
    }

    return fallback
}

/** Formats Review API dates for the detail masthead. */
function formatDate(value?: string): string {
    if (!value) return 'TBD'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? 'TBD' : new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
        .format(date)
}

/** Formats seconds as the review period end date. */
function reviewEnd(startDate?: string, duration?: number): string {
    if (!startDate || !duration) return 'TBD'
    const end = new Date(new Date(startDate)
        .getTime() + (duration * 1000))
    return formatDate(end.toISOString())
}

/**
 * Normalizes Review API enum roles and payment display names to the same key.
 *
 * @param value enum token or human-readable role name.
 * @returns lowercase alphanumeric role key.
 * @throws Does not throw.
 */
function reviewRoleKey(value?: string): string {
    return (value || '').toLowerCase()
        .replace(/[^a-z0-9]/g, '')
}

/**
 * Formats a Review API role enum for selectors and application tables.
 *
 * @param value enum token or existing display name.
 * @returns title-cased role label.
 * @throws Does not throw.
 */
function reviewRoleLabel(value?: string): string {
    return (value || 'Reviewer').toLowerCase()
        .split(/[_\s]+/)
        .map(part => `${part.charAt(0)
            .toUpperCase()}${part.slice(1)}`)
        .join(' ')
}

/**
 * Renders a public review opportunity with API-authoritative reviewer gating.
 * Non-reviewers receive the education card and an inactive CTA; reviewers do
 * not receive that card and can apply only when `canApply` is true.
 *
 * @returns detail route for `/opportunities/review/:reviewOpportunityId`.
 * @throws Does not throw; API failures render an in-page state.
 */
export const ReviewOpportunityDetailsPage: FC = () => {
    const routeParams: Readonly<{ reviewOpportunityId?: string }> = useParams<{ reviewOpportunityId: string }>()
    const reviewOpportunityId = routeParams.reviewOpportunityId ?? ''
    const { profile }: ProfileContextData = useProfileContext()
    const [activeTab, setActiveTab] = useState<ReviewTab>('requirements')
    const [busy, setBusy] = useState(false)
    const [issueOpen, setIssueOpen] = useState(false)
    const [applicationRole, setApplicationRole] = useState('')
    const response: SWRResponse<ReviewOpportunity, Error> = useSWR(
        reviewOpportunityId ? `opportunities:review:${reviewOpportunityId}` : undefined,
        () => getReviewOpportunity(reviewOpportunityId),
        { revalidateOnFocus: false },
    )
    const opportunity = response.data
    const isReviewer = !!profile?.roles?.some(role => role.toLowerCase() === 'reviewer')

    useEffect(() => {
        if (!opportunity) return
        setApplicationRole(opportunity.defaultApplicationRole
            || opportunity.applicationRoles?.[0]
            || 'REVIEWER')
    }, [opportunity])

    /** Applies through the Review API and refreshes server-authoritative state. */
    const apply = async (): Promise<void> => {
        if (!profile) {
            window.location.assign(authUrlLogin(window.location.href))
            return
        }

        if (!opportunity?.canApply) return
        const role = applicationRole
            || opportunity.defaultApplicationRole
            || opportunity.applicationRoles?.[0]
            || 'REVIEWER'
        setBusy(true)
        try {
            await applyToReviewOpportunity(opportunity.id, role)
            await response.mutate()
            toast.success('Your reviewer application was submitted.')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Application failed.')
        } finally {
            setBusy(false)
        }
    }

    if (response.isValidating && !opportunity) {
        return <div className={styles.loading}><LoadingSpinner /></div>
    }

    if (response.error || !opportunity) {
        return (
            <div className={styles.notFound}>
                <IconOutline.ExclamationCircleIcon />
                <h1>Review opportunity not found</h1>
                <Link to='/opportunities/reviews'>Browse review opportunities</Link>
            </div>
        )
    }

    const title = opportunity.challengeName || challengeField(opportunity, 'name', 'Review Opportunity')
    const track = challengeField(opportunity, 'track', 'Competition')
    const type = challengeField(opportunity, 'type', opportunity.type || 'Review')
    const description = opportunity.reviewRequirements
        || opportunity.requirements
        || challengeField(
            opportunity,
            'description',
            challengeField(opportunity, 'overview', 'Challenge requirements are not available yet.'),
        )
    const applications = opportunity.applications?.filter(application => application.status !== 'CANCELLED') ?? []
    const disabledLabel = !isReviewer
        ? REASON_LABELS.NOT_REVIEWER
        : REASON_LABELS[opportunity.canApplyReason ?? ''] ?? 'Apply to be a reviewer'
    const applicationRoles = opportunity.applicationRoles?.length
        ? opportunity.applicationRoles
        : [opportunity.defaultApplicationRole || 'REVIEWER']
    const selectedApplicationRole = applicationRole
        || opportunity.defaultApplicationRole
        || applicationRoles[0]
        || 'REVIEWER'
    const selectedPayment = opportunity.payments?.find(
        payment => reviewRoleKey(payment.role) === reviewRoleKey(selectedApplicationRole),
    )
        ?? opportunity.payments?.[0]

    /** Updates the Review API role selected for this application. */
    const selectApplicationRole = (event: ChangeEvent<HTMLSelectElement>): void => {
        setApplicationRole(event.target.value)
    }

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <div className={styles.rings} aria-hidden='true' />
                <div className={styles.headerInner}>
                    <div className={styles.breadcrumbs}>
                        <Link to='/opportunities'>Opportunities</Link>
                        <span>/</span>
                        <Link to='/opportunities/reviews'>Review Opportunities</Link>
                        <span>/</span>
                        <span>{title}</span>
                    </div>
                    <div className={styles.heroLayout}>
                        <div>
                            <div className={styles.badges}>
                                <span>{track}</span>
                                <span>{type}</span>
                            </div>
                            <h1>{title}</h1>
                            <div className={styles.meta}>
                                <span>
                                    <IconOutline.CalendarIcon />
                                    {`Posted: ${formatDate(opportunity.startDate)}`}
                                </span>
                                <span>
                                    <IconOutline.UserIcon />
                                    {`${opportunity.remainingPositions
                                        ?? opportunity.openPositions
                                        ?? 0} Open Positions`}
                                </span>
                                <span>
                                    <IconOutline.DocumentTextIcon />
                                    {`Review period: ${formatDate(opportunity.startDate)} – ${reviewEnd(
                                        opportunity.startDate,
                                        opportunity.duration,
                                    )}`}
                                </span>
                            </div>
                        </div>
                        <aside className={styles.compensation}>
                            <small>Compensation</small>
                            <div>
                                <strong>{`$${selectedPayment?.payment ?? opportunity.basePayment ?? 0}`}</strong>
                                <span>
                                    {selectedPayment?.role ? `${selectedPayment.role} payment` : 'base payment'}
                                </span>
                                <strong>{`$${opportunity.incrementalPayment ?? 0}`}</strong>
                                <span>per additional submission</span>
                            </div>
                            {applicationRoles.length > 1 && (
                                <label className={styles.roleSelect}>
                                    <span>Reviewer role</span>
                                    <select onChange={selectApplicationRole} value={selectedApplicationRole}>
                                        {applicationRoles.map(role => (
                                            <option key={role} value={role}>{reviewRoleLabel(role)}</option>
                                        ))}
                                    </select>
                                </label>
                            )}
                            <button
                                disabled={!opportunity.canApply || busy || !isReviewer}
                                onClick={apply}
                                type='button'
                            >
                                <IconOutline.UploadIcon />
                                {busy
                                    ? 'Applying…'
                                    : opportunity.canApply && isReviewer
                                        ? 'Apply to be a reviewer'
                                        : disabledLabel}
                            </button>
                        </aside>
                    </div>
                </div>
            </header>
            <nav className={styles.tabs}>
                <div>
                    <button
                        className={activeTab === 'requirements' ? styles.activeTab : undefined}
                        onClick={() => setActiveTab('requirements')}
                        type='button'
                    >
                        Requirements
                    </button>
                    <button
                        className={activeTab === 'applications' ? styles.activeTab : undefined}
                        onClick={() => setActiveTab('applications')}
                        type='button'
                    >
                        Applications
                        <span>{applications.length}</span>
                    </button>
                </div>
            </nav>
            <div className={styles.content}>
                <section className={styles.mainContent}>
                    {activeTab === 'requirements' ? (
                        <div className={styles.requirements}>
                            <div className={styles.notice}>
                                Read the specification carefully and watch the challenge forum for updates.
                            </div>
                            <ChallengeMarkdown markdown={description} />
                        </div>
                    ) : (
                        <Applications applications={applications} />
                    )}
                </section>
                <aside className={styles.sidebar}>
                    {!isReviewer && (
                        <section className={styles.learning}>
                            <h2>How to become a reviewer?</h2>
                            <p>Interested in evaluating submissions on Topcoder?</p>
                            <Link to='/thrive/articles/How%20to%20become%20a%20reviewer'>
                                Learn more
                                {' '}
                                <IconOutline.ArrowRightIcon />
                            </Link>
                        </section>
                    )}
                    <section className={styles.card}>
                        <h2>
                            <IconOutline.QuestionMarkCircleIcon />
                            Need help?
                        </h2>
                        <p>Contact the team for assistance with the review application process.</p>
                        <button onClick={() => setIssueOpen(true)} type='button'>Contact support</button>
                    </section>
                    <section className={styles.card}>
                        <h2>
                            <IconOutline.BookOpenIcon />
                            Thrive Articles
                        </h2>
                        <p>Read educational material on Topcoder Thrive.</p>
                        <Link to='/thrive/search'>Review Process and Rules</Link>
                        <Link to='/thrive/search'>Topcoder Challenges Explained</Link>
                    </section>
                </aside>
            </div>
            <ReportIssueModal
                challengeId={opportunity.challengeId}
                onClose={() => setIssueOpen(false)}
                open={issueOpen}
            />
        </main>
    )
}

/** Renders review applications without exposing member-only mutation actions. */
const Applications: FC<{ applications: ReviewApplicationSummary[] }> = props => (
    <div className={styles.applications}>
        <h2>Reviewer Applications</h2>
        {props.applications.length === 0 ? (
            <p>No applications have been submitted yet.</p>
        ) : (
            <table>
                <thead>
                    <tr>
                        <th>Member</th>
                        <th>Role</th>
                        <th>Completed reviews</th>
                        <th>Open reviews</th>
                        <th>Status</th>
                        <th>Applied</th>
                    </tr>
                </thead>
                <tbody>
                    {props.applications.map(application => (
                        <tr
                            key={application.id
                                ?? `${application.userId}-${application.role}-${application.applicationDate
                                    ?? application.createdAt}`}
                        >
                            <td>{application.handle || application.userHandle || application.userId || 'Member'}</td>
                            <td>{reviewRoleLabel(application.role)}</td>
                            <td>{application.latestCompletedReviews ?? '—'}</td>
                            <td>{application.openReviews ?? '—'}</td>
                            <td>{application.status || 'Pending'}</td>
                            <td>{formatDate(application.applicationDate ?? application.createdAt)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
    </div>
)

export default ReviewOpportunityDetailsPage
