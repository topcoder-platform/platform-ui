import { FC, useMemo } from 'react'

import { BaseModal, Button } from '~/libs/ui'

import type { Application } from '../../lib/models'
import { formatDate } from '../../lib/utils'
import { ApplicationStatusBadge } from '../application-status-badge'
import { StatusBadge } from '../status-badge'

import styles from './ApplicationDetailModal.module.scss'

interface ApplicationDetailModalProps {
    application: Application | undefined
    open: boolean
    onClose: () => void
    onViewEngagement?: () => void
}

interface ApplicationDetailHeaderProps {
    application: Application
    formattedDate: string
}

interface ApplicationSectionProps {
    application: Application
    formattedDate: string
}

interface ApplicationDetailContentProps {
    application: Application
    formattedDate: string
}

interface ApplicantSectionProps {
    application: Application
}

interface CoverLetterSectionProps {
    application: Application
}

interface DocumentsSectionProps {
    application: Application
}

const ApplicationDetailEmptyState: FC = () => (
    <div className={styles.emptyState}>
        Application details are unavailable.
    </div>
)

const ApplicationDetailHeader: FC<ApplicationDetailHeaderProps> = (
    props: ApplicationDetailHeaderProps,
) => {
    const application = props.application
    const formattedDate = props.formattedDate
    const engagement = application.engagement

    return (
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
    )
}

const ApplicantSection: FC<ApplicantSectionProps> = (
    props: ApplicantSectionProps,
) => {
    const application = props.application

    return (
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
                {application.mobileNumber && (
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Mobile Number</span>
                        <span className={styles.metaValue}>{application.mobileNumber}</span>
                    </div>
                )}
            </div>
        </div>
    )
}

const ApplicationSection: FC<ApplicationSectionProps> = (
    props: ApplicationSectionProps,
) => {
    const application = props.application
    const formattedDate = props.formattedDate

    return (
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
    )
}

const CoverLetterSection: FC<CoverLetterSectionProps> = (
    props: CoverLetterSectionProps,
) => {
    const application = props.application

    return (
        <div className={styles.section}>
            <h4>Cover letter</h4>
            <div className={styles.coverLetter}>
                {application.coverLetter || 'No cover letter provided.'}
            </div>
        </div>
    )
}

const DocumentsSection: FC<DocumentsSectionProps> = (
    props: DocumentsSectionProps,
) => {
    const application = props.application
    const hasPortfolioUrls = (application.portfolioUrls?.length ?? 0) > 0

    return (
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
                    {hasPortfolioUrls ? (
                        <ul className={styles.linkList}>
                            {application.portfolioUrls?.map(url => (
                                <li key={url}>
                                    <a
                                        className={styles.link}
                                        href={url}
                                        target='_blank'
                                        rel='noreferrer noopener'
                                    >
                                        {url}
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
    )
}

const ApplicationDetailContent: FC<ApplicationDetailContentProps> = (
    props: ApplicationDetailContentProps,
) => {
    const application = props.application
    const formattedDate = props.formattedDate

    return (
        <div className={styles.content}>
            <ApplicationDetailHeader
                application={application}
                formattedDate={formattedDate}
            />
            <ApplicantSection application={application} />
            <ApplicationSection application={application} formattedDate={formattedDate} />
            <CoverLetterSection application={application} />
            <DocumentsSection application={application} />
        </div>
    )
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

    const canViewEngagement = Boolean(application?.engagement?.nanoId && onViewEngagement)

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
            {application ? (
                <ApplicationDetailContent
                    application={application}
                    formattedDate={formattedDate}
                />
            ) : (
                <ApplicationDetailEmptyState />
            )}
        </BaseModal>
    )
}

export default ApplicationDetailModal
