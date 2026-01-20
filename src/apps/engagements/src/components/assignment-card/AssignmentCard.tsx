import { FC, useCallback, useMemo } from 'react'

import { Button, IconSolid } from '~/libs/ui'

import type { Engagement } from '../../lib/models'
import { formatDuration, formatLocation, truncateText } from '../../lib/utils'
import { StatusBadge } from '../status-badge'

import styles from './AssignmentCard.module.scss'

interface AssignmentCardProps {
    engagement: Engagement
    contactEmail?: string
    onViewPayments: () => void
    onDocumentExperience: () => void
    onContactTaskManager: (contactEmail?: string) => void
    canContactTaskManager?: boolean
}

const DESCRIPTION_MAX_LENGTH = 160

const AssignmentCard: FC<AssignmentCardProps> = (props: AssignmentCardProps) => {
    const engagement = props.engagement
    const canContactTaskManager = props.canContactTaskManager ?? true
    const skills = engagement.requiredSkills ?? []
    const visibleSkills = skills.slice(0, 6)
    const extraSkillsCount = Math.max(0, skills.length - 6)
    const handleContactTaskManagerClick = useCallback(() => {
        props.onContactTaskManager(props.contactEmail)
    }, [props.contactEmail, props.onContactTaskManager])

    const descriptionSnippet = useMemo(() => (
        truncateText(engagement.description, DESCRIPTION_MAX_LENGTH)
    ), [engagement.description])

    const compensationText = engagement.compensationRange || 'Compensation not specified'

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <h3 className={styles.title}>{engagement.title || 'Untitled engagement'}</h3>
                <StatusBadge status={engagement.status} size='sm' />
            </div>
            <p className={styles.description}>
                {descriptionSnippet || 'Description not available.'}
            </p>
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
                    <IconSolid.CurrencyDollarIcon className={styles.metaIcon} />
                    <span>{compensationText}</span>
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
                <Button
                    label='View Payments'
                    onClick={props.onViewPayments}
                    primary
                    className={styles.actionButton}
                />
                <Button
                    label='Document Experience'
                    onClick={props.onDocumentExperience}
                    secondary
                    className={styles.actionButton}
                />
                <Button
                    label='Contact Task Manager'
                    onClick={handleContactTaskManagerClick}
                    secondary
                    className={styles.actionButton}
                    disabled={!canContactTaskManager}
                />
            </div>
        </div>
    )
}

export default AssignmentCard
