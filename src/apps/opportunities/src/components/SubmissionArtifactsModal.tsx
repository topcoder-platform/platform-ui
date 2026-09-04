/* eslint-disable react/jsx-no-bind */
import { FC, useState } from 'react'
import { toast } from 'react-toastify'
import useSWR, { SWRResponse } from 'swr'

import { BaseModal, IconOutline, LoadingSpinner } from '~/libs/ui'

import {
    downloadChallengeSubmissionArtifact,
    getChallengeSubmissionArtifacts,
} from '../services'

import styles from './SubmissionArtifactsModal.module.scss'

interface SubmissionArtifactsModalProps {
    onClose: () => void
    open: boolean
    submissionId?: string
}

const MIME_EXTENSIONS: Record<string, string> = {
    'application/json': 'json',
    'application/pdf': 'pdf',
    'application/zip': 'zip',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'text/csv': 'csv',
    'text/plain': 'txt',
}

/**
 * Builds a safe local filename from a Review API artifact identifier.
 *
 * @param artifactId artifact identifier returned by Review API.
 * @param blob downloaded response used to infer a missing extension.
 * @param submissionId owning submission used as a fallback filename.
 * @returns browser-safe filename retaining an authored extension when present.
 * @throws Does not throw.
 */
function artifactFileName(artifactId: string, blob: Blob, submissionId: string): string {
    const lastPathSegment = artifactId.split('/')
        .filter(Boolean)
        .at(-1) ?? ''
    const safeId = lastPathSegment.replace(/[^a-zA-Z0-9._-]/g, '_')
    if (/\.[a-zA-Z0-9]+$/.test(safeId)) return safeId

    const extension = MIME_EXTENSIONS[blob.type] ?? 'zip'
    return `${safeId || `artifact-${submissionId}`}.${extension}`
}

/**
 * Saves a downloaded artifact blob using a short-lived object URL.
 *
 * @param blob downloaded artifact response.
 * @param filename local filename offered by the browser.
 * @returns void after dispatching the browser download.
 * @throws Does not throw.
 */
function saveArtifact(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(url)
}

/**
 * Lists and downloads scorer-generated files for one authored submission.
 *
 * @param props selected submission, visibility, and close callback.
 * @returns artifact dialog with loading, error, empty, and download states.
 * @throws Does not throw; request failures remain visible in the dialog.
 */
export const SubmissionArtifactsModal: FC<SubmissionArtifactsModalProps> = props => {
    const [downloadingArtifactId, setDownloadingArtifactId] = useState<string>()
    const response: SWRResponse<string[], Error> = useSWR(
        props.open && props.submissionId
            ? ['opportunities:submission-artifacts', props.submissionId]
            : undefined,
        () => getChallengeSubmissionArtifacts(props.submissionId as string),
        { revalidateOnFocus: false, shouldRetryOnError: false },
    )

    /**
     * Downloads the selected artifact without exposing an authenticated API URL.
     *
     * @param artifactId scorer artifact selected in the modal table.
     * @returns promise settled after saving the file or reporting an error.
     * @throws Does not throw; download failures are reported through a toast.
     */
    const downloadArtifact = async (artifactId: string): Promise<void> => {
        if (!props.submissionId) return
        setDownloadingArtifactId(artifactId)
        try {
            const blob = await downloadChallengeSubmissionArtifact(props.submissionId, artifactId)
            saveArtifact(blob, artifactFileName(artifactId, blob, props.submissionId))
        } catch (error) {
            toast.error(error instanceof Error
                ? error.message
                : 'Unable to download this submission artifact.')
        } finally {
            setDownloadingArtifactId(undefined)
        }
    }

    let content
    if (response.isValidating && !response.data) {
        content = <div className={styles.loading}><LoadingSpinner /></div>
    } else if (response.error) {
        content = (
            <div className={styles.message} role='alert'>
                <p>Unable to load submission artifacts.</p>
                <button onClick={() => response.mutate()} type='button'>Try again</button>
            </div>
        )
    } else if (!response.data?.length) {
        content = <p className={styles.message}>No submission artifacts are available.</p>
    } else {
        content = (
            <div className={styles.tableWrap}>
                <table aria-label='Submission artifacts'>
                    <thead>
                        <tr>
                            <th>Artifact ID</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {response.data.map(artifactId => (
                            <tr key={artifactId}>
                                <td><span title={artifactId}>{artifactId}</span></td>
                                <td>
                                    <button
                                        aria-label={`Download artifact ${artifactId}`}
                                        disabled={downloadingArtifactId === artifactId}
                                        onClick={() => downloadArtifact(artifactId)}
                                        title='Download artifact'
                                        type='button'
                                    >
                                        <IconOutline.DownloadIcon aria-hidden='true' />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }

    return (
        <BaseModal
            ariaLabelledby='submission-artifacts-title'
            bodyClassName={styles.modalBody}
            center
            classNames={{ modal: styles.modal }}
            onClose={props.onClose}
            open={props.open}
            showCloseIcon={false}
            spacer={false}
            title={(
                <div className={styles.modalHeading}>
                    <h2 id='submission-artifacts-title'>Submission Artifacts</h2>
                    <button
                        aria-label='Close submission artifacts'
                        onClick={props.onClose}
                        type='button'
                    >
                        <IconOutline.XIcon aria-hidden='true' />
                    </button>
                </div>
            )}
        >
            {content}
        </BaseModal>
    )
}
