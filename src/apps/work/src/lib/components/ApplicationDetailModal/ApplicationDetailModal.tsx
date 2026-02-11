import { FC, useMemo } from 'react'

import {
    BaseModal,
    Button,
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
                                        <a
                                            className={styles.link}
                                            href={profileLink}
                                            rel='noreferrer noopener'
                                            target='_blank'
                                        >
                                            {application.handle}
                                        </a>
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
                                <span className={styles.value}>{application.yearsOfExperience || '-'}</span>
                            </div>
                            <div>
                                <span className={styles.label}>Availability</span>
                                <span className={styles.value}>{application.availability || '-'}</span>
                            </div>
                            <div>
                                <span className={styles.label}>Status</span>
                                <span className={styles.value}>{application.status || '-'}</span>
                            </div>
                        </div>

                        <section className={styles.section}>
                            <h4 className={styles.sectionTitle}>Application Text</h4>
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
