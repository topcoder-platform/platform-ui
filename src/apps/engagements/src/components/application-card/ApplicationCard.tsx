import { FC, MouseEvent, useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import classNames from 'classnames'

import { Button, IconOutline, IconSolid } from '~/libs/ui'

import type { Application } from '../../lib/models'
import { APPLICATION_CARD_DESCRIPTION_MAX_LENGTH } from '../../config/constants'
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

interface ApplicationDetailsProps {
    application: Application
    coverLetterSnippet: string
}

const ApplicationDetails: FC<ApplicationDetailsProps> = (props: ApplicationDetailsProps) => {
    const application = props.application
    const coverLetterSnippet = props.coverLetterSnippet

    return (
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
    )
}

const ApplicationCard: FC<ApplicationCardProps> = (props: ApplicationCardProps) => {
    const navigate = useNavigate()
    const application = props.application
    const onClick = props.onClick

    const [isExpanded, setIsExpanded] = useState<boolean>(props.expanded ?? false)
    const canNavigate = Boolean(application.engagement?.nanoId)

    const engagementTitle = application.engagement?.title ?? 'Engagement details unavailable'
    const engagementStatus = application.engagement?.status
    const engagementLink = application.engagement?.nanoId
        ? `${rootRoute}/${application.engagement.nanoId}`
        : undefined

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

    const handleTitleClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
        event.stopPropagation()
    }, [])

    const handleCardClick = useCallback(() => {
        if (!application.engagement?.nanoId) {
            return
        }

        navigate(`${rootRoute}/${application.engagement.nanoId}`)
    }, [navigate, application.engagement?.nanoId])

    return (
        <div
            className={classNames(
                styles.card,
                isExpanded && styles.expanded,
                canNavigate && styles.clickable,
            )}
            onClick={handleCardClick}
        >
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    <IconSolid.BriefcaseIcon className={styles.titleIcon} />
                    <h3 className={styles.title}>
                        {engagementLink ? (
                            <Link
                                to={engagementLink}
                                className={styles.titleLink}
                                onClick={handleTitleClick}
                            >
                                {engagementTitle}
                            </Link>
                        ) : (
                            engagementTitle
                        )}
                    </h3>
                </div>
                <ApplicationStatusBadge status={application.status} size='sm' />
            </div>
            <div className={styles.metaRow}>
                <div className={styles.metaItem}>
                    <IconSolid.CalendarIcon className={styles.metaIcon} />
                    <span>{`Applied ${formatDate(application.createdAt)}`}</span>
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
                <ApplicationDetails
                    application={application}
                    coverLetterSnippet={coverLetterSnippet}
                />
            )}
        </div>
    )
}

export default ApplicationCard
