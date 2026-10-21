import { FC, MouseEvent, useEffect, useMemo, useState } from 'react'
import classNames from 'classnames'

import {
    downloadProfileAsync,
    profileGetPublicAsync,
    useCountryName,
    UserProfile,
} from '~/libs/core'
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

import { openCvPreview } from './cv-preview'
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

    if (normalizedStatus === 'SHORTLISTED') {
        return styles.statusBlue
    }

    if (normalizedStatus === 'REJECTED') {
        return styles.statusRed
    }

    return styles.statusGray
}

/**
 * Loads the member profile of the applicant and returns the "City, Country" shown on their profile page.
 *
 * @param handle the applicant handle.
 * @returns the member location, or `undefined` while loading or when the profile has none.
 */
function useMemberLocation(handle?: string): string | undefined {
    const [profile, setProfile] = useState<UserProfile | undefined>(undefined)

    useEffect(() => {
        let cancelled = false
        setProfile(undefined)

        if (!handle) {
            return undefined
        }

        profileGetPublicAsync(handle)
            .then(result => {
                if (!cancelled) {
                    setProfile(result)
                }
            })
            .catch(() => undefined)

        return () => {
            cancelled = true
        }
    }, [handle])

    const country = useCountryName(profile?.homeCountryCode || profile?.competitionCountryCode)
    const city = profile?.addresses?.[0]?.city?.trim()

    return [city, country]
        .filter(Boolean)
        .join(', ') || undefined
}

const ApplicationDetailModal: FC<ApplicationDetailModalProps> = (
    props: ApplicationDetailModalProps,
) => {
    const application = props.application
    const memberLocation = useMemberLocation(props.open ? application?.handle : undefined)

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

    function handlePreviewCv(event: MouseEvent<HTMLAnchorElement>): void {
        event.preventDefault()
        if (application?.cvFileUrl) {
            openCvPreview(application.cvFileUrl)
        }
    }

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
                                <span className={styles.label}>Mobile Number</span>
                                <span className={styles.value}>{application.mobileNumber || '-'}</span>
                            </div>
                            <div className={styles.fullRow}>
                                <span className={styles.label}>Location</span>
                                <span className={styles.value}>{memberLocation || '-'}</span>
                            </div>
                            <div>
                                <span className={styles.label}>Submitted</span>
                                <span className={styles.value}>{formatDate(application.createdAt)}</span>
                            </div>
                            <div>
                                <span className={styles.label}>Expected Pay Rate (USD/Hour)</span>
                                <span className={styles.value}>{application.expectedPayRate || '-'}</span>
                            </div>
                            <div>
                                <span className={styles.label}>Availability</span>
                                <span className={classNames(styles.value, styles.multiline)}>
                                    {application.availability || '-'}
                                </span>
                            </div>
                            <div>
                                <span className={styles.label}>Address</span>
                                <span className={styles.value}>{application.address || '-'}</span>
                            </div>
                            <div>
                                <span className={styles.label}>How did you come to know of the opportunity?</span>
                                <span className={styles.value}>{application.referralSource || '-'}</span>
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
                                    <span className={styles.linkLabel}>CV</span>
                                    {application.cvFileUrl
                                        ? (
                                            <div className={styles.cvActions}>
                                                <a
                                                    className={styles.link}
                                                    href={application.cvFileUrl}
                                                    onClick={handlePreviewCv}
                                                    rel='noreferrer noopener'
                                                    target='_blank'
                                                >
                                                    Preview CV
                                                </a>
                                                <a
                                                    className={styles.link}
                                                    href={application.cvFileUrl}
                                                    rel='noreferrer noopener'
                                                    target='_blank'
                                                >
                                                    Download
                                                </a>
                                            </div>
                                        )
                                        : <span className={styles.value}>-</span>}
                                </div>
                            </div>
                        </section>

                        {application.coverLetter && (
                            <section className={styles.section}>
                                <h4 className={styles.sectionTitle}>Cover Letter</h4>
                                <p className={styles.text}>
                                    {application.coverLetter}
                                </p>
                            </section>
                        )}
                    </div>
                )
                : <div className={styles.empty}>Application details are unavailable.</div>}
        </BaseModal>
    )
}

export default ApplicationDetailModal
