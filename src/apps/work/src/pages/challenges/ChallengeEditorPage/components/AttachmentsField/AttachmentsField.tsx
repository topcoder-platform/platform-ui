import {
    ChangeEvent,
    FC,
    useCallback,
    useMemo,
    useState,
} from 'react'
import {
    useController,
    useFormContext,
    useWatch,
} from 'react-hook-form'

import { uploadReviewAttachment } from '~/apps/review/src/lib/services/file-upload.service'

import {
    Attachment,
    AttachmentPayload,
    ChallengeEditorFormData,
} from '../../../../../lib/models'
import {
    createAttachments,
    deleteAttachment,
} from '../../../../../lib/services'

import styles from './AttachmentsField.module.scss'

const ALLOWED_ATTACHMENT_EXTENSIONS = new Set<string>([
    'bmp',
    'csv',
    'doc',
    'docx',
    'gif',
    'jpg',
    'pdf',
    'png',
    'ppt',
    'pptx',
    'rtf',
    'tex',
    'txt',
    'xls',
    'xlsx',
    'zip',
])

const MAX_ATTACHMENT_SIZE_BYTES = 500 * 1024 * 1024

function formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) {
        return '0 B'
    }

    const sizeUnits = [
        'B',
        'KB',
        'MB',
        'GB',
        'TB',
    ]

    const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizeUnits.length - 1)
    const value = bytes / (1024 ** power)

    return `${value.toFixed(power === 0 ? 0 : 2)} ${sizeUnits[power]}`
}

function getFileExtension(fileName: string): string {
    const fileNameParts = fileName.split('.')

    return fileNameParts.length > 1
        ? fileNameParts[fileNameParts.length - 1].toLowerCase()
        : ''
}

export const AttachmentsField: FC = () => {
    const formContext = useFormContext<ChallengeEditorFormData>()
    const controller = useController({
        control: formContext.control,
        name: 'attachments',
    })
    const field = controller.field

    const challengeId = useWatch({
        control: formContext.control,
        name: 'id',
    }) as string | undefined

    const [isUploading, setIsUploading] = useState<boolean>(false)
    const [uploadError, setUploadError] = useState<string | undefined>()
    const [uploadProgressByFile, setUploadProgressByFile] = useState<Record<string, number>>({})
    const [deletingAttachmentIds, setDeletingAttachmentIds] = useState<string[]>([])

    const attachments = useMemo<Attachment[]>(
        () => (Array.isArray(field.value)
            ? field.value
            : []),
        [field.value],
    )

    const totalUploadProgress = useMemo(() => {
        const progressValues = Object.values(uploadProgressByFile)

        if (!progressValues.length) {
            return 0
        }

        return Math.round(progressValues
            .reduce((sum, progress) => sum + progress, 0) / progressValues.length)
    }, [uploadProgressByFile])

    const handleUpload = useCallback(async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
        const selectedFiles = Array.from(event.target.files || [])

        if (!selectedFiles.length) {
            return
        }

        if (!challengeId) {
            setUploadError('Save the challenge before uploading attachments.')
            return
        }

        const invalidFiles = selectedFiles
            .filter(selectedFile => {
                const extension = getFileExtension(selectedFile.name)

                if (!ALLOWED_ATTACHMENT_EXTENSIONS.has(extension)) {
                    return true
                }

                return selectedFile.size > MAX_ATTACHMENT_SIZE_BYTES
            })

        if (invalidFiles.length) {
            const invalidNames = invalidFiles
                .map(invalidFile => invalidFile.name)
                .join(', ')

            setUploadError(`Some files are invalid or too large: ${invalidNames}`)
        } else {
            setUploadError(undefined)
        }

        const validFiles = selectedFiles
            .filter(selectedFile => {
                const extension = getFileExtension(selectedFile.name)

                if (!ALLOWED_ATTACHMENT_EXTENSIONS.has(extension)) {
                    return false
                }

                return selectedFile.size <= MAX_ATTACHMENT_SIZE_BYTES
            })

        if (!validFiles.length) {
            event.target.value = ''
            return
        }

        setIsUploading(true)

        try {
            const uploadedFiles = await Promise.all(validFiles
                .map(async selectedFile => uploadReviewAttachment(selectedFile, {
                    category: 'specification-attachments',
                    challengeId,
                    onProgress: progressPercent => {
                        setUploadProgressByFile(previousProgress => ({
                            ...previousProgress,
                            [selectedFile.name]: progressPercent,
                        }))
                    },
                })))

            const attachmentPayloads: AttachmentPayload[] = uploadedFiles
                .map((uploadedFile, index) => ({
                    fileSize: validFiles[index].size,
                    name: validFiles[index].name,
                    url: uploadedFile.url,
                }))

            const createdAttachments = await createAttachments(challengeId, attachmentPayloads)

            field.onChange([
                ...attachments,
                ...createdAttachments,
            ])
            setUploadError(undefined)
        } catch (error) {
            setUploadError(error instanceof Error
                ? error.message
                : 'Failed to upload attachments')
        } finally {
            setIsUploading(false)
            setUploadProgressByFile({})
            event.target.value = ''
        }
    }, [
        attachments,
        challengeId,
        field,
    ])

    const handleDeleteAttachment = useCallback(async (attachment: Attachment): Promise<void> => {
        const attachmentId = attachment.id
        const attachmentKey = attachment.id || attachment.url

        setDeletingAttachmentIds(currentDeletingIds => [
            ...currentDeletingIds,
            attachmentKey,
        ])

        try {
            if (attachmentId && challengeId) {
                await deleteAttachment(challengeId, attachmentId)
            }

            field.onChange(attachments
                .filter(existingAttachment => (existingAttachment.id || existingAttachment.url) !== attachmentKey))
        } catch (error) {
            setUploadError(error instanceof Error
                ? error.message
                : 'Failed to delete attachment')
        } finally {
            setDeletingAttachmentIds(currentDeletingIds => currentDeletingIds
                .filter(currentDeletingId => currentDeletingId !== attachmentKey))
        }
    }, [
        attachments,
        challengeId,
        field,
    ])

    const handleFileInputChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>): void => {
            handleUpload(event)
                .catch(() => undefined)
        },
        [handleUpload],
    )

    const getDeleteAttachmentClickHandler = useCallback(
        (attachment: Attachment): (() => void) => () => {
            handleDeleteAttachment(attachment)
                .catch(() => undefined)
        },
        [handleDeleteAttachment],
    )

    if (!challengeId) {
        return (
            <div className={styles.unsavedHint}>
                Save this challenge first to enable attachment uploads.
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.uploadRow}>
                <input
                    accept={Array.from(ALLOWED_ATTACHMENT_EXTENSIONS)
                        .map(extension => `.${extension}`)
                        .join(',')}
                    disabled={isUploading}
                    multiple
                    onChange={handleFileInputChange}
                    type='file'
                />
            </div>

            {isUploading
                ? (
                    <div className={styles.progress}>
                        Uploading...
                        {' '}
                        {totalUploadProgress}
                        %
                    </div>
                )
                : undefined}

            {uploadError
                ? <div className={styles.error}>{uploadError}</div>
                : undefined}

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Size</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attachments.length
                            ? attachments.map(attachment => {
                                const attachmentKey = attachment.id || attachment.url
                                const isDeleting = deletingAttachmentIds.includes(attachmentKey)

                                return (
                                    <tr key={attachmentKey}>
                                        <td>
                                            <a href={attachment.url} rel='noreferrer' target='_blank'>
                                                {attachment.name}
                                            </a>
                                        </td>
                                        <td>{formatBytes(Number(attachment.fileSize) || 0)}</td>
                                        <td>
                                            <button
                                                className={styles.deleteButton}
                                                disabled={isDeleting}
                                                onClick={getDeleteAttachmentClickHandler(attachment)}
                                                type='button'
                                            >
                                                {isDeleting ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })
                            : (
                                <tr>
                                    <td className={styles.empty} colSpan={3}>No attachments added.</td>
                                </tr>
                            )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default AttachmentsField
