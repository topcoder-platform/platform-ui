import type { FC, ReactNode } from 'react'
import { useCallback, useMemo } from 'react'
import ReactMarkdown, { type Components, type Options as ReactMarkdownOptions } from 'react-markdown'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'

import { Button, IconSolid } from '~/libs/ui'

import type { Engagement, EngagementAssignment } from '../../lib/models'
import { formatDate, formatLocation, truncateText } from '../../lib/utils'
import { StatusBadge } from '../status-badge'

import styles from './AssignmentCard.module.scss'

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

interface AssignmentCardProps {
    engagement: Engagement
    assignment?: EngagementAssignment
    contactEmail?: string
    onViewPayments: () => void
    onDocumentExperience: () => void
    onAcceptOffer?: () => void
    onRejectOffer?: () => void
    onContactTalentManager: (contactEmail?: string) => void
    canContactTalentManager?: boolean
}

const DESCRIPTION_MAX_LENGTH = 160
const FALLBACK_STATUS_LABEL = 'TBD'
const FALLBACK_VALUE_LABEL = 'TBD'

const formatStatusLabel = (value?: string): string => {
    const normalized = value === undefined || value === null
        ? undefined
        : value.toString()
            .trim()
    if (!normalized) {
        return FALLBACK_STATUS_LABEL
    }

    return normalized
        .replace(/[_-]+/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, character => character.toUpperCase())
}

const normalizeStatusKey = (value?: string): string => {
    const normalized = value === undefined || value === null
        ? undefined
        : value.toString()
            .trim()
    if (!normalized) {
        return 'unknown'
    }

    return normalized
        .toLowerCase()
        .replace(/[\s-]+/g, '_')
}

const formatAssignmentDate = (value?: string): string => {
    if (!value) {
        return FALLBACK_VALUE_LABEL
    }

    const formatted = formatDate(value)
    return formatted === 'Date TBD' ? FALLBACK_VALUE_LABEL : formatted
}

const formatAgreementRate = (value?: string | number): string => {
    if (value === null || value === undefined) {
        return FALLBACK_VALUE_LABEL
    }

    const normalized = typeof value === 'string' ? value.trim() : value.toString()
    return normalized || FALLBACK_VALUE_LABEL
}

const AssignmentCard: FC<AssignmentCardProps> = (props: AssignmentCardProps) => {
    const engagement = props.engagement
    const assignment = props.assignment
    const canContactTalentManager = props.canContactTalentManager ?? true
    const skills = engagement.requiredSkills ?? []
    const visibleSkills = skills.slice(0, 6)
    const extraSkillsCount = Math.max(0, skills.length - 6)
    const { locationLabel, timeZoneLabel }: ReturnType<typeof formatLocation> = formatLocation(
        engagement.countries ?? [],
        engagement.timeZones ?? [],
    )
    const handleContactTalentManagerClick = useCallback(() => {
        props.onContactTalentManager(props.contactEmail)
    }, [props.contactEmail, props.onContactTalentManager])

    const descriptionSnippet = useMemo(() => (
        truncateText(engagement.description, DESCRIPTION_MAX_LENGTH)
    ), [engagement.description])

    const assignmentStatusLabel = useMemo(
        () => formatStatusLabel(assignment?.status),
        [assignment?.status],
    )
    const assignmentStatusKey = useMemo(
        () => normalizeStatusKey(assignment?.status),
        [assignment?.status],
    )
    const paymentLabel = useMemo(
        () => formatAgreementRate(assignment?.agreementRate),
        [assignment?.agreementRate],
    )
    const startDateLabel = useMemo(
        () => formatAssignmentDate(assignment?.startDate),
        [assignment?.startDate],
    )
    const endDateLabel = useMemo(
        () => formatAssignmentDate(assignment?.endDate),
        [assignment?.endDate],
    )
    const assignmentStatus = assignment?.status?.toLowerCase()
    const showAssignedActions = assignmentStatus === 'assigned'
    const showOfferActions = assignmentStatus === 'selected'

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <h3 className={styles.title}>{engagement.title || 'Untitled engagement'}</h3>
                <StatusBadge status={assignmentStatusKey} label={assignmentStatusLabel} size='sm' />
            </div>
            <div className={styles.description}>
                <Markdown
                    remarkPlugins={[
                        remarkFrontmatter,
                        [remarkGfm, { singleTilde: false }],
                    ]}
                    components={compactMarkdownComponents}
                >
                    {descriptionSnippet || 'Description not available.'}
                </Markdown>
            </div>
            <div className={styles.meta}>
                <div className={styles.metaItem}>
                    <IconSolid.CalendarIcon className={styles.metaIcon} />
                    <span>{`Start: ${startDateLabel}`}</span>
                </div>
                <div className={styles.metaItem}>
                    <IconSolid.CalendarIcon className={styles.metaIcon} />
                    <span>{`End: ${endDateLabel}`}</span>
                </div>
                <div className={styles.metaItem}>
                    <IconSolid.GlobeAltIcon className={styles.metaIcon} />
                    <span>{`Timezone: ${timeZoneLabel}`}</span>
                </div>
                <div className={styles.metaItem}>
                    <IconSolid.LocationMarkerIcon className={styles.metaIcon} />
                    <span>{`Location: ${locationLabel}`}</span>
                </div>
                <div className={styles.metaItem}>
                    <IconSolid.CurrencyDollarIcon className={styles.metaIcon} />
                    <span>{`Payment: ${paymentLabel}`}</span>
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
            <div className={styles.actions}>
                {showAssignedActions && (
                    <>
                        <Button
                            label='View Payments'
                            onClick={props.onViewPayments}
                            primary
                            textWrap
                            className={styles.actionButton}
                        />
                        <Button
                            label='Document Experience'
                            onClick={props.onDocumentExperience}
                            secondary
                            textWrap
                            className={styles.actionButton}
                        />
                    </>
                )}
                {showOfferActions && props.onAcceptOffer && props.onRejectOffer && (
                    <>
                        <Button
                            label='Accept Offer'
                            onClick={props.onAcceptOffer}
                            primary
                            textWrap
                            className={styles.actionButton}
                        />
                        <Button
                            label='Reject Offer'
                            onClick={props.onRejectOffer}
                            secondary
                            variant='danger'
                            textWrap
                            className={styles.actionButton}
                        />
                    </>
                )}
                <Button
                    label='Contact Talent Manager'
                    onClick={handleContactTalentManagerClick}
                    secondary
                    textWrap
                    className={styles.actionButton}
                    disabled={!canContactTalentManager}
                />
            </div>
        </div>
    )
}

export default AssignmentCard
