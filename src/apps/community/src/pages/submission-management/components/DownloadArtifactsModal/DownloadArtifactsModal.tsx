import {
    FC,
    MouseEvent,
    useCallback,
    useEffect,
    useState,
} from 'react'

import { Button, IconOutline, LoadingSpinner } from '~/libs/ui'
import { BaseModal } from '~/libs/ui/lib/components/modals/base-modal'

import {
    downloadSubmissionArtifact,
    fetchSubmissionArtifacts,
} from '../../../../lib'

import styles from './DownloadArtifactsModal.module.scss'

interface DownloadArtifactsModalProps {
    onClose: () => void
    submissionId: string
}

/**
 * Modal listing submission artifacts with direct download actions.
 *
 * @param props Submission id and close handler.
 * @returns Artifacts download modal.
 */
const DownloadArtifactsModal: FC<DownloadArtifactsModalProps> = (props: DownloadArtifactsModalProps) => {
    const [artifacts, setArtifacts] = useState<string[]>([])
    const [error, setError] = useState<string>('')
    const [isLoading, setIsLoading] = useState<boolean>(true)

    useEffect(() => {
        let canceled = false

        const loadArtifacts = async (): Promise<void> => {
            setIsLoading(true)
            setError('')

            try {
                const artifactIds = await fetchSubmissionArtifacts(props.submissionId)
                if (!canceled) {
                    setArtifacts(artifactIds)
                }
            } catch (loadError) {
                if (!canceled) {
                    setError(
                        loadError instanceof Error
                            ? loadError.message
                            : 'Failed to load artifacts.',
                    )
                }
            } finally {
                if (!canceled) {
                    setIsLoading(false)
                }
            }
        }

        loadArtifacts()
        return () => {
            canceled = true
        }
    }, [props.submissionId])

    const handleDownload = useCallback(async (artifactId: string): Promise<void> => {
        const blob = await downloadSubmissionArtifact(props.submissionId, artifactId)
        const objectUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = objectUrl
        link.download = `submission-artifact-${props.submissionId}-${artifactId}.zip`
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(objectUrl)
    }, [props.submissionId])

    const handleArtifactDownloadClick = useCallback((event: MouseEvent<HTMLButtonElement>): void => {
        const artifactId = event.currentTarget.dataset.artifactId

        if (!artifactId) {
            return
        }

        handleDownload(artifactId)
            .catch(downloadError => {
                setError(
                    downloadError instanceof Error
                        ? downloadError.message
                        : 'Failed to download artifact.',
                )
            })
    }, [handleDownload])

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='md'
            title='Artifacts'
            buttons={(
                <Button
                    label='Close'
                    onClick={props.onClose}
                    primary
                />
            )}
        >
            <div className={styles.container}>
                {isLoading && (
                    <div className={styles.loading}>
                        <LoadingSpinner inline />
                    </div>
                )}

                {!isLoading && !!error && (
                    <p className={styles.error}>{error}</p>
                )}

                {!isLoading && !error && artifacts.length === 0 && (
                    <p className={styles.empty}>No artifacts found.</p>
                )}

                {!isLoading && !error && artifacts.length > 0 && (
                    <ul className={styles.list}>
                        {artifacts.map(artifactId => (
                            <li className={styles.listItem} key={artifactId}>
                                <span className={styles.artifactId}>{artifactId}</span>
                                <Button
                                    data-artifact-id={artifactId}
                                    icon={IconOutline.DownloadIcon}
                                    onClick={handleArtifactDownloadClick}
                                    primary
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </BaseModal>
    )
}

export { DownloadArtifactsModal }
export default DownloadArtifactsModal
