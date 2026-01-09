import { FC, useMemo } from 'react'

import { BaseModal, Button } from '~/libs/ui'

import type { Application } from '../../lib/models'
import { formatDate } from '../../lib/utils'
import { ApplicationStatusBadge } from '../application-status-badge'
import { StatusBadge } from '../status-badge'

import styles from './ApplicationDetailModal.module.scss'

interface ApplicationDetailModalProps {
    application: Application | null
    open: boolean
    onClose: () => void
    onViewEngagement?: () => void
}

const ApplicationDetailModal: FC<ApplicationDetailModalProps> = (
    props: ApplicationDetailModalProps,
) => {
    const application = props.application
    const open = props.open
    const onClose = props.onClose
    const onViewEngagement = props.onViewEngagement

    const formattedDate = useMemo(() => (
        application?.createdAt ? formatDate(application.createdAt) : 'Date TBD'
    ), [application?.createdAt])

    const engagement = application?.engagement
    const hasPortfolioLinks = (application?.portfolioLinks?.length ?? 0) > 0
    const canViewEngagement = Boolean(engagement?.nanoId && onViewEngagement)

    return (
        <BaseModal
            open={open}
            onClose={onClose}
            title='Application Details'
            size='lg'
            buttons={(
                <>
                    <Button
                        label='View Engagement'
                        onClick={onViewEngagement}
                        primary
                        disabled={!canViewEngagement}
                    />
                    <Button
                        label='Close'
                        onClick={onClose}
                        secondary
                    />
                </>
            )}
        >
            {!application && (
                <div className={styles.emptyState}>
                    Application details are unavailable.
                </div>
            )}
            {application && (
                <div className={styles.content}>
                    <div className={styles.header}>
                        <div>
                            <h3 className={styles.title}>{engagement?.title ?? 'Engagement'}</h3>
                            <div className={styles.subTitle}>{`Submitted ${formattedDate}`}</div>
                        </div>
                        <div className={styles.badges}>
                            <ApplicationStatusBadge status={application.status} size='sm' />
                            {engagement?.status && (
                                <StatusBadge status={engagement.status} size='sm' />
                            )}
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h4>Applicant</h4>
                        <div className={styles.metaGrid}>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Name</span>
                                <span className={styles.metaValue}>
                                    {application.name || application.userHandle}
                                </span>
                            </div>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Email</span>
                                <span className={styles.metaValue}>{application.email}</span>
                            </div>
                            {application.address && (
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>Address</span>
                                    <span className={styles.metaValue}>{application.address}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h4>Application</h4>
                        <div className={styles.metaGrid}>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Availability</span>
                                <span className={styles.metaValue}>
                                    {application.availability || 'Not specified'}
                                </span>
                            </div>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Years of experience</span>
                                <span className={styles.metaValue}>
                                    {application.yearsOfExperience ?? 'Not specified'}
                                </span>
                            </div>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Submitted</span>
                                <span className={styles.metaValue}>{formattedDate}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h4>Cover letter</h4>
                        <div className={styles.coverLetter}>
                            {application.coverLetter || 'No cover letter provided.'}
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h4>Documents</h4>
                        <div className={styles.metaGrid}>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Resume</span>
                                {application.resumeUrl ? (
                                    <a
                                        className={styles.link}
                                        href={application.resumeUrl}
                                        target='_blank'
                                        rel='noreferrer noopener'
                                    >
                                        {application.resumeUrl}
                                    </a>
                                ) : (
                                    <span className={styles.metaValue}>Not provided</span>
                                )}
                            </div>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Portfolio</span>
                                {hasPortfolioLinks ? (
                                    <ul className={styles.linkList}>
                                        {application.portfolioLinks?.map(link => (
                                            <li key={link}>
                                                <a
                                                    className={styles.link}
                                                    href={link}
                                                    target='_blank'
                                                    rel='noreferrer noopener'
                                                >
                                                    {link}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span className={styles.metaValue}>Not provided</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}

export default ApplicationDetailModal
