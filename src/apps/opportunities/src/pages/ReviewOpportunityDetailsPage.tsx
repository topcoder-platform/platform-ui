/* eslint-disable no-use-before-define, ordered-imports/ordered-imports, react/jsx-no-bind */
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
import { DefaultMemberIcon, IconOutline, LoadingSpinner } from '~/libs/ui'

import challengeTypeIcon from '../assets/challenge-type.svg'
import metricCalendarIcon from '../assets/metric-calendar.svg'
import metricRoleIcon from '../assets/metric-role.svg'
import metricSubmissionsIcon from '../assets/metric-submissions.svg'
import { ChallengeMarkdown, ReportIssueModal } from '../components'
import { ReviewApplicationSummary, ReviewOpportunity } from '../models'
import { applyToReviewOpportunity, getReviewOpportunity } from '../services'
import { memberProfileUrl } from '../utils'

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

/**
 * Reads an embedded challenge field as displayable text.
 *
 * @param opportunity review opportunity containing a challenge snapshot.
 * @param key challenge-data property name.
 * @param fallback text returned for missing or unsupported values.
 * @returns scalar value, expanded catalog name, or fallback.
 * @throws Does not throw.
 */
function challengeField(opportunity: ReviewOpportunity, key: string, fallback: string): string {
    const value = opportunity.challengeData?.[key]
    if (typeof value === 'string' || typeof value === 'number') return String(value)
    if (value && typeof value === 'object' && 'name' in value) {
        return String((value as { name?: unknown }).name ?? fallback)
    }

    return fallback
}

/**
 * Formats a Review API timestamp in the long date style used by the detail design.
 *
 * @param value ISO date value from Review or Challenge API data.
 * @returns `day month, year`, or `TBD` when the value is invalid.
 * @throws Does not throw.
 */
function formatDate(value?: string): string {
    if (!value) return 'TBD'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'TBD'
    const parts = new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
        .formatToParts(date)
    const day = parts.find(part => part.type === 'day')?.value
    const month = parts.find(part => part.type === 'month')?.value
    const year = parts.find(part => part.type === 'year')?.value
    return day && month && year ? `${day} ${month}, ${year}` : 'TBD'
}

/**
 * Formats a Review API application timestamp with its local display time.
 *
 * @param value ISO application date.
 * @returns `day month, year, hour:minute`, or `TBD` for invalid input.
 * @throws Does not throw.
 */
function formatApplicationDate(value?: string): string {
    if (!value) return 'TBD'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'TBD'
    const dateLabel = formatDate(value)
    const timeParts = new Intl.DateTimeFormat('en-GB', {
        hour: 'numeric',
        hour12: false,
        minute: '2-digit',
    })
        .formatToParts(date)
    const hour = timeParts.find(part => part.type === 'hour')?.value.replace(/^0/, '')
    const minute = timeParts.find(part => part.type === 'minute')?.value
    return hour && minute ? `${dateLabel}, ${hour}:${minute}` : dateLabel
}

/**
 * Formats the review assignment period from the API start and duration.
 *
 * @param startDate ISO assignment start.
 * @param duration assignment duration in seconds.
 * @returns a long-date range, or `TBD` when either value is unavailable.
 * @throws Does not throw.
 */
function reviewPeriod(startDate?: string, duration?: number): string {
    if (!startDate || !duration) return 'TBD'
    const start = new Date(startDate)
    if (Number.isNaN(start.getTime())) return 'TBD'
    const end = new Date(start.getTime() + (duration * 1000))
    if (Number.isNaN(end.getTime())) return 'TBD'
    const startLabel = formatDate(start.toISOString())
    const endLabel = formatDate(end.toISOString())
    if (start.getFullYear() === end.getFullYear()) {
        return `${startLabel.replace(`, ${start.getFullYear()}`, '')} - ${endLabel}`
    }

    return `${startLabel} - ${endLabel}`
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
 * Extracts human-readable technology labels from embedded Challenge API data.
 *
 * @param opportunity Review opportunity containing an optional challenge snapshot.
 * @returns unique skill labels in API order.
 * @throws Does not throw.
 */
function reviewSkillLabels(opportunity: ReviewOpportunity): string[] {
    const values = opportunity.challengeData?.technologies ?? opportunity.challengeData?.skills
    if (!Array.isArray(values)) return []
    return Array.from(new Set(values.map(value => {
        if (typeof value === 'string') return value
        if (value && typeof value === 'object' && 'name' in value) return String(value.name ?? '')
        return ''
    })
        .filter(Boolean)))
}

/**
 * Formats a reviewer payment without adding insignificant decimal places.
 *
 * @param value Review API payment value.
 * @returns USD amount matching the compensation card.
 * @throws Does not throw.
 */
function formatPayment(value?: number): string {
    return new Intl.NumberFormat('en-US', {
        currency: 'USD',
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
        style: 'currency',
    })
        .format(value ?? 0)
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
    const applicationTotal = applications.length
    const disabledLabel = !isReviewer
        ? 'Apply to be a reviewer'
        : REASON_LABELS[opportunity.canApplyReason ?? ''] ?? 'Apply to be a reviewer'
    const disabledReason = !profile
        ? REASON_LABELS.NOT_AUTHENTICATED
        : !isReviewer
            ? REASON_LABELS.NOT_REVIEWER
            : disabledLabel
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
    const basePayment = selectedPayment?.payment ?? opportunity.basePayment ?? 0
    const incrementalPayment = opportunity.incrementalPayment ?? 0
    const hasIncrementalPayment = incrementalPayment > 0
    const skills = reviewSkillLabels(opportunity)
    const postedAt = typeof opportunity.challengeData?.createdAt === 'string'
        ? opportunity.challengeData.createdAt
        : undefined
    const primaryDate = postedAt ?? opportunity.startDate

    /** Updates the Review API role selected for this application. */
    const selectApplicationRole = (event: ChangeEvent<HTMLSelectElement>): void => {
        setApplicationRole(event.target.value)
    }

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <div className={styles.rings} aria-hidden='true' />
                <div className={styles.breadcrumbsShell}>
                    <div className={styles.breadcrumbs}>
                        <Link to='/opportunities'>Opportunities</Link>
                        <span>/</span>
                        <Link to='/opportunities/reviews'>Review Opportunities</Link>
                        <span>/</span>
                        <span>{title}</span>
                    </div>
                </div>
                <div className={styles.headerInner}>
                    <div className={styles.heroLayout}>
                        <div className={styles.heroCopy}>
                            <div className={styles.badges}>
                                <span>{track}</span>
                                <span>
                                    <img alt='' aria-hidden='true' src={challengeTypeIcon} />
                                    {type}
                                </span>
                            </div>
                            <div className={styles.titleGroup}>
                                <h1>{title}</h1>
                                {skills.length > 0 && (
                                    <div className={styles.skills}>
                                        {skills.slice(0, 6)
                                            .map(skill => <span key={skill}>{skill}</span>)}
                                    </div>
                                )}
                            </div>
                            <div className={styles.meta}>
                                <span>
                                    <i><img alt='' aria-hidden='true' src={metricCalendarIcon} /></i>
                                    <span>
                                        {postedAt ? 'Posted:' : 'Starts:'}
                                        {' '}
                                        <strong>{formatDate(primaryDate)}</strong>
                                    </span>
                                </span>
                                <span>
                                    <i><img alt='' aria-hidden='true' src={metricRoleIcon} /></i>
                                    <span>
                                        <strong>
                                            {opportunity.remainingPositions ?? opportunity.openPositions ?? 0}
                                        </strong>
                                        {' '}
                                        Open Positions
                                    </span>
                                </span>
                                <span>
                                    <i><img alt='' aria-hidden='true' src={metricSubmissionsIcon} /></i>
                                    <span>
                                        Review period:
                                        {' '}
                                        <strong>{reviewPeriod(opportunity.startDate, opportunity.duration)}</strong>
                                    </span>
                                </span>
                            </div>
                        </div>
                        <aside className={styles.compensation}>
                            <div className={styles.compensationDetails}>
                                <small>Compensation</small>
                                {hasIncrementalPayment ? (
                                    <div className={styles.splitPayment}>
                                        <div className={styles.paymentAmounts}>
                                            <strong>{formatPayment(basePayment)}</strong>
                                            <span className={styles.incrementalAmount}>
                                                <strong>{formatPayment(incrementalPayment)}</strong>
                                                <span>/ additional submission</span>
                                            </span>
                                        </div>
                                        <div className={styles.paymentCaptions}>
                                            <span>
                                                Base payment
                                                <br />
                                                for the first submission
                                                <br />
                                                reviewed
                                            </span>
                                            <span>
                                                Additional payment
                                                <br />
                                                for other submissions
                                                <br />
                                                reviewed
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.singlePayment}>
                                        <strong>{formatPayment(basePayment)}</strong>
                                        <span>
                                            Paid per
                                            <br />
                                            successfully reviewed submission
                                        </span>
                                    </div>
                                )}
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
                                title={!opportunity.canApply || !isReviewer ? disabledReason : undefined}
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
            <section className={styles.detailSection}>
                <div aria-label='Review opportunity details' className={styles.tabs} role='tablist'>
                    <button
                        aria-controls='review-requirements-panel'
                        aria-selected={activeTab === 'requirements'}
                        className={activeTab === 'requirements' ? styles.activeTab : undefined}
                        id='review-requirements-tab'
                        onClick={() => setActiveTab('requirements')}
                        role='tab'
                        type='button'
                    >
                        Requirements
                    </button>
                    <button
                        aria-controls='review-applications-panel'
                        aria-selected={activeTab === 'applications'}
                        className={activeTab === 'applications' ? styles.activeTab : undefined}
                        id='review-applications-tab'
                        onClick={() => setActiveTab('applications')}
                        role='tab'
                        type='button'
                    >
                        Applications
                        <span>{applicationTotal}</span>
                    </button>
                    <i aria-hidden='true' />
                </div>
                {activeTab === 'requirements' ? (
                    <div
                        aria-labelledby='review-requirements-tab'
                        className={styles.content}
                        id='review-requirements-panel'
                        role='tabpanel'
                    >
                        <section className={styles.mainContent}>
                            <div className={styles.requirements}>
                                <div className={styles.notice}>
                                    Please read the challenge specification carefully and watch the forums for any
                                    questions or feedback concerning this challenge. It is important that you monitor
                                    any updates provided by the client or Studio Admins in the forums. Please post any
                                    questions you might have for the client in the forums.
                                </div>
                                <ChallengeMarkdown markdown={description} />
                            </div>
                        </section>
                        <aside className={styles.sidebar}>
                            {!isReviewer && (
                                <section className={styles.learning}>
                                    <h2>How to become a reviewer?</h2>
                                    <p>Interested in evaluating submissions on Topcoder?</p>
                                    <Link to='/thrive/articles/How%20to%20become%20a%20reviewer'>
                                        Learn more
                                        <IconOutline.ArrowRightIcon />
                                    </Link>
                                </section>
                            )}
                            <section className={styles.card}>
                                <h2>
                                    <IconOutline.QuestionMarkCircleIcon />
                                    Need help?
                                </h2>
                                <p>
                                    If you have questions about this review opportunity or need assistance with the
                                    application process,
                                    {' '}
                                    <button onClick={() => setIssueOpen(true)} type='button'>contact support</button>
                                    .
                                </p>
                            </section>
                            <section className={styles.card}>
                                <h2>
                                    <IconOutline.BookOpenIcon />
                                    Thrive Articles
                                </h2>
                                <p>Read educational material on Topcoder Thrive.</p>
                                <Link to='/thrive/search'>
                                    Review Process and Rules
                                    <IconOutline.ArrowRightIcon />
                                </Link>
                                <Link to='/thrive/search'>
                                    Topcoder Challenges Explained
                                    <IconOutline.ArrowRightIcon />
                                </Link>
                            </section>
                        </aside>
                    </div>
                ) : <Applications applications={applications} />}
            </section>
            <ReportIssueModal
                challengeId={opportunity.challengeId}
                onClose={() => setIssueOpen(false)}
                open={issueOpen}
            />
        </main>
    )
}

/**
 * Renders the Figma application table and client-side controls for the rows
 * included in the Review opportunity detail response.
 *
 * @param props visible, non-cancelled reviewer applications.
 * @returns full-width application table with member identity and paging.
 * @throws Does not throw.
 */
const Applications: FC<{ applications: ReviewApplicationSummary[] }> = props => {
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(10)
    const sortedApplications = [...props.applications].sort((left, right) => {
        const leftTime = new Date(left.applicationDate ?? left.createdAt ?? 0)
            .getTime()
        const rightTime = new Date(right.applicationDate ?? right.createdAt ?? 0)
            .getTime()
        return rightTime - leftTime
    })
    const totalPages = Math.max(1, Math.ceil(sortedApplications.length / perPage))
    const currentPage = Math.min(page, totalPages)
    const startIndex = (currentPage - 1) * perPage
    const visibleApplications = sortedApplications.slice(startIndex, startIndex + perPage)
    const rangeStart = sortedApplications.length === 0 ? 0 : startIndex + 1
    const rangeEnd = Math.min(sortedApplications.length, startIndex + perPage)

    return (
        <section
            aria-labelledby='review-applications-tab'
            className={styles.applicationsSection}
            id='review-applications-panel'
            role='tabpanel'
        >
            <h2>Applications</h2>
            <div className={styles.applications}>
                <div className={styles.tableScroll}>
                    <table>
                        <thead>
                            <tr>
                                <th>Handle</th>
                                <th>Role</th>
                                <th aria-sort='descending'>
                                    <span>
                                        Application Date
                                        <IconOutline.ChevronDownIcon />
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleApplications.length === 0 ? (
                                <tr>
                                    <td className={styles.emptyApplications} colSpan={3}>
                                        No applications have been submitted yet.
                                    </td>
                                </tr>
                            ) : visibleApplications.map(application => {
                                const profileHandle = application.handle || application.userHandle
                                const handle = profileHandle || application.userId || 'Member'
                                return (
                                    <tr
                                        key={application.id
                                            ?? `${application.userId}-${application.role}-${application.applicationDate
                                                ?? application.createdAt}`}
                                    >
                                        <td>
                                            <span className={styles.member}>
                                                <i><DefaultMemberIcon /></i>
                                                {profileHandle ? (
                                                    <a href={memberProfileUrl(profileHandle)}>
                                                        <strong>{handle}</strong>
                                                    </a>
                                                ) : <strong>{handle}</strong>}
                                            </span>
                                        </td>
                                        <td>{reviewRoleLabel(application.role)}</td>
                                        <td>
                                            {formatApplicationDate(
                                                application.applicationDate ?? application.createdAt,
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className={styles.applicationPagination}>
                <label>
                    Items per page:
                    <select
                        onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                            setPerPage(Number(event.target.value))
                            setPage(1)
                        }}
                        value={perPage}
                    >
                        {[10, 20, 50].map(value => <option key={value} value={value}>{value}</option>)}
                    </select>
                </label>
                <span>{`${rangeStart} - ${rangeEnd} of ${sortedApplications.length} items`}</span>
                <nav aria-label='Application pages'>
                    <button
                        aria-label='Previous page'
                        disabled={currentPage <= 1}
                        onClick={() => setPage(currentPage - 1)}
                        type='button'
                    >
                        <IconOutline.ChevronLeftIcon />
                    </button>
                    <button aria-current='page' type='button'>{currentPage}</button>
                    <button
                        aria-label='Next page'
                        disabled={currentPage >= totalPages}
                        onClick={() => setPage(currentPage + 1)}
                        type='button'
                    >
                        <IconOutline.ChevronRightIcon />
                    </button>
                </nav>
            </div>
        </section>
    )
}

export default ReviewOpportunityDetailsPage
