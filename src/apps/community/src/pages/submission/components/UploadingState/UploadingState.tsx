import { FC } from 'react'
import { generatePath } from 'react-router-dom'

import {
    Button,
    LinkButton,
    LoadingSpinner,
    ProgressBar,
} from '~/libs/ui'

import {
    rootRoute,
    submissionManagementRouteId,
} from '../../../../config/routes.config'

import styles from './UploadingState.module.scss'

interface UploadingStateProps {
    challengeId: string
    challengeName: string
    challengesUrl: string
    error: string
    isSubmitting: boolean
    onBack: () => void
    onReset: () => void
    onRetry: () => void
    submitDone: boolean
    track?: string
    uploadProgress: number
}

function withLeadingSlash(path: string): string {
    return path.startsWith('/')
        ? path
        : `/${path}`
}

/**
 * Displays challenge submission upload progress, success and error states.
 *
 * @param props Upload lifecycle state and action handlers.
 * @returns Upload state content.
 */
const UploadingState: FC<UploadingStateProps> = (props: UploadingStateProps) => {
    const mySubmissionsPath = withLeadingSlash(
        `${rootRoute}/${generatePath(submissionManagementRouteId, {
            challengeId: props.challengeId,
        })}`,
    )
        .replace(/\/{2,}/g, '/')

    if (props.isSubmitting) {
        return (
            <section className={styles.panel} data-challenges-url={props.challengesUrl}>
                <h2 className={styles.title}>Uploading your submission...</h2>
                <p className={styles.challengeName}>{props.challengeName}</p>
                <div className={styles.loading}>
                    <LoadingSpinner inline />
                </div>
                <ProgressBar
                    progress={Math.max(0, Math.min(1, props.uploadProgress))}
                    track={props.track}
                />
                <p className={styles.progressText}>
                    {Math.round(Math.max(0, Math.min(1, props.uploadProgress)) * 100)}
                    %
                </p>
            </section>
        )
    }

    if (props.submitDone) {
        return (
            <section className={styles.panel} data-challenges-url={props.challengesUrl}>
                <h2 className={styles.title}>Submission Uploaded</h2>
                <p className={styles.challengeName}>{props.challengeName}</p>
                <div className={styles.actions}>
                    <Button label='Add Submission' onClick={props.onReset} primary />
                    <LinkButton label='My Submissions' secondary to={mySubmissionsPath} />
                </div>
            </section>
        )
    }

    return (
        <section className={styles.panel} data-challenges-url={props.challengesUrl}>
            <h2 className={styles.title}>Upload Failed</h2>
            <p className={styles.error}>{props.error || 'Unable to upload submission.'}</p>
            <div className={styles.actions}>
                <Button label='Cancel' onClick={props.onBack} secondary />
                <Button label='Try Again' onClick={props.onRetry} primary />
            </div>
        </section>
    )
}

export { UploadingState }
export default UploadingState
