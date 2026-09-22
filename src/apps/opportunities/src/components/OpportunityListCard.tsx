/* eslint-disable ordered-imports/ordered-imports, react/jsx-no-bind */
import {
    FC,
    ReactNode,
    RefObject,
    SVGProps,
    useEffect,
    useRef,
    useState,
} from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'
import { EnvironmentConfig } from '~/config'
import { absoluteRootRoute as copilotAbsoluteRootRoute } from '~/apps/copilots'
import { IconOutline, Tooltip } from '~/libs/ui'

import {
    ChallengeOpportunity,
    CopilotOpportunity,
    EngagementOpportunity,
    OpportunityItem,
    OpportunityKind,
    OpportunitySkill,
    OpportunityView,
    ReviewOpportunity,
} from '../models'
import { engagementOpportunityState } from '../utils/engagement-status.utils'
import { formatOpportunityDate } from '../utils/opportunity-date.utils'

import { ReactComponent as ApplicationWaitlistedIcon } from '../assets/application-waitlisted.svg'
import { ReactComponent as ChallengeTypeIcon } from '../assets/challenge-type.svg'
import { ReactComponent as CompletedIcon } from '../assets/check-double.svg'
import { ReactComponent as First2FinishTypeIcon } from '../assets/first2finish-type.svg'
import { ReactComponent as MarathonTypeIcon } from '../assets/marathon-type.svg'
import { ReactComponent as MedalFirstIcon } from '../assets/medal-1.svg'
import { ReactComponent as MedalSecondIcon } from '../assets/prize-medal-2.svg'
import { ReactComponent as MedalThirdIcon } from '../assets/prize-medal-3.svg'
import { ReactComponent as CalendarMetricIcon } from '../assets/metric-calendar.svg'
import { ReactComponent as HoursMetricIcon } from '../assets/metric-hours.svg'
import { ReactComponent as PaymentMetricIcon } from '../assets/metric-payment.svg'
import { ReactComponent as PostsMetricIcon } from '../assets/metric-posts.svg'
import { ReactComponent as RegistrantsMetricIcon } from '../assets/metric-registrants.svg'
import { ReactComponent as RoleMetricIcon } from '../assets/metric-role.svg'
import { ReactComponent as StartMetricIcon } from '../assets/metric-start.svg'
import { ReactComponent as SubmissionsMetricIcon } from '../assets/metric-submissions.svg'
import { ReactComponent as PhaseAiScreeningIcon } from '../assets/phase-ai-screening.svg'
import { ReactComponent as PhaseAppealsIcon } from '../assets/phase-appeals.svg'
import { ReactComponent as PhaseAppealsResponseIcon } from '../assets/phase-appeals-response.svg'
import { ReactComponent as PhaseApprovalIcon } from '../assets/phase-approval.svg'
import { ReactComponent as PhaseFinalFixesIcon } from '../assets/phase-final-fixes.svg'
import { ReactComponent as PhaseOnHoldIcon } from '../assets/phase-on-hold.svg'
import { ReactComponent as PhaseRegistrationIcon } from '../assets/phase-registration.svg'
import { ReactComponent as PhaseReviewIcon } from '../assets/phase-review.svg'
import { ReactComponent as PhaseScreeningIcon } from '../assets/phase-screening.svg'
import { ReactComponent as PhaseSubmissionIcon } from '../assets/phase-submission.svg'
import { ReactComponent as PhaseWinnersIcon } from '../assets/phase-winners.svg'
import { ReactComponent as RegistrationClosedIcon } from '../assets/registration-closed.svg'
import { ReactComponent as RegistrationOpenIcon } from '../assets/registration-open.svg'
import { ReactComponent as TaskTypeIcon } from '../assets/task-type.svg'
import {
    ChallengePlacementPrize,
    challengeCatalogKey,
    challengeCatalogName,
    challengeCurrentPhase,
    challengePhaseTiming,
    challengePlacementPrizes,
    challengeRegistrationIsOpen,
    formatChallengeTimeLeft,
    FUN_CHALLENGE_PRIZE_LABEL,
} from './challenge-card.utils'
import {
    reviewFirstSubmissionPayment,
    reviewOpportunityIsWaitlisted,
    reviewOpportunityLabels,
} from '../utils/review-opportunity.utils'
import {
    ChallengeDetailTab,
    challengeDetailPath,
} from '../utils/challenge-detail-route.utils'
import { decodeHtmlEntities, htmlToPlainText } from '../utils/html-text.utils'
import styles from './OpportunityListCard.module.scss'

interface OpportunityListCardProps {
    applicationState?: string
    item: OpportunityItem
    kind: OpportunityKind
    memberApplied?: boolean
    onSkillClick?: (skill: string) => void
    registered?: boolean
    view?: OpportunityView
}

interface CompetitionListCardProps {
    item: ChallengeOpportunity
    onSkillClick?: (skill: string) => void
    registered?: boolean
    view?: OpportunityView
}

interface SkillFilterTagProps {
    className?: string
    onSelect?: (skill: string) => void
    skill: string
}

/** One authored tag or standardized skill shown on a competition card. */
interface ChallengeLabel {
    /** Authored challenge tags read as outlined pills; skills read as filled chips. */
    isTag: boolean
    label: string
}

interface CardViewModel {
    badge: string
    description?: string
    href: string
    meta: Array<{ icon: ReactNode; label: string; value: string }>
    skills: string[]
    state?: string
    title: string
    type?: string
}

interface ChallengeTypePresentation {
    icon: FC<SVGProps<SVGSVGElement>>
    label: string
}

interface CompetitionMetric {
    icon: ReactNode
    label: string
    tab: ChallengeDetailTab
    value: string
}

type ChallengeWinner = NonNullable<ChallengeOpportunity['winners']>[number]

interface CompetitionWinnerAvatarProps {
    placement: number
    winner: ChallengeWinner
}

const challengeTypePresentations: Record<string, ChallengeTypePresentation> = {
    challenge: { icon: ChallengeTypeIcon, label: 'Challenge' },
    first2finish: { icon: First2FinishTypeIcon, label: 'First 2 Finish' },
    marathonmatch: { icon: MarathonTypeIcon, label: 'Marathon Match' },
    task: { icon: TaskTypeIcon, label: 'Task' },
}

const medalIcons: Array<FC<SVGProps<SVGSVGElement>>> = [MedalFirstIcon, MedalSecondIcon, MedalThirdIcon]

/**
 * Renders one API-backed winner photo with its existing placement medal. A
 * failed or unavailable member photo falls back to the winner's real handle
 * initial without inventing identity artwork.
 *
 * @param props Challenge API winner, enriched Members API photo, and placement.
 * @returns compact winner avatar used by completed competition cards.
 * @throws Does not throw; image failures switch to an initial fallback.
 */
const CompetitionWinnerAvatar: FC<CompetitionWinnerAvatarProps> = props => {
    const [failedPhotoURL, setFailedPhotoURL] = useState<string>()
    const handle = props.winner.handle?.trim() || String(props.winner.userId ?? 'Winner')
    const photoURL = props.winner.photoURL
    const showPhoto = !!photoURL && photoURL !== failedPhotoURL
    const MedalIcon = medalIcons[props.placement - 1] ?? MedalThirdIcon

    return (
        <span className={styles.winnerAvatar} title={handle}>
            <span aria-hidden='true' className={styles.winnerPhoto}>
                {showPhoto
                    ? <img alt='' onError={() => setFailedPhotoURL(photoURL)} src={photoURL} />
                    : handle.charAt(0)
                        .toUpperCase()}
            </span>
            <span aria-hidden='true' className={styles.winnerMedal}>
                <MedalIcon />
            </span>
        </span>
    )
}

/**
 * Resolves the glyph for a challenge phase pill.
 *
 * Each phase family reads with its own icon, matching the authored phase tag
 * set: registration, submission, screening, AI screening or AI review, review,
 * appeals, appeals response, winners, final fixes, approval and on hold.
 * Checkpoint phases share their parent phase's glyph, and an unrecognized phase
 * falls back to the review glyph.
 *
 * @param phaseKey normalized phase name from `challengeCatalogKey`.
 * @returns the SVG component for that phase family.
 * @throws Does not throw.
 */
function challengePhaseIcon(phaseKey: string): FC<SVGProps<SVGSVGElement>> {
    if (phaseKey.includes('registration') || phaseKey === 'open') return PhaseRegistrationIcon
    if (phaseKey.includes('submission')) return PhaseSubmissionIcon
    if (phaseKey.includes('aiscreening') || phaseKey.includes('aireview')) return PhaseAiScreeningIcon
    if (phaseKey.includes('screening')) return PhaseScreeningIcon
    if (phaseKey.includes('appealsresponse')) return PhaseAppealsResponseIcon
    if (phaseKey.includes('appeals')) return PhaseAppealsIcon
    if (phaseKey.includes('winner')) return PhaseWinnersIcon
    if (phaseKey.includes('finalfix')) return PhaseFinalFixesIcon
    if (phaseKey.includes('approval')) return PhaseApprovalIcon
    if (phaseKey.includes('onhold')) return PhaseOnHoldIcon
    return PhaseReviewIcon
}

/**
 * Reports whether an element's text is visually clipped by its line clamp.
 *
 * Card titles are clamped to two or three lines and end in an ellipsis once
 * they overflow. The title tooltip exists only to reveal what the clamp hides,
 * so it is suppressed while the whole title is visible.
 *
 * Re-measures whenever the element resizes or the text changes. Environments
 * without `ResizeObserver` fall back to the initial measurement.
 *
 * @param text the rendered text, used to re-measure when the title changes.
 * @returns a ref to attach to the clamped element, and whether its text is clipped.
 * @throws Does not throw.
 */
function useIsTextClipped(text: string): [RefObject<HTMLHeadingElement>, boolean] {
    const ref = useRef<HTMLHeadingElement>(null)
    const [clipped, setClipped] = useState(false)

    useEffect(() => {
        const element = ref.current
        if (!element) return undefined

        const measure = (): void => setClipped(
            element.scrollHeight - element.clientHeight > 1
            || element.scrollWidth - element.clientWidth > 1,
        )

        measure()
        if (typeof ResizeObserver === 'undefined') return undefined

        const observer = new ResizeObserver(measure)
        observer.observe(element)
        return () => observer.disconnect()
    }, [text])

    return [ref, clipped]
}

/**
 * Renders a card skill as a native filter control when the list supplies a
 * selection callback.
 *
 * @param props skill label, optional styling, and list-filter callback.
 * @returns interactive or presentational skill tag.
 * @throws Does not throw.
 */
const SkillFilterTag: FC<SkillFilterTagProps> = props => {
    if (props.onSelect) {
        return (
            <button
                aria-label={`Filter by ${props.skill}`}
                className={classNames(props.className, styles.filterableSkill)}
                onClick={() => props.onSelect?.(props.skill)}
                type='button'
            >
                {props.skill}
            </button>
        )
    }

    return (
        <span className={props.className}>
            {props.skill}
        </span>
    )
}

/**
 * Formats a date for compact card metadata.
 *
 * @param value ISO date from an owning API.
 * @returns `17 Sep 2026` in the viewer's timezone, or `TBD` when absent/invalid.
 * @throws Does not throw.
 */
function formatDate(value?: string): string {
    return formatOpportunityDate(value, 'TBD')
}

/**
 * Formats the Engagement API's anticipated-start enum, while retaining an ISO
 * date fallback for older responses.
 *
 * @param value anticipated-start enum or legacy ISO timestamp.
 * @returns member-friendly start timeframe.
 * @throws Does not throw.
 */
export function formatAnticipatedStart(value?: string): string {
    const labels: Record<string, string> = {
        FEW_DAYS: 'In a few days',
        FEW_WEEKS: 'In a few weeks',
        IMMEDIATE: 'Immediate',
    }
    return value && labels[value] ? labels[value] : formatDate(value)
}

/**
 * Formats the canonical top-level engagement duration fields, with legacy
 * nested-duration and explicit date-range fallbacks.
 *
 * @param item Engagement API response.
 * @returns duration label such as `8 weeks`, `2 months`, or `TBD`.
 * @throws Does not throw.
 */
export function formatEngagementDuration(item: EngagementOpportunity): string {
    const weeks = item.durationWeeks ?? item.duration?.lengthInWeeks
    if (weeks) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`
    const months = item.durationMonths ?? item.duration?.lengthInMonths
    if (months) return `${months} ${months === 1 ? 'month' : 'months'}`

    const startValue = item.durationStartDate ?? item.duration?.startDate
    const endValue = item.durationEndDate ?? item.duration?.endDate
    const start = startValue ? new Date(startValue) : undefined
    const end = endValue ? new Date(endValue) : undefined
    if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000))
        return `${days} ${days === 1 ? 'day' : 'days'}`
    }

    return 'TBD'
}

/**
 * Resolves member-facing Engagement skill labels from the hydrated API field.
 *
 * @param item Engagement API response.
 * @returns hydrated names, or legacy required-skill IDs when names are absent.
 * @throws Does not throw.
 */
export function engagementSkillNames(item: EngagementOpportunity): string[] {
    /**
     * Trims, removes empty labels, and deduplicates names for stable card keys.
     *
     * @param values raw API skill labels or IDs.
     * @returns normalized unique labels in source order.
     * @throws Does not throw.
     */
    const normalizedNames = (values: string[]): string[] => Array.from(new Set(values
        .map(value => value.trim())
        .filter(Boolean)))
    const names = normalizedNames((item.skills ?? []).map(skill => skill.name))
    return names.length ? names : normalizedNames(item.requiredSkills ?? [])
}

/**
 * Converts an API enum token into title-cased words for card metadata.
 *
 * @param value underscore-delimited enum value.
 * @returns title-cased label, or undefined when the value is absent.
 * @throws Does not throw.
 */
function enumLabel(value?: string): string | undefined {
    return value?.toLowerCase()
        .split('_')
        .map(part => `${part.charAt(0)
            .toUpperCase()}${part.slice(1)}`)
        .join(' ')
}

/**
 * Normalizes owner-specific API statuses to the three authored card states.
 *
 * @param applied whether the current member already applied.
 * @param open whether the opportunity is currently accepting applications.
 * @returns Applied, Open for application, or Application closed.
 * @throws Does not throw.
 */
function applicationState(applied: boolean, open: boolean): string {
    if (applied) return 'Applied'
    return open ? 'Open for application' : 'Application closed'
}

/**
 * Converts the caller's Review API application status to its authored card
 * label instead of reducing terminal decisions to the generic Applied state.
 *
 * @param item Review API opportunity containing caller-scoped applications.
 * @param open whether the review opportunity still accepts applications.
 * @returns Approved, Rejected, Cancelled, Waitlisted, Applied, or the public availability state.
 * @throws Does not throw.
 */
function reviewApplicationState(item: ReviewOpportunity, open: boolean): string {
    if (reviewOpportunityIsWaitlisted(item)) return 'Waitlisted'
    const statusKey = challengeCatalogKey(item.myApplications?.[0]?.status)
    const terminalLabels: Record<string, string> = {
        approved: 'Approved',
        cancelled: 'Cancelled',
        rejected: 'Rejected',
    }
    return terminalLabels[statusKey] ?? applicationState(!!item.myApplications?.length, open)
}

/**
 * Maps owning-API discipline enums to the authored Opportunities track labels.
 *
 * @param value API role or track token.
 * @returns Figma-facing track label, retaining unknown values in title case.
 * @throws Does not throw.
 */
function opportunityTrackLabel(value?: string): string {
    const key = challengeCatalogKey(value)
    const labels: Record<string, string> = {
        ai: 'AI',
        dataengineer: 'Data Science',
        datascience: 'Data Science',
        datascientist: 'Data Science',
        design: 'Design',
        designer: 'Design',
        dev: 'Development',
        development: 'Development',
        qa: 'QA',
        softwaredeveloper: 'Development',
    }
    return labels[key] ?? enumLabel(value) ?? 'Opportunity'
}

/**
 * Formats a Challenge API prize without mislabeling point or non-USD values.
 *
 * @param prize typed placement prize.
 * @returns compact currency, points, or typed-value text.
 * @throws Does not throw.
 */
function formatPrize(prize: ChallengePlacementPrize): string {
    const type = prize.type?.trim()
        .toUpperCase()
    const number = new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2,
        useGrouping: false,
    })
        .format(prize.value)
    if (type === 'POINT' || type === 'POINTS') return `${number} pts`

    const currency = type || 'USD'
    if (/^[A-Z]{3}$/.test(currency)) {
        try {
            return new Intl.NumberFormat('en-US', {
                currency,
                maximumFractionDigits: 2,
                minimumFractionDigits: 0,
                style: 'currency',
                useGrouping: false,
            })
                .format(prize.value)
        } catch {
            // Fall through to the explicit typed-value treatment below.
        }
    }

    return type ? `${number} ${type}` : number
}

/**
 * Produces a plain excerpt from Markdown or HTML description content.
 *
 * Character references such as `&ndash;` and `&nbsp;` are resolved so they do
 * not surface as literal text in the card excerpt.
 *
 * @param value rich text from the API.
 * @returns short plain-text excerpt.
 * @throws Does not throw.
 */
function descriptionExcerpt(value?: string): string | undefined {
    if (!value) return undefined
    const plain = htmlToPlainText(value)
    return plain.length > 180 ? `${plain.slice(0, 177)}…` : plain
}

/**
 * Resolves the Figma track-pill label for current and legacy Challenge API values.
 *
 * @param item Challenge API list item.
 * @returns abbreviated QA label or the owning catalog display name.
 * @throws Does not throw.
 */
function challengeTrackLabel(item: ChallengeOpportunity): string {
    const trackKey = challengeCatalogKey(item.track)
    if (trackKey === 'qualityassurance') return 'QA'
    if (trackKey === 'ai' || trackKey === 'artificialintelligence') return 'AI'
    return challengeCatalogName(item.track, 'Competition')
}

/**
 * Selects the Figma subtype label and icon for a Challenge API type.
 *
 * @param item Challenge API list item.
 * @returns mapped Challenge, First 2 Finish, Marathon Match, or Task presentation.
 * @throws Does not throw; unknown types use the Challenge icon and API label.
 */
function challengeTypePresentation(item: ChallengeOpportunity): ChallengeTypePresentation {
    const typeKey = challengeCatalogKey(item.type)
    return challengeTypePresentations[typeKey] ?? {
        icon: ChallengeTypeIcon,
        label: challengeCatalogName(item.type, 'Challenge'),
    }
}

/**
 * Deduplicates a challenge's authored tags and standardized skills, flagging
 * which is which so the card can render them differently.
 *
 * Tags come first, matching the Aug 2026 Opportunities design, and a skill that
 * repeats a tag is dropped rather than shown twice.
 *
 * @param item Challenge API list item.
 * @returns non-empty labels in stable source order, tags before skills.
 * @throws Does not throw.
 */
function challengeLabels(item: ChallengeOpportunity): ChallengeLabel[] {
    const seen = new Set<string>()
    return [
        ...(item.tags ?? []).map(label => ({ isTag: true, label })),
        ...(item.skills ?? []).map(skill => ({ isTag: false, label: skill.name })),
    ]
        .map(entry => ({ ...entry, label: entry.label?.trim() ?? '' }))
        .filter(entry => {
            if (!entry.label || seen.has(entry.label)) return false
            seen.add(entry.label)
            return true
        })
}

/**
 * Returns the shared Figma foreground and background palette for an opportunity track pill.
 *
 * @param trackKey normalized owning-API track key, including DEV and QA aliases.
 * @returns matching Figma track color class or the neutral fallback class.
 * @throws Does not throw.
 */
function challengeTrackClass(trackKey: string): string {
    const trackClasses: Record<string, string> = {
        ai: styles.artificialIntelligenceBadge,
        artificialintelligence: styles.artificialIntelligenceBadge,
        datascience: styles.dataScienceBadge,
        design: styles.designBadge,
        dev: styles.developmentBadge,
        development: styles.developmentBadge,
        qa: styles.qualityAssuranceBadge,
        qualityassurance: styles.qualityAssuranceBadge,
    }
    return trackClasses[trackKey] ?? styles.competitionBadge
}

/**
 * Renders the visible placement prizes from the Challenge API PLACEMENT set.
 *
 * @param prizes placement prizes with stable source-order positions.
 * @param funChallenge whether leaderboard scoring replaces individual prizes.
 * @returns Figma medal/value row with an overflow count when required.
 * @throws Does not throw.
 */
function renderChallengePrizes(prizes: ChallengePlacementPrize[], funChallenge: boolean): ReactNode {
    if (funChallenge) return <span className={styles.prizeUnavailable}>{FUN_CHALLENGE_PRIZE_LABEL}</span>
    if (!prizes.length) return <span className={styles.prizeUnavailable}>Prize details coming soon</span>

    const visiblePrizes = prizes.slice(0, medalIcons.length)
    const remaining = prizes.length - visiblePrizes.length
    return (
        <>
            {visiblePrizes.map(prize => {
                const MedalIcon = medalIcons[prize.placement - 1] ?? MedalThirdIcon
                return (
                    <span className={styles.prize} key={`placement-${prize.placement}`}>
                        <span aria-hidden='true' className={styles.medalIcon}>
                            <MedalIcon />
                        </span>
                        <strong>{formatPrize(prize)}</strong>
                    </span>
                )
            })}
            {remaining > 0 && <span className={styles.morePrizes}>{`+${remaining}`}</span>}
        </>
    )
}

/** Converts engagement data to the shared card presentation model. */
function engagementView(item: EngagementOpportunity, memberApplied: boolean): CardViewModel {
    const role = enumLabel(item.role) || 'Contributor'
    return {
        badge: opportunityTrackLabel(item.role),
        description: descriptionExcerpt(item.description),
        href: `${EnvironmentConfig.ENGAGEMENTS_URL}/${item.nanoId ?? item.id}`,
        meta: [
            { icon: <RoleMetricIcon />, label: 'Role', value: role },
            { icon: <CalendarMetricIcon />, label: 'Duration', value: formatEngagementDuration(item) },
            {
                icon: <StartMetricIcon />,
                label: 'Start',
                value: formatAnticipatedStart(item.anticipatedStart),
            },
            {
                icon: <PaymentMetricIcon />,
                label: 'Payment',
                value: item.compensationRange || 'Negotiable',
            },
        ],
        skills: engagementSkillNames(item),
        state: engagementOpportunityState(
            item,
            memberApplied,
            challengeCatalogKey(item.status) === 'open',
        ),
        title: decodeHtmlEntities(item.title),
    }
}

/** Converts copilot data to the shared card presentation model. */
function copilotView(item: CopilotOpportunity): CardViewModel {
    return {
        badge: opportunityTrackLabel(item.projectType || item.type || 'Copilot'),
        description: descriptionExcerpt(item.overview),
        href: `${copilotAbsoluteRootRoute}/opportunity/${encodeURIComponent(String(item.id))}`,
        meta: [
            {
                icon: <HoursMetricIcon />,
                label: 'Hours / week',
                value: String(item.numHoursPerWeek ?? 'TBD'),
            },
            {
                icon: <CalendarMetricIcon />,
                label: 'Duration',
                value: item.numWeeks ? `${item.numWeeks} weeks` : 'TBD',
            },
            { icon: <StartMetricIcon />, label: 'Start', value: formatDate(item.startDate) },
        ],
        skills: (item.skills ?? []).map((skill: OpportunitySkill) => skill.name),
        state: applicationState(!!item.hasApplied, challengeCatalogKey(item.status) === 'active'),
        title: decodeHtmlEntities(
            item.opportunityTitle || item.projectName || item.project?.name,
        ) || 'Copilot Opportunity',
        type: opportunityTrackLabel(item.type || item.projectType || 'Copilot'),
    }
}

/**
 * Resolves the public application total for a review opportunity.
 *
 * @param item Review API opportunity response.
 * @returns public total, falling back to the visible rows for older API deployments.
 * @throws Does not throw.
 */
export function reviewApplicationTotal(item: ReviewOpportunity): number {
    return item.applicationCount ?? item.applications?.length ?? 0
}

/**
 * Formats the reviewer compensation shown on an opportunity card.
 *
 * @param value Review API payment value.
 * @returns concise USD amount, or `TBD` when no finite amount is available.
 * @throws Does not throw.
 */
export function formatReviewPayment(value?: number): string {
    if (value === undefined || !Number.isFinite(value)) return 'TBD'
    return new Intl.NumberFormat('en-US', {
        currency: 'USD',
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
        style: 'currency',
    })
        .format(value)
}

/** Converts review data to the shared card presentation model. */
function reviewView(item: ReviewOpportunity): CardViewModel {
    const track = String(item.challengeData?.track ?? item.challengeData?.trackName ?? 'Review')
    return {
        badge: track,
        href: `/opportunities/review/${item.id}`,
        meta: [
            { icon: <RoleMetricIcon />, label: 'Role', value: item.payments?.[0]?.role || 'Reviewer' },
            {
                icon: <PaymentMetricIcon />,
                label: 'Payment',
                value: formatReviewPayment(reviewFirstSubmissionPayment(item)),
            },
            { icon: <StartMetricIcon />, label: 'Start', value: formatDate(item.startDate) },
            {
                icon: <SubmissionsMetricIcon />,
                label: 'Applications',
                value: String(reviewApplicationTotal(item)),
            },
        ],
        skills: reviewOpportunityLabels(item),
        state: reviewApplicationState(
            item,
            item.canApply === true || challengeCatalogKey(item.status) === 'open',
        ),
        title: decodeHtmlEntities(
            item.challengeName || String(item.challengeData?.name ?? ''),
        ) || 'Review Opportunity',
        type: String(item.challengeData?.type ?? item.type ?? ''),
    }
}

/**
 * Selects the owning API adapter for a list item.
 *
 * @param kind opportunity domain selected in the hero.
 * @param item raw owning API response.
 * @param memberApplied whether the active list is scoped to the member's applications.
 * @returns shared Figma card presentation data.
 * @throws Does not throw when called with matching kind/item data.
 */
function toViewModel(kind: OpportunityKind, item: OpportunityItem, memberApplied: boolean): CardViewModel {
    if (kind === 'engagements') return engagementView(item as EngagementOpportunity, memberApplied)
    if (kind === 'copilots') return copilotView(item as CopilotOpportunity)
    return reviewView(item as ReviewOpportunity)
}

/**
 * Renders the Figma competition card using Challenge API placement and phase data.
 *
 * @param item Challenge API list item.
 * @returns linked competition card with catalog tags, a distinct completed-state icon,
 * placement prizes, phase progress, and metrics.
 * @throws Does not throw; absent API fields use explicit pending placeholders.
 */
const CompetitionListCard: FC<CompetitionListCardProps> = props => {
    const item = props.item
    const title = decodeHtmlEntities(item.name)
    const [titleRef, titleClipped] = useIsTextClipped(title)
    const type = challengeTypePresentation(item)
    const TypeIcon = type.icon
    const trackKey = challengeCatalogKey(item.track)
    const skillLabels = challengeLabels(item)
    const visibleSkills = skillLabels.slice(0, props.view === 'grid' ? 3 : 5)
    const remainingSkills = skillLabels.length - visibleSkills.length
    const placementPrizes = challengePlacementPrizes(item)
    const phase = challengeCurrentPhase(item)
    const phaseKey = challengeCatalogKey(phase?.name)
    const PhaseIcon = challengePhaseIcon(phaseKey)
    const phaseLabel = phaseKey === 'open' ? 'Registration & Submission' : phase?.name || 'Schedule'
    const phaseTiming = challengePhaseTiming(phase)
    const timeLeft = formatChallengeTimeLeft(phaseTiming) || 'TBD'
    // A phase whose deadline has passed reads in the alert red, so an overdue
    // challenge is obvious at a glance in the listing.
    const phasePastDue = (phaseTiming.remainingMilliseconds ?? 0) < 0
    const progress = Math.round(phaseTiming.progressPercent)
    const registrationOpen = challengeRegistrationIsOpen(item)
    const completed = challengeCatalogKey(item.status) === 'completed'
    const visibleWinners = completed
        ? (item.winners ?? [])
            .map((winner, index) => ({
                placement: winner.placement ?? index + 1,
                winner,
            }))
            .filter(entry => entry.placement >= 1 && entry.placement <= 3)
            .sort((first, second) => first.placement - second.placement)
            .slice(0, 3)
        : []
    const metrics: CompetitionMetric[] = [
        {
            icon: <SubmissionsMetricIcon aria-hidden='true' />,
            label: 'Submissions',
            tab: 'submissions',
            value: item.numOfSubmissions === undefined ? '—' : String(item.numOfSubmissions),
        },
        {
            icon: <RegistrantsMetricIcon aria-hidden='true' />,
            label: 'Registrants',
            tab: 'registrants',
            value: item.numOfRegistrants === undefined ? '—' : String(item.numOfRegistrants),
        },
        {
            icon: <PostsMetricIcon aria-hidden='true' />,
            label: 'Posts',
            tab: 'forum',
            value: item.numOfPosts === undefined ? '—' : String(item.numOfPosts),
        },
    ]

    return (
        <article
            className={classNames(styles.card, styles.competitionCard, {
                [styles.gridCard]: props.view === 'grid',
            })}
        >
            <div className={styles.competitionMain}>
                <div className={styles.competitionCopy}>
                    <div className={styles.eyebrow}>
                        <span className={classNames(
                            styles.badge,
                            styles.trackBadge,
                            challengeTrackClass(trackKey),
                        )}
                        >
                            {challengeTrackLabel(item)}
                        </span>
                        <span className={styles.challengeType}>
                            <TypeIcon aria-hidden='true' />
                            {type.label}
                        </span>
                        <span className={classNames(styles.registrationState, {
                            [styles.registrationClosed]: !completed && !props.registered && !registrationOpen,
                            [styles.registrationRegistered]: !completed && props.registered,
                        })}
                        >
                            {completed
                                ? <CompletedIcon aria-hidden='true' />
                                : props.registered
                                    ? <IconOutline.CheckIcon aria-hidden='true' />
                                    : registrationOpen
                                        ? <RegistrationOpenIcon aria-hidden='true' />
                                        : <RegistrationClosedIcon aria-hidden='true' />}
                            {completed
                                ? 'Completed'
                                : props.registered
                                    ? 'Registered'
                                    : registrationOpen ? 'Open for registration' : 'Registration closed'}
                        </span>
                    </div>
                    <Tooltip
                        className={styles.cardTooltip}
                        content={title}
                        disableTooltip={!titleClipped}
                        place='bottom'
                        strategy='fixed'
                    >
                        <h3 ref={titleRef}>
                            <Link
                                className={styles.titleLink}
                                to={challengeDetailPath(item.id)}
                            >
                                {title}
                            </Link>
                        </h3>
                    </Tooltip>
                    {visibleSkills.length > 0 && (
                        <div className={styles.skills}>
                            {visibleSkills.map(entry => (
                                <SkillFilterTag
                                    className={classNames({ [styles.tagLabel]: entry.isTag })}
                                    key={entry.label}
                                    onSelect={props.onSkillClick}
                                    skill={entry.label}
                                />
                            ))}
                            {remainingSkills > 0 && (
                                <Tooltip
                                    className={styles.cardTooltip}
                                    content={(
                                        <ul>
                                            {skillLabels.slice(visibleSkills.length)
                                                .map(entry => <li key={entry.label}>{entry.label}</li>)}
                                        </ul>
                                    )}
                                    place='bottom'
                                    strategy='fixed'
                                >
                                    <span>{`+${remainingSkills}`}</span>
                                </Tooltip>
                            )}
                        </div>
                    )}
                </div>
                <div className={styles.competitionFooter}>
                    <div aria-label='Placement prizes' className={styles.prizes}>
                        {renderChallengePrizes(placementPrizes, item.funChallenge === true)}
                    </div>
                    {visibleWinners.length > 0 && (
                        <Link
                            aria-label='View winners'
                            className={styles.winnersLink}
                            to={challengeDetailPath(item.id, 'winners')}
                        >
                            {visibleWinners.map(entry => (
                                <CompetitionWinnerAvatar
                                    key={`${entry.placement}-${entry.winner.userId ?? entry.winner.handle ?? 'winner'}`}
                                    placement={entry.placement}
                                    winner={entry.winner}
                                />
                            ))}
                        </Link>
                    )}
                    {!completed && phase && (
                        <div className={styles.phase}>
                            <div className={styles.phaseHeading}>
                                <span className={styles.phaseLabel}>
                                    <PhaseIcon aria-hidden='true' />
                                    {phaseLabel}
                                </span>
                                <span className={classNames(styles.timeLeft, {
                                    [styles.timeLeftPastDue]: phasePastDue,
                                })}
                                >
                                    {timeLeft}
                                </span>
                            </div>
                            <div
                                aria-label={`${phaseLabel} phase progress`}
                                aria-valuemax={100}
                                aria-valuemin={0}
                                aria-valuenow={progress}
                                className={styles.progress}
                                role='progressbar'
                            >
                                <span style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <dl className={classNames(styles.meta, styles.competitionMeta)}>
                {metrics.map(row => (
                    <div className={styles.metricRow} key={row.label}>
                        {row.icon}
                        <dt>{`${row.label}:`}</dt>
                        <dd>
                            {row.value}
                            <Link
                                aria-label={`View ${row.label}`}
                                className={styles.metricLink}
                                to={challengeDetailPath(item.id, row.tab)}
                            />
                        </dd>
                    </div>
                ))}
            </dl>
        </article>
    )
}

/**
 * Renders a responsive list card shared by all four owning API payloads.
 *
 * @param props opportunity kind, raw item, member application state, and presentation mode.
 * @returns linked opportunity card with tags and domain-specific metadata.
 * @throws Does not throw.
 */
export const OpportunityListCard: FC<OpportunityListCardProps> = props => {
    // Resolved before the competition branch returns so the title measurement
    // hook below is called unconditionally.
    const viewModel = props.kind === 'competitions'
        ? undefined
        : toViewModel(props.kind, props.item, !!props.memberApplied)
    const [titleRef, titleClipped] = useIsTextClipped(viewModel?.title ?? '')

    if (props.kind === 'competitions' || !viewModel) {
        return (
            <CompetitionListCard
                item={props.item as ChallengeOpportunity}
                onSkillClick={props.onSkillClick}
                registered={props.registered}
                view={props.view}
            />
        )
    }

    const card = {
        ...viewModel,
        ...(props.applicationState ? { state: props.applicationState } : {}),
    }
    const visibleSkills = card.skills.filter(Boolean)
        .slice(0, props.view === 'grid' ? 3 : 5)
    const remaining = Math.max(0, card.skills.filter(Boolean).length - visibleSkills.length)
    const stateKey = challengeCatalogKey(card.state)
    const stateIsAccepted = ['accepted', 'approved', 'assigned', 'completed', 'selected'].includes(stateKey)
    const stateIsApplied = ['applied', 'onhold', 'shortlisted', 'underreview', 'waitlisted'].includes(stateKey)
    const stateIsClosed = [
        'applicationclosed',
        'cancelled',
        'offerdeclined',
        'rejected',
        'terminated',
    ].includes(stateKey)
    const cardClassName = classNames(styles.card, {
        [styles.copilotCard]: props.kind === 'copilots',
        [styles.engagementCard]: props.kind === 'engagements',
        [styles.gridCard]: props.view === 'grid',
        [styles.reviewCard]: props.kind === 'reviews',
    })

    return (
        <article
            className={cardClassName}
        >
            <div className={styles.main}>
                <div className={styles.eyebrow}>
                    <span className={classNames(
                        styles.badge,
                        challengeTrackClass(challengeCatalogKey(card.badge)),
                    )}
                    >
                        {card.badge}
                    </span>
                    {card.type && (
                        <span className={classNames(styles.challengeType, styles.opportunityType)}>
                            <ChallengeTypeIcon aria-hidden='true' />
                            {card.type}
                        </span>
                    )}
                    {card.state && (
                        <span className={classNames(styles.state, {
                            [styles.stateApplied]: stateIsApplied,
                            [styles.stateAccepted]: stateIsAccepted,
                            [styles.stateClosed]: stateIsClosed,
                        })}
                        >
                            {stateKey === 'openforapplication' && <RegistrationOpenIcon aria-hidden='true' />}
                            {stateKey === 'applied' && <IconOutline.CheckIcon aria-hidden='true' />}
                            {stateKey === 'waitlisted' && <ApplicationWaitlistedIcon aria-hidden='true' />}
                            {stateIsAccepted && <IconOutline.CheckIcon aria-hidden='true' />}
                            {stateIsClosed && <IconOutline.XIcon aria-hidden='true' />}
                            {card.state}
                        </span>
                    )}
                </div>
                <Tooltip
                    className={styles.cardTooltip}
                    content={card.title}
                    disableTooltip={!titleClipped}
                    place='bottom'
                    strategy='fixed'
                >
                    <h3
                        className={classNames({
                            [styles.reviewTitle]: props.kind === 'reviews' && props.view !== 'grid',
                        })}
                        ref={titleRef}
                    >
                        <Link
                            className={styles.titleLink}
                            rel={props.kind === 'engagements' ? 'noreferrer' : undefined}
                            target={props.kind === 'engagements' ? '_blank' : undefined}
                            to={card.href}
                        >
                            {card.title}
                        </Link>
                    </h3>
                </Tooltip>
                {visibleSkills.length > 0 && (
                    <div className={styles.skills}>
                        {visibleSkills.map((skill: string) => (
                            <SkillFilterTag
                                key={skill}
                                onSelect={props.onSkillClick}
                                skill={skill}
                            />
                        ))}
                        {remaining > 0 && (
                            <Tooltip
                                className={styles.cardTooltip}
                                content={(
                                    <ul>
                                        {card.skills.slice(visibleSkills.length)
                                            .map(skill => <li key={skill}>{skill}</li>)}
                                    </ul>
                                )}
                                place='bottom'
                                strategy='fixed'
                            >
                                <span>{`+${remaining}`}</span>
                            </Tooltip>
                        )}
                    </div>
                )}
                {card.description && <p>{card.description}</p>}
            </div>
            <dl className={styles.meta}>
                {card.meta.map(row => (
                    <div key={row.label}>
                        {row.icon}
                        <dt>{`${row.label}:`}</dt>
                        <dd>{row.value}</dd>
                    </div>
                ))}
            </dl>
        </article>
    )
}
