import { FC, MouseEvent, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import classNames from 'classnames'

import { Button, IconSolid } from '~/libs/ui'

import type { Application } from '../../lib/models'
import { formatDate } from '../../lib/utils'
import { rootRoute } from '../../engagements.routes'
import { ApplicationStatusBadge } from '../application-status-badge'
import { StatusBadge } from '../status-badge'

import styles from './ApplicationCard.module.scss'

interface ApplicationCardProps {
    application: Application
    onClick?: () => void
}

const ApplicationCard: FC<ApplicationCardProps> = (props: ApplicationCardProps) => {
    const navigate = useNavigate()
    const application = props.application
    const onClick = props.onClick

    const canNavigate = Boolean(application.engagement?.nanoId)

    const engagementTitle = application.engagement?.title ?? 'Engagement details unavailable'
    const engagementStatus = application.engagement?.status
    const engagementLink = application.engagement?.nanoId
        ? `${rootRoute}/${application.engagement.nanoId}`
        : undefined

    const handleOpenDetails = useCallback((event: MouseEvent<HTMLButtonElement>) => {
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
                {onClick && (
                    <Button
                        label='View Application'
                        onClick={handleOpenDetails}
                        link
                        className={styles.viewDetailsButton}
                    />
                )}
            </div>
        </div>
    )
}

export default ApplicationCard
