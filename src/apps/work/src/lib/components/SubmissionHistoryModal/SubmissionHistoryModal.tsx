import {
    FC,
    MouseEvent,
    useCallback,
    useMemo,
} from 'react'

import { LoadingSpinner } from '~/libs/ui'

import { REVIEW_APP_URL } from '../../constants'
import { useFetchSubmissionVersions } from '../../hooks'
import { Submission } from '../../models'
import { formatDateTime } from '../../utils'

import styles from './SubmissionHistoryModal.module.scss'

export interface SubmissionHistoryModalProps {
    challengeId: string
    memberHandle?: string
    memberId?: string
    onClose: () => void
    submissionId: string
    submissionType?: Submission['type']
}

function getCreatedAt(submission: Submission): string {
    return submission.createdAt
        || submission.created
        || submission.submissionTime
        || ''
}

function getStatusDisplay(status: Submission['status']): string {
    if (!status) {
        return 'N/A'
    }

    return status
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

export const SubmissionHistoryModal: FC<SubmissionHistoryModalProps> = (
    props: SubmissionHistoryModalProps,
) => {
    const historyResult = useFetchSubmissionVersions(
        props.challengeId,
        props.memberId,
        props.submissionId,
        props.submissionType,
    )

    const titleText = useMemo<string>(() => {
        if (props.memberHandle) {
            return `Submission History for ${props.memberHandle}`
        }

        return 'Submission History'
    }, [props.memberHandle])

    const handleContainerClick = useCallback((event: MouseEvent<HTMLDivElement>): void => {
        event.stopPropagation()
    }, [])

    let content: JSX.Element

    if (!props.memberId) {
        content = (
            <p className={styles.message}>Submission history is unavailable for this entry.</p>
        )
    } else if (historyResult.isLoading) {
        content = (
            <div className={styles.loadingWrap}>
                <LoadingSpinner inline />
            </div>
        )
    } else if (historyResult.isError) {
        content = (
            <p className={styles.message}>Unable to load submission history.</p>
        )
    } else if (historyResult.versions.length === 0) {
        content = (
            <p className={styles.message}>No prior versions found.</p>
        )
    } else {
        content = (
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Submission ID</th>
                        <th>Status</th>
                        <th>Submission Date</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {historyResult.versions.map(version => {
                        const reviewLink = `${REVIEW_APP_URL}/${props.challengeId}`
                            + `/submissions/${version.id}`

                        return (
                            <tr key={version.id}>
                                <td>
                                    <span title={version.id}>{version.id}</span>
                                </td>
                                <td>
                                    <span title={getStatusDisplay(version.status)}>
                                        {getStatusDisplay(version.status)}
                                    </span>
                                </td>
                                <td>
                                    <span title={formatDateTime(getCreatedAt(version))}>
                                        {formatDateTime(getCreatedAt(version))}
                                    </span>
                                </td>
                                <td>
                                    <a
                                        className={styles.reviewLink}
                                        href={reviewLink}
                                        rel='noreferrer'
                                        target='_blank'
                                    >
                                        View review
                                    </a>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        )
    }

    return (
        <div className={styles.overlay} onClick={props.onClose} role='presentation'>
            <div
                aria-modal='true'
                className={styles.container}
                onClick={handleContainerClick}
                role='dialog'
            >
                <header className={styles.header}>
                    <h4 className={styles.title}>{titleText}</h4>
                </header>

                <div className={styles.body}>
                    {content}
                </div>
            </div>
        </div>
    )
}

export default SubmissionHistoryModal
