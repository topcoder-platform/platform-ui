import { FC } from 'react'

import { IconSolid } from '~/libs/ui'
import { SkillPill } from '~/libs/shared'

import { Engagement } from '../../lib/models'
import { formatDate, formatDuration, formatLocation } from '../../lib/utils'
import { StatusBadge } from '../status-badge'

import styles from './EngagementCard.module.scss'

interface EngagementCardProps {
    engagement: Engagement
    onClick?: () => void
}

const EngagementCard: FC<EngagementCardProps> = (props: EngagementCardProps) => {
    const { engagement, onClick } = props
    const skills = engagement.requiredSkills ?? []
    const deadlineText = engagement.applicationDeadline
        ? formatDate(engagement.applicationDeadline)
        : 'Deadline TBD'

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
            <p className={styles.description}>{engagement.description}</p>
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
            </div>
            <div className={styles.skills}>
                {skills.length > 0 ? skills.slice(0, 6).map(skill => (
                    <SkillPill
                        key={`${engagement.nanoId}-${skill}`}
                        skill={{ name: skill, levels: [] }}
                        theme='presentation'
                    />
                )) : (
                    <span className={styles.emptySkills}>No skills listed</span>
                )}
                {skills.length > 6 && (
                    <span className={styles.moreSkills}>+{skills.length - 6} more</span>
                )}
            </div>
            <div className={styles.deadline}>
                <IconSolid.CalendarIcon className={styles.metaIcon} />
                <span>Apply by {deadlineText}</span>
            </div>
        </button>
    )
}

export default EngagementCard
