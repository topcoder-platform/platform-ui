/** Support wrapper around the Work/Review Markdown editor and uploader. */
import {
    FC,
    useCallback,
} from 'react'

import { FieldMarkdownEditor } from '~/apps/review/src/lib/components/FieldMarkdownEditor'
import {
    ReviewAttachmentUploadOptions,
    ReviewAttachmentUploadResult,
    uploadReviewAttachment,
} from '~/apps/review/src/lib/services/file-upload.service'

import styles from './SupportMarkdownEditor.module.scss'

export interface SupportMarkdownEditorProps {
    contextId: string
    disabled?: boolean
    error?: string
    label: string
    onChange: (value: string) => void
    value: string
    uploadCategory: 'support-ticket' | 'support-ticket-response'
}

/**
 * Reuses the challenge-spec editor toolbar plus drag/drop, picker, and paste uploads.
 *
 * @param props controlled value, upload context, validation state, and change handler.
 * @returns the shared Markdown editor configured for Support attachments.
 * @throws Upload failures are displayed by the underlying editor.
 */
export const SupportMarkdownEditor: FC<SupportMarkdownEditorProps> = props => {
    /**
     * Uploads through the existing Review attachment pipeline with Support grouping.
     *
     * @param file browser-selected, dropped, or pasted attachment.
     * @param options editor progress and upload metadata.
     * @returns uploaded attachment metadata for Markdown insertion.
     * @throws The returned promise rejects when the shared uploader fails.
     */
    const uploadAttachment = useCallback((
        file: File,
        options?: ReviewAttachmentUploadOptions,
    ): Promise<ReviewAttachmentUploadResult> => uploadReviewAttachment(file, {
        ...options,
        category: props.uploadCategory,
        challengeId: props.contextId,
    }), [props.contextId, props.uploadCategory])

    return (
        <div className={styles.field}>
            <span className={styles.label} id={`${props.contextId}-editor-label`}>
                {props.label}
                {' '}
                <span aria-hidden='true'>*</span>
            </span>
            <FieldMarkdownEditor
                ariaLabel={props.label}
                disabled={props.disabled}
                error={props.error}
                hideErrorMessage
                initialValue={props.value}
                maxCharactersAllowed={50000}
                onChange={props.onChange}
                placeholder='Describe the issue and include any steps needed to reproduce it.'
                showBorder
                uploadAttachment={uploadAttachment}
                uploadCategory={props.uploadCategory}
            />
            {props.error && <p className={styles.error} role='alert'>{props.error}</p>}
        </div>
    )
}
