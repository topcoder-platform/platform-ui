/* eslint-disable ordered-imports/ordered-imports */
import { FC, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { IconOutline } from '~/libs/ui'

import {
    ChallengeOpportunity,
    CopilotOpportunity,
    EngagementOpportunity,
    OpportunityItem,
    OpportunityKind,
    OpportunitySkill,
    ReviewOpportunity,
} from '../models'

import styles from './OpportunityListCard.module.scss'

interface OpportunityListCardProps {
    item: OpportunityItem
    kind: OpportunityKind
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

/**
 * Returns a useful string from an API value that can be a name object.
 *
 * @param value string or catalog object.
 * @param fallback text used when no name exists.
 * @returns display name.
 * @throws Does not throw.
 */
function catalogName(value: string | { name?: string } | undefined, fallback: string): string {
    if (typeof value === 'string') return value
    return value?.name || fallback
}

/**
 * Formats a date for compact card metadata.
 *
 * @param value ISO date from an owning API.
 * @returns localized date, or `TBD` when absent/invalid.
 * @throws Does not throw.
 */
function formatDate(value?: string): string {
    if (!value) return 'TBD'
    const date = new Date(value)
    return Number.isNaN(date.getTime())
        ? 'TBD'
        : new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
            .format(date)
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
 * Formats a dollar amount without unnecessary decimal places.
 *
 * @param value dollar value.
 * @returns US currency text.
 * @throws Does not throw.
 */
function formatMoney(value?: number): string {
    return new Intl.NumberFormat('en-US', {
        currency: 'USD',
        maximumFractionDigits: 0,
        style: 'currency',
    })
        .format(value ?? 0)
}

/**
 * Produces a plain excerpt from Markdown or HTML description content.
 *
 * @param value rich text from the API.
 * @returns short plain-text excerpt.
 * @throws Does not throw.
 */
function descriptionExcerpt(value?: string): string | undefined {
    if (!value) return undefined
    const plain = value
        .replace(/<[^>]*>/g, ' ')
        .replace(/[#*_>`~()]/g, '')
        .replace(/\[/g, '')
        .replace(/]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    return plain.length > 180 ? `${plain.slice(0, 177)}…` : plain
}

/** Converts challenge data to the shared card presentation model. */
function challengeView(item: ChallengeOpportunity): CardViewModel {
    const prize = item.overviewTotalPrizes
        ?? item.prizeSets?.flatMap(set => set.prizes ?? [])
            .reduce((sum, current) => sum + (current.value ?? 0), 0)
        ?? 0
    const track = catalogName(item.track, 'Competition')
    return {
        badge: track,
        description: descriptionExcerpt(item.description ?? item.overview),
        href: `/opportunities/challenge/${item.id}`,
        meta: [
            { icon: <IconOutline.CurrencyDollarIcon />, label: 'Prize', value: formatMoney(prize) },
            {
                icon: <IconOutline.UserGroupIcon />,
                label: 'Registrants',
                value: String(item.numOfRegistrants ?? 0),
            },
            {
                icon: <IconOutline.DocumentTextIcon />,
                label: 'Submissions',
                value: String(item.numOfSubmissions ?? 0),
            },
        ],
        skills: [...(item.skills ?? []).map(skill => skill.name), ...(item.tags ?? [])],
        state: item.status === 'ACTIVE' ? 'Open for registration' : item.status,
        title: item.name,
        type: catalogName(item.type, 'Challenge'),
    }
}

/** Converts engagement data to the shared card presentation model. */
function engagementView(item: EngagementOpportunity): CardViewModel {
    const role = enumLabel(item.role) || 'Contributor'
    return {
        badge: role,
        description: descriptionExcerpt(item.description),
        href: `/engagements/${item.nanoId ?? item.id}`,
        meta: [
            { icon: <IconOutline.UserIcon />, label: 'Role', value: role },
            { icon: <IconOutline.CalendarIcon />, label: 'Duration', value: formatEngagementDuration(item) },
            {
                icon: <IconOutline.PlayIcon />,
                label: 'Start',
                value: formatAnticipatedStart(item.anticipatedStart),
            },
            {
                icon: <IconOutline.CurrencyDollarIcon />,
                label: 'Payment',
                value: item.compensationRange || 'Negotiable',
            },
        ],
        skills: item.requiredSkills ?? [],
        state: item.status === 'OPEN' ? 'Open for application' : item.status,
        title: item.title,
        type: enumLabel(item.workload),
    }
}

/** Converts copilot data to the shared card presentation model. */
function copilotView(item: CopilotOpportunity): CardViewModel {
    return {
        badge: item.projectType || item.type || 'Copilot',
        description: descriptionExcerpt(item.overview),
        href: `/copilots/opportunity/${item.id}`,
        meta: [
            {
                icon: <IconOutline.ClockIcon />,
                label: 'Hours / week',
                value: String(item.numHoursPerWeek ?? 'TBD'),
            },
            {
                icon: <IconOutline.CalendarIcon />,
                label: 'Duration',
                value: item.numWeeks ? `${item.numWeeks} weeks` : 'TBD',
            },
            { icon: <IconOutline.PlayIcon />, label: 'Start', value: formatDate(item.startDate) },
        ],
        skills: (item.skills ?? []).map((skill: OpportunitySkill) => skill.name),
        state: item.hasApplied ? 'Applied' : item.status === 'active' ? 'Open for application' : item.status,
        title: item.opportunityTitle || item.projectName || item.project?.name || 'Copilot Opportunity',
        type: item.complexity,
    }
}

/** Converts review data to the shared card presentation model. */
function reviewView(item: ReviewOpportunity): CardViewModel {
    const track = String(item.challengeData?.track ?? item.challengeData?.trackName ?? 'Review')
    const technologies = item.challengeData?.technologies
    return {
        badge: track,
        href: `/opportunities/review/${item.id}`,
        meta: [
            { icon: <IconOutline.UserIcon />, label: 'Role', value: item.payments?.[0]?.role || 'Reviewer' },
            { icon: <IconOutline.PlayIcon />, label: 'Start', value: formatDate(item.startDate) },
            {
                icon: <IconOutline.DocumentTextIcon />,
                label: 'Applications',
                value: String(item.applications?.length ?? 0),
            },
        ],
        skills: Array.isArray(technologies) ? technologies.map(String) : [],
        state: item.myApplications?.length ? 'Applied' : item.canApply ? 'Open for application' : item.status,
        title: item.challengeName || String(item.challengeData?.name ?? 'Review Opportunity'),
        type: String(item.challengeData?.type ?? item.type ?? ''),
    }
}

/**
 * Selects the owning API adapter for a list item.
 *
 * @param kind opportunity domain selected in the hero.
 * @param item raw owning API response.
 * @returns shared Figma card presentation data.
 * @throws Does not throw when called with matching kind/item data.
 */
function toViewModel(kind: OpportunityKind, item: OpportunityItem): CardViewModel {
    if (kind === 'competitions') return challengeView(item as ChallengeOpportunity)
    if (kind === 'engagements') return engagementView(item as EngagementOpportunity)
    if (kind === 'copilots') return copilotView(item as CopilotOpportunity)
    return reviewView(item as ReviewOpportunity)
}

/**
 * Renders a responsive list card shared by all four owning API payloads.
 *
 * @param props opportunity kind and raw item.
 * @returns linked opportunity card with tags and domain-specific metadata.
 * @throws Does not throw.
 */
export const OpportunityListCard: FC<OpportunityListCardProps> = props => {
    const card = toViewModel(props.kind, props.item)
    const visibleSkills = card.skills.filter(Boolean)
        .slice(0, 5)
    const remaining = Math.max(0, card.skills.filter(Boolean).length - visibleSkills.length)

    return (
        <Link className={styles.card} to={card.href}>
            <div className={styles.main}>
                <div className={styles.eyebrow}>
                    <span className={styles.badge}>{card.badge}</span>
                    {card.type && <span>{card.type}</span>}
                    {card.state && <span className={styles.state}>{card.state}</span>}
                </div>
                <h3>{card.title}</h3>
                {visibleSkills.length > 0 && (
                    <div className={styles.skills}>
                        {visibleSkills.map((skill: string) => <span key={skill}>{skill}</span>)}
                        {remaining > 0 && <span>{`+${remaining}`}</span>}
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
        </Link>
    )
}
