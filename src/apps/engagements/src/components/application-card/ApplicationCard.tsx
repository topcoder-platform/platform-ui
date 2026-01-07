import { FC, KeyboardEvent, MouseEvent, useCallback, useMemo, useState } from 'react'
import classNames from 'classnames'
import { useNavigate } from 'react-router-dom'

import { Button, IconOutline, IconSolid } from '~/libs/ui'

import { APPLICATION_CARD_DESCRIPTION_MAX_LENGTH } from '../../config/constants'
import { Application } from '../../lib/models'
import { formatDate, truncateText } from '../../lib/utils'
import { rootRoute } from '../../engagements.routes'
import { ApplicationStatusBadge } from '../application-status-badge'
import { StatusBadge } from '../status-badge'

import styles from './ApplicationCard.module.scss'

interface ApplicationCardProps {
    application: Application
    onClick?: () => void
    expanded?: boolean
}

const ApplicationCard: FC<ApplicationCardProps> = (props: ApplicationCardProps) => {
    const { application, onClick } = props
    const navigate = useNavigate()

    const [isExpanded, setIsExpanded] = useState<boolean>(props.expanded ?? false)

    const engagementTitle = application.engagement?.title ?? 'Engagement details unavailable'
    const engagementStatus = application.engagement?.status

    const coverLetterSnippet = useMemo(
        () => truncateText(application.coverLetter, APPLICATION_CARD_DESCRIPTION_MAX_LENGTH),
        [application.coverLetter],
    )

    const handleToggleExpand = useCallback((event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation()
        setIsExpanded(prev => !prev)
    }, [])

    const handleViewDetails = useCallback((event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation()
        onClick?.()
    }, [onClick])

    const handleCardClick = useCallback(() => {
        if (!application.engagement?.nanoId) {
            return
        }
        navigate(`${rootRoute}/${application.engagement.nanoId}`)
    }, [navigate, application.engagement?.nanoId])

    const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
            return
        }
        event.preventDefault()
        handleCardClick()
    }, [handleCardClick])

    return (
        <div
            className={classNames(
                styles.card,
                isExpanded && styles.expanded,
                application.engagement?.nanoId && styles.clickable,
            )}
            role={application.engagement?.nanoId ? 'button' : undefined}
            tabIndex={application.engagement?.nanoId ? 0 : -1}
            onClick={handleCardClick}
            onKeyDown={application.engagement?.nanoId ? handleKeyDown : undefined}
        >
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    <IconSolid.BriefcaseIcon className={styles.titleIcon} />
                    <h3 className={styles.title}>{engagementTitle}</h3>
                </div>
                <ApplicationStatusBadge status={application.status} size='sm' />
            </div>
            <div className={styles.metaRow}>
                <div className={styles.metaItem}>
                    <IconSolid.CalendarIcon className={styles.metaIcon} />
                    <span>Applied {formatDate(application.createdAt)}</span>
                </div>
                {engagementStatus && (
                    <StatusBadge status={engagementStatus} size='sm' />
                )}
            </div>
            <div className={styles.actions}>
                <button
                    type='button'
                    className={styles.toggleButton}
                    onClick={handleToggleExpand}
                >
                    <span>{isExpanded ? 'Hide details' : 'Show details'}</span>
                    <IconOutline.ChevronDownIcon
                        className={classNames(styles.toggleIcon, isExpanded && styles.toggleIconOpen)}
                    />
                </button>
                {onClick && (
                    <Button
                        label='View Application'
                        onClick={handleViewDetails}
                        link
                        className={styles.viewDetailsButton}
                    />
                )}
            </div>
            {isExpanded && (
                <div className={styles.details}>
                    <div className={styles.detailBlock}>
                        <div className={styles.detailLabel}>Cover letter</div>
                        <p className={styles.detailValue}>
                            {coverLetterSnippet || 'No cover letter provided.'}
                        </p>
                    </div>
                    <div className={styles.detailGrid}>
                        <div className={styles.detailBlock}>
                            <div className={styles.detailLabel}>Years of experience</div>
                            <div className={styles.detailValue}>
                                {application.yearsOfExperience ?? 'Not specified'}
                            </div>
                        </div>
                        <div className={styles.detailBlock}>
                            <div className={styles.detailLabel}>Availability</div>
                            <div className={styles.detailValue}>
                                {application.availability || 'Not specified'}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ApplicationCard
