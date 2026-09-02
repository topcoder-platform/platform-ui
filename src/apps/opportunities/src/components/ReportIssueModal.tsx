/* eslint-disable ordered-imports/ordered-imports, react/jsx-no-bind */
import {
    ChangeEvent,
    DragEvent,
    FC,
    useRef,
    useState,
} from 'react'
import { toast } from 'react-toastify'

import {
    MAX_SUPPORT_ATTACHMENT_BYTES,
    SupportAttachmentUploadResult,
    uploadSupportAttachment,
} from '~/apps/support/src/lib/services/support-attachment.service'
import { createSupportTicket } from '~/apps/support/src/lib/services/support.service'
import { BaseModal, Button, IconOutline } from '~/libs/ui'

import styles from './ReportIssueModal.module.scss'

const DESCRIPTION_LIMIT = 1000
const ISSUE_CATEGORIES = [
    'Registration',
    'Submission',
    'Challenge requirements',
    'Review',
    'Payment',
    'Other',
]

interface ReportIssueModalProps {
    challengeId?: string
    onClose: () => void
    open: boolean
}

interface IssueAttachment {
    error?: string
    file: File
    id: number
    result?: SupportAttachmentUploadResult
    status: 'error' | 'uploaded' | 'uploading'
}

/**
 * Formats an attached file size in the one-decimal megabyte style authored by Figma.
 *
 * @param bytes file size in bytes.
 * @returns compact megabyte label such as `1.1 MB`.
 * @throws Does not throw.
 */
function formatAttachmentSize(bytes: number): string {
    const megabytes = bytes / (1024 * 1024)
    return `${Math.max(0.1, megabytes)
        .toFixed(1)} MB`
}

/**
 * Preserves the authored subject, category, description, and uploaded-file
 * metadata inside the description-only support-api-v6 ticket contract.
 *
 * @param subject member-entered issue subject.
 * @param category selected authored issue category.
 * @param description member-entered issue details.
 * @param attachments optional uploaded file metadata.
 * @returns Markdown description accepted by support-api-v6, with attachments appended only when present.
 * @throws Does not throw.
 */
export function buildReportIssueDescription(
    subject: string,
    category: string,
    description: string,
    attachments: SupportAttachmentUploadResult[],
): string {
    const attachmentLines = attachments.map(attachment => {
        const label = attachment.filename.replace(/\[|\]/g, '') || 'Attachment'
        return `- [${label}](${attachment.url})`
    })
    const lines = [
        `**Subject:** ${subject.trim()}`,
        `**Category:** ${category.trim()}`,
        '',
        description.trim(),
    ]

    if (attachmentLines.length) {
        lines.push('', '**Attachments:**', ...attachmentLines)
    }

    return lines.join('\n')
}

/**
 * Renders both authored Report an Issue states while adapting their richer
 * fields to support-api-v6's challenge-id plus Markdown-description contract.
 * Attachments are optional and upload through the authenticated Support API
 * before submission.
 *
 * @param props optional challenge context and modal state.
 * @returns subject, category, description, attachment, and success states.
 * @throws Does not throw; validation, upload, and request errors stay in the modal.
 */
export const ReportIssueModal: FC<ReportIssueModalProps> = props => {
    const [attachments, setAttachments] = useState<IssueAttachment[]>([])
    const [busy, setBusy] = useState(false)
    const [category, setCategory] = useState('')
    const [created, setCreated] = useState(false)
    const [description, setDescription] = useState('')
    const [dragActive, setDragActive] = useState(false)
    const [error, setError] = useState<string>()
    const [subject, setSubject] = useState('')
    const attachmentId = useRef(0)
    const fileInput = useRef<HTMLInputElement>(null)
    const uploading = attachments.some(attachment => attachment.status === 'uploading')
    const uploaded = attachments
        .filter((attachment): attachment is IssueAttachment & { result: SupportAttachmentUploadResult } => (
            attachment.status === 'uploaded' && !!attachment.result
        ))
    const canSubmit = !!subject.trim()
        && !!category
        && !!description.trim()
        && !uploading
        && !busy

    /**
     * Clears local form and confirmation state for the next modal session.
     *
     * @returns void.
     * @throws Does not throw.
     */
    const reset = (): void => {
        setAttachments([])
        setCategory('')
        setCreated(false)
        setDescription('')
        setDragActive(false)
        setError(undefined)
        setSubject('')
        if (fileInput.current) fileInput.current.value = ''
    }

    /**
     * Clears local state and closes the dialog when no request or upload is active.
     *
     * @returns void.
     * @throws Does not throw.
     */
    const close = (): void => {
        if (busy || uploading) return
        reset()
        props.onClose()
    }

    /**
     * Validates and uploads selected files through the shared attachment pipeline.
     *
     * @param files browser-selected or dropped files.
     * @returns promise settled after every accepted upload has succeeded or failed.
     * @throws Does not throw; validation and upload failures render in the form.
     */
    const addAttachments = async (files: FileList | File[]): Promise<void> => {
        const candidates = Array.from(files)
        if (!candidates.length) return
        const oversized = candidates.find(file => file.size > MAX_SUPPORT_ATTACHMENT_BYTES)
        if (oversized) {
            setError(`${oversized.name} is larger than the 2 MB attachment limit.`)
            return
        }

        setError(undefined)
        const pending = candidates.map<IssueAttachment>(file => {
            attachmentId.current += 1
            return {
                file,
                id: attachmentId.current,
                status: 'uploading',
            }
        })
        setAttachments(current => [...current, ...pending])
        await Promise.all(pending.map(async attachment => {
            try {
                const result = await uploadSupportAttachment(attachment.file)
                setAttachments(current => current.map(item => (item.id === attachment.id
                    ? { ...item, result, status: 'uploaded' }
                    : item)))
            } catch (uploadError) {
                const message = uploadError instanceof Error ? uploadError.message : 'File upload failed.'
                setAttachments(current => current.map(item => (item.id === attachment.id
                    ? { ...item, error: message, status: 'error' }
                    : item)))
                setError(message)
            }
        }))
        if (fileInput.current) fileInput.current.value = ''
    }

    /**
     * Uploads files selected by the hidden native picker.
     *
     * @param event native file-input change event.
     * @returns void after starting the asynchronous uploads.
     * @throws Does not throw.
     */
    const selectFiles = (event: ChangeEvent<HTMLInputElement>): void => {
        if (event.target.files) {
            addAttachments(event.target.files)
                .catch(() => undefined)
        }
    }

    /**
     * Accepts files dropped on the authored attachment zone.
     *
     * @param event native attachment drop event.
     * @returns void after starting the asynchronous uploads.
     * @throws Does not throw.
     */
    const dropFiles = (event: DragEvent<HTMLButtonElement>): void => {
        event.preventDefault()
        setDragActive(false)
        addAttachments(event.dataTransfer.files)
            .catch(() => undefined)
    }

    /**
     * Removes one uploaded, pending, or failed attachment from the report.
     *
     * @param id local attachment identifier.
     * @returns void.
     * @throws Does not throw.
     */
    const removeAttachment = (id: number): void => {
        setAttachments(current => current.filter(attachment => attachment.id !== id))
    }

    /**
     * Creates a challenge-scoped support ticket after all authored required fields validate.
     *
     * @returns promise settled after the support request succeeds or fails.
     * @throws Does not throw; request failures remain visible inside the modal.
     */
    const submit = async (): Promise<void> => {
        if (!canSubmit) {
            setError('Complete every required field before sending the report.')
            return
        }

        setBusy(true)
        setError(undefined)
        try {
            await createSupportTicket({
                ...(props.challengeId ? { challengeId: props.challengeId } : {}),
                description: buildReportIssueDescription(
                    subject,
                    category,
                    description,
                    uploaded.map(attachment => attachment.result),
                ),
            })
            setCreated(true)
            toast.success('Your issue was sent to the Platform Team.')
        } catch (requestError) {
            const message = requestError instanceof Error ? requestError.message : 'The issue could not be submitted.'
            setError(message)
        } finally {
            setBusy(false)
        }
    }

    return (
        <BaseModal
            ariaLabelledby='report-issue-title'
            buttons={created ? (
                <Button
                    className={styles.actionButton}
                    customRadius
                    label='Done'
                    noCaps
                    onClick={close}
                    primary
                    uiv2
                />
            ) : (
                <>
                    <Button
                        className={styles.actionButton}
                        customRadius
                        disabled={busy || uploading}
                        label='Cancel'
                        noCaps
                        onClick={close}
                        secondary
                        uiv2
                    />
                    <Button
                        className={styles.actionButton}
                        customRadius
                        disabled={!canSubmit}
                        label={busy ? 'Sending…' : 'Send report'}
                        loading={busy}
                        noCaps
                        onClick={submit}
                        primary
                        uiv2
                    />
                </>
            )}
            bodyClassName={styles.modalBody}
            center
            classNames={{ modal: styles.modal }}
            onClose={close}
            open={props.open}
            showCloseIcon={false}
            size='md'
            spacer={false}
            title={(
                <div className={styles.modalHeading}>
                    <h2 className={styles.modalTitle} id='report-issue-title'>Report an Issue</h2>
                    <button
                        aria-label='Close report issue'
                        className={styles.modalClose}
                        disabled={busy || uploading}
                        onClick={close}
                        type='button'
                    >
                        <IconOutline.XIcon aria-hidden='true' />
                    </button>
                </div>
            )}
        >
            {created ? (
                <div className={styles.success}>
                    <IconOutline.CheckCircleIcon />
                    <h3>Thank you for reporting this issue.</h3>
                    <p>The Platform Team will follow up through your support ticket.</p>
                </div>
            ) : (
                <div className={styles.form}>
                    <label className={styles.field}>
                        <span>
                            Subject
                            <em>*</em>
                        </span>
                        <input
                            disabled={busy}
                            maxLength={255}
                            onChange={event => setSubject(event.target.value)}
                            placeholder='Enter the subject of your issue'
                            value={subject}
                        />
                    </label>
                    <label className={styles.field}>
                        <span>
                            Category
                            <em>*</em>
                        </span>
                        <select
                            disabled={busy}
                            onChange={event => setCategory(event.target.value)}
                            value={category}
                        >
                            <option value=''>Select category</option>
                            {ISSUE_CATEGORIES.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </label>
                    <label className={styles.field}>
                        <span>
                            Description
                            <em>*</em>
                        </span>
                        <textarea
                            disabled={busy}
                            maxLength={DESCRIPTION_LIMIT}
                            onChange={event => setDescription(event.target.value)}
                            placeholder='Explain your issue'
                            value={description}
                        />
                        <small>Max. 1000 characters</small>
                    </label>
                    <div className={styles.attachmentField}>
                        <span className={styles.attachmentLabel}>
                            {attachments.length ? 'Attach Screenshots, Files' : 'Attach Files'}
                        </span>
                        <input
                            aria-label='Attach files'
                            disabled={busy || uploading}
                            multiple
                            onChange={selectFiles}
                            ref={fileInput}
                            type='file'
                        />
                        <button
                            className={dragActive ? styles.activeDropZone : styles.dropZone}
                            disabled={busy || uploading}
                            onClick={() => fileInput.current?.click()}
                            onDragEnter={() => setDragActive(true)}
                            onDragLeave={() => setDragActive(false)}
                            onDragOver={event => event.preventDefault()}
                            onDrop={dropFiles}
                            type='button'
                        >
                            <IconOutline.UploadIcon aria-hidden='true' />
                            <span>Drop your file(s) here or</span>
                            <strong>Browse</strong>
                        </button>
                        <small>Max. 2 MB per file</small>
                    </div>
                    {attachments.length > 0 && (
                        <div className={styles.attachments}>
                            <strong>Uploading</strong>
                            {attachments.map(attachment => (
                                <div className={styles.attachmentRow} key={attachment.id}>
                                    <IconOutline.PhotographIcon aria-hidden='true' />
                                    <span>
                                        <strong>{attachment.file.name}</strong>
                                        <small>
                                            {attachment.status === 'uploading'
                                                ? 'Uploading…'
                                                : attachment.status === 'error'
                                                    ? attachment.error
                                                    : formatAttachmentSize(
                                                        attachment.result?.size ?? attachment.file.size,
                                                    )}
                                        </small>
                                    </span>
                                    <button
                                        aria-label={`Remove ${attachment.file.name}`}
                                        onClick={() => removeAttachment(attachment.id)}
                                        type='button'
                                    >
                                        <IconOutline.TrashIcon aria-hidden='true' />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    {error && <p className={styles.error} role='alert'>{error}</p>}
                </div>
            )}
        </BaseModal>
    )
}
