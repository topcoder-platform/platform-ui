/** Support wrapper around the Work/Review Markdown editor. */
import {
    FC,
    useCallback,
} from 'react'

import { FieldMarkdownEditor } from '~/apps/review/src/lib/components/FieldMarkdownEditor'

import {
    MAX_SUPPORT_ATTACHMENT_BYTES,
    SupportAttachmentUploadOptions,
    SupportAttachmentUploadResult,
    uploadSupportAttachment,
} from '../../services'

import styles from './SupportMarkdownEditor.module.scss'

export interface SupportMarkdownEditorProps {
    disabled?: boolean
    editorId: string
    error?: string
    label: string
    onChange: (value: string) => void
    value: string
}

/**
 * Reuses the challenge-spec editor toolbar plus drag/drop, picker, and paste uploads.
 *
 * @param props controlled value, editor identity, validation state, and change handler.
 * @returns the shared Markdown editor configured for Support attachments.
 * @throws Upload failures are displayed by the underlying editor.
 */
export const SupportMarkdownEditor: FC<SupportMarkdownEditorProps> = props => {
    /**
     * Uploads through the authenticated Support API, forwarding editor progress.
     *
     * @param file browser-selected, dropped, or pasted attachment.
     * @param options editor upload progress callback.
     * @returns uploaded attachment metadata for Markdown insertion.
     * @throws The returned promise rejects when the Support uploader fails.
     */
    const uploadAttachment = useCallback((
        file: File,
        options?: SupportAttachmentUploadOptions,
    ): Promise<SupportAttachmentUploadResult> => uploadSupportAttachment(file, {
        onProgress: options?.onProgress,
    }), [])

    return (
        <div className={styles.field}>
            <span className={styles.label} id={`${props.editorId}-editor-label`}>
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
                maxUploadSize={MAX_SUPPORT_ATTACHMENT_BYTES}
                onChange={props.onChange}
                placeholder='Describe the issue and include any steps needed to reproduce it.'
                showBorder
                uploadAttachment={uploadAttachment}
            />
            {props.error && <p className={styles.error} role='alert'>{props.error}</p>}
        </div>
    )
}
