import {
    FC,
    MouseEvent,
    useCallback,
} from 'react'

import { LoadingSpinner } from '~/libs/ui'

import {
    useDownloadArtifact,
    useFetchSubmissionArtifacts,
} from '../../hooks'
import { ReactComponent as IconSquareDownload } from '../../assets/icons/IconSquareDownload.svg'

import styles from './ArtifactsModal.module.scss'

export interface ArtifactsModalProps {
    onClose: () => void
    submissionId: string
}

function getLoadingKey(submissionId: string, artifactId: string): string {
    return `${submissionId}:${artifactId}`
}

export const ArtifactsModal: FC<ArtifactsModalProps> = (
    props: ArtifactsModalProps,
) => {
    const artifactsResult = useFetchSubmissionArtifacts(props.submissionId)
    const downloadArtifactResult = useDownloadArtifact()
    const downloadArtifact = downloadArtifactResult.downloadArtifact
    const isLoading = downloadArtifactResult.isLoading

    const handleContainerClick = useCallback((event: MouseEvent<HTMLDivElement>): void => {
        event.stopPropagation()
    }, [])
    const handleArtifactDownload = useCallback((event: MouseEvent<HTMLButtonElement>): void => {
        const artifactId = event.currentTarget.dataset.artifactId
        if (!artifactId) {
            return
        }

        downloadArtifact(props.submissionId, artifactId)
            .catch(() => undefined)
    }, [downloadArtifact, props.submissionId])

    return (
        <div className={styles.overlay} onClick={props.onClose} role='presentation'>
            <div
                aria-modal='true'
                className={styles.container}
                onClick={handleContainerClick}
                role='dialog'
            >
                <header className={styles.header}>
                    <h4 className={styles.title}>Submission Artifacts</h4>
                </header>

                <div className={styles.body}>
                    {artifactsResult.isLoading
                        ? (
                            <div className={styles.loadingWrap}>
                                <LoadingSpinner inline />
                            </div>
                        )
                        : undefined}

                    {!artifactsResult.isLoading && artifactsResult.isError
                        ? (
                            <p className={styles.message}>Unable to load artifacts.</p>
                        )
                        : undefined}

                    {!artifactsResult.isLoading
                        && !artifactsResult.isError
                        && artifactsResult.artifacts.length === 0
                        ? <p className={styles.message}>No artifacts found</p>
                        : undefined}

                    {!artifactsResult.isLoading
                        && !artifactsResult.isError
                        && artifactsResult.artifacts.length > 0
                        ? (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Artifact ID</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {artifactsResult.artifacts.map(artifactId => {
                                        const loadingKey = getLoadingKey(props.submissionId, artifactId)
                                        const isDownloading = isLoading[loadingKey] === true

                                        return (
                                            <tr key={artifactId}>
                                                <td>{artifactId}</td>
                                                <td>
                                                    <button
                                                        data-artifact-id={artifactId}
                                                        aria-label='Download artifact'
                                                        className={styles.iconButton}
                                                        disabled={isDownloading}
                                                        onClick={handleArtifactDownload}
                                                        type='button'
                                                    >
                                                        <IconSquareDownload />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )
                        : undefined}
                </div>
            </div>
        </div>
    )
}

export default ArtifactsModal
