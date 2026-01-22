import type { FC, ReactNode } from 'react'
import ReactMarkdown, { type Components, type Options as ReactMarkdownOptions } from 'react-markdown'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'

import { IconSolid } from '~/libs/ui'

import type { Engagement } from '../../lib/models'
import { formatDate, formatDuration, formatLocation } from '../../lib/utils'
import { StatusBadge } from '../status-badge'

import styles from './EngagementCard.module.scss'

const Markdown = ReactMarkdown as unknown as FC<ReactMarkdownOptions>

type MarkdownChildrenProps = {
    children?: ReactNode
}

const renderInlineMarkdown = ({ children }: MarkdownChildrenProps): JSX.Element => (
    <span>
        {children}
        {' '}
    </span>
)

const renderListItemMarkdown = ({ children }: MarkdownChildrenProps): JSX.Element => (
    <span>
        {'- '}
        {children}
        {' '}
    </span>
)

const compactMarkdownComponents: Components = {
    blockquote: renderInlineMarkdown,
    br: () => <span> </span>,
    h1: renderInlineMarkdown,
    h2: renderInlineMarkdown,
    h3: renderInlineMarkdown,
    h4: renderInlineMarkdown,
    h5: renderInlineMarkdown,
    h6: renderInlineMarkdown,
    li: renderListItemMarkdown,
    ol: renderInlineMarkdown,
    p: renderInlineMarkdown,
    ul: renderInlineMarkdown,
}

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

interface EngagementCardProps {
    engagement: Engagement
    onClick?: () => void
}

const EngagementCard: FC<EngagementCardProps> = (props: EngagementCardProps) => {
    const engagement = props.engagement
    const onClick = props.onClick
    const skills = engagement.requiredSkills ?? []
    const visibleSkills = skills.slice(0, 6)
    const extraSkillsCount = Math.max(0, skills.length - 6)
    const deadlineText = engagement.applicationDeadline
        ? formatDate(engagement.applicationDeadline)
        : 'Deadline TBD'
    const roleLabel = formatEnumLabel(engagement.role) ?? 'Not specified'
    const workloadLabel = formatEnumLabel(engagement.workload) ?? 'Not specified'
    const compensationLabel = typeof engagement.compensationRange === 'string'
        && engagement.compensationRange.trim().length > 0
        ? engagement.compensationRange
        : 'Not specified'

    return (
        <button
            type='button'
            className={styles.card}
            onClick={onClick}
        >
            <div className={styles.header}>
                <h3 className={styles.title}>{engagement.title}</h3>
                <StatusBadge status={engagement.status} size='sm' />
            </div>
            <div className={styles.description}>
                <Markdown
                    remarkPlugins={[
                        remarkFrontmatter,
                        [remarkGfm, { singleTilde: false }],
                    ]}
                    components={compactMarkdownComponents}
                >
                    {engagement.description}
                </Markdown>
            </div>
            <div className={styles.meta}>
                <div className={styles.metaItem}>
                    <IconSolid.ClockIcon className={styles.metaIcon} />
                    <span>{formatDuration(engagement.duration)}</span>
                </div>
                <div className={styles.metaItem}>
                    <IconSolid.LocationMarkerIcon className={styles.metaIcon} />
                    <span>
                        {formatLocation(engagement.countries ?? [], engagement.timeZones ?? [])}
                    </span>
                </div>
                <div className={styles.metaItem}>
                    <IconSolid.BriefcaseIcon className={styles.metaIcon} />
                    <span>{`Role: ${roleLabel}`}</span>
                </div>
                <div className={styles.metaItem}>
                    <IconSolid.ClockIcon className={styles.metaIcon} />
                    <span>{`Workload: ${workloadLabel}`}</span>
                </div>
                <div className={styles.metaItem}>
                    <IconSolid.CurrencyDollarIcon className={styles.metaIcon} />
                    <span>{`Compensation: ${compensationLabel}`}</span>
                </div>
            </div>
            <div className={styles.skills}>
                {skills.length > 0 ? visibleSkills.map(skill => (
                    <span key={`${engagement.nanoId}-${skill}`} className={styles.skillPill}>
                        {skill}
                    </span>
                )) : (
                    <span className={styles.emptySkills}>No skills listed</span>
                )}
                {extraSkillsCount > 0 && (
                    <span className={styles.moreSkills}>{`+${extraSkillsCount} more`}</span>
                )}
            </div>
            <div className={styles.deadline}>
                <IconSolid.CalendarIcon className={styles.metaIcon} />
                <span>{`Apply by ${deadlineText}`}</span>
            </div>
        </button>
    )
}

export default EngagementCard
