import { FC, useMemo } from 'react'
import classNames from 'classnames'

import { downloadProfileAsync } from '~/libs/core'
import {
    BaseModal,
    Button,
    IconSolid,
} from '~/libs/ui'

import {
    PROFILE_URL,
} from '../../constants'
import {
    Application,
} from '../../models'

import styles from './ApplicationDetailModal.module.scss'

interface ApplicationDetailModalProps {
    application: Application | undefined
    onClose: () => void
    open: boolean
}

function formatDate(value?: string): string {
    if (!value) {
        return '-'
    }

    const parsedDate = new Date(value)
    if (Number.isNaN(parsedDate.getTime())) {
        return value
    }

    return parsedDate.toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

function normalizeStatus(value?: string): string {
    const status = String(value || '')
        .trim()
        .replace(/[\s-]+/g, '_')

    return status.toUpperCase()
}

function formatStatusLabel(value?: string): string {
    const normalizedStatus = normalizeStatus(value)
    if (!normalizedStatus) {
        return '-'
    }

    return normalizedStatus
        .toLowerCase()
        .split('_')
        .map(part => {
            const firstCharacter = part
                .charAt(0)
                .toUpperCase()

            return `${firstCharacter}${part.slice(1)}`
        })
        .join(' ')
}

function getStatusPillClass(value?: string): string {
    const normalizedStatus = normalizeStatus(value)

    if (normalizedStatus === 'SELECTED') {
        return styles.statusGreen
    }

    if (normalizedStatus === 'UNDER_REVIEW') {
        return styles.statusYellow
    }

    if (normalizedStatus === 'REJECTED') {
        return styles.statusRed
    }

    return styles.statusGray
}

const ApplicationDetailModal: FC<ApplicationDetailModalProps> = (
    props: ApplicationDetailModalProps,
) => {
    const application = props.application

    const profileLink = useMemo(() => {
        if (!application?.handle) {
            return undefined
        }

        return `${PROFILE_URL}/${application.handle}`
    }, [application?.handle])
    function handleDownloadProfile(): void {
        if (!application?.handle) {
            return
        }

        downloadProfileAsync(application.handle)
            .catch(() => undefined)
    }

    const portfolioUrls = application?.portfolioUrls || []

    return (
        <BaseModal
            open={props.open}
            onClose={props.onClose}
            title='Application Details'
            size='lg'
            buttons={(
                <Button
                    label='Close'
                    onClick={props.onClose}
                    secondary
                />
            )}
        >
            {application
                ? (
                    <div className={styles.content}>
                        <div className={styles.grid}>
                            <div>
                                <span className={styles.label}>Handle</span>
                                {profileLink
                                    ? (
                                        <div className={styles.handleRow}>
                                            <a
                                                className={styles.link}
                                                href={profileLink}
                                                rel='noreferrer noopener'
                                                target='_blank'
                                            >
                                                {application.handle}
                                            </a>
                                            <button
                                                className={styles.downloadButton}
                                                type='button'
                                                aria-label='Download profile PDF'
                                                onClick={handleDownloadProfile}
                                                title='Download profile PDF'
                                            >
                                                <IconSolid.DownloadIcon className={styles.downloadIcon} />
                                            </button>
                                        </div>
                                    )
                                    : <span className={styles.value}>{application.handle || '-'}</span>}
                            </div>
                            <div>
                                <span className={styles.label}>Name</span>
                                <span className={styles.value}>{application.name || '-'}</span>
                            </div>
                            <div>
                                <span className={styles.label}>Email</span>
                                <span className={styles.value}>{application.email || '-'}</span>
                            </div>
                            <div>
                                <span className={styles.label}>Submitted</span>
                                <span className={styles.value}>{formatDate(application.createdAt)}</span>
                            </div>
                            <div>
                                <span className={styles.label}>Experience (years)</span>
                                <span className={styles.value}>{application.yearsOfExperience ?? '-'}</span>
                            </div>
                            <div>
                                <span className={styles.label}>Availability</span>
                                <span className={styles.value}>{application.availability || '-'}</span>
                            </div>
                            <div>
                                <span className={styles.label}>Status</span>
                                <span
                                    className={classNames(
                                        styles.statusPill,
                                        getStatusPillClass(application.status),
                                    )}
                                >
                                    {formatStatusLabel(application.status)}
                                </span>
                            </div>
                        </div>

                        <section className={styles.section}>
                            <h4 className={styles.sectionTitle}>Links</h4>
                            <div className={styles.links}>
                                <div className={styles.linkRow}>
                                    <span className={styles.linkLabel}>Resume</span>
                                    {application.resumeUrl
                                        ? (
                                            <a
                                                className={styles.link}
                                                href={application.resumeUrl}
                                                rel='noreferrer noopener'
                                                target='_blank'
                                            >
                                                {application.resumeUrl}
                                            </a>
                                        )
                                        : <span className={styles.value}>-</span>}
                                </div>

                                <div className={styles.linkRow}>
                                    <span className={styles.linkLabel}>Portfolio</span>
                                    {portfolioUrls.length
                                        ? (
                                            <div className={styles.linkList}>
                                                {portfolioUrls.map(url => (
                                                    <a
                                                        className={styles.link}
                                                        href={url}
                                                        key={url}
                                                        rel='noreferrer noopener'
                                                        target='_blank'
                                                    >
                                                        {url}
                                                    </a>
                                                ))}
                                            </div>
                                        )
                                        : <span className={styles.value}>-</span>}
                                </div>
                            </div>
                        </section>

                        <section className={styles.section}>
                            <h4 className={styles.sectionTitle}>Cover Letter</h4>
                            <p className={styles.text}>
                                {application.coverLetter || 'No application text available.'}
                            </p>
                        </section>
                    </div>
                )
                : <div className={styles.empty}>Application details are unavailable.</div>}
        </BaseModal>
    )
}

export default ApplicationDetailModal
