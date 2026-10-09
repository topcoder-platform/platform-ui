import { ChangeEvent, FC, useCallback, useRef, useState } from 'react'

import { uploadEngagementAttachment } from '../../../lib/services'
import styles from '../ApplicationFormPage.module.scss'

interface CvUploadFieldProps {
    /** Engagement being applied to; used to group the stored file in S3. */
    engagementId?: string
    /** URL of the already uploaded CV, if any. */
    value?: string
    /** Receives the uploaded CV URL, or `undefined` when the CV is removed. */
    onChange: (url: string | undefined) => void
    /** Notified when an upload starts and finishes so the form can block submission meanwhile. */
    onUploadingChange?: (uploading: boolean) => void
    disabled?: boolean
    errorMessage?: string
}

export const CV_ACCEPTED_EXTENSIONS = ['.pdf', '.doc', '.docx']
const CV_MAX_FILE_SIZE_MB = 8
export const CV_MAX_FILE_SIZE_BYTES = CV_MAX_FILE_SIZE_MB * 1024 * 1024

const CV_UPLOAD_CATEGORY = 'application-cv'

/**
 * Returns a user-facing validation message for a selected CV file, or `undefined` when it can be uploaded.
 *
 * @param file the file chosen by the applicant.
 * @returns the reason the file is rejected (wrong type or too large), if any.
 */
export const getCvFileError = (file: File): string | undefined => {
    const fileName = file.name.toLowerCase()
    if (!CV_ACCEPTED_EXTENSIONS.some(extension => fileName.endsWith(extension))) {
        return 'Only PDF, DOC and DOCX files are allowed.'
    }

    if (file.size > CV_MAX_FILE_SIZE_BYTES) {
        return `CV must be ${CV_MAX_FILE_SIZE_MB} MB or smaller.`
    }

    return undefined
}

/**
 * CV upload control for the engagement application form.
 *
 * The chosen file is uploaded straight to S3 through the shared Filestack flow
 * (`uploadEngagementAttachment`) and only the resulting URL is kept in the form, which is sent to the
 * engagements API as `cvFileUrl`. Shows upload progress, the uploaded file name and a remove action.
 */
const CvUploadField: FC<CvUploadFieldProps> = (props: CvUploadFieldProps) => {
    const engagementId = props.engagementId
    const value = props.value
    const onChange = props.onChange
    const onUploadingChange = props.onUploadingChange
    const disabled = props.disabled
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [uploading, setUploading] = useState<boolean>(false)
    const [progress, setProgress] = useState<number>(0)
    const [fileName, setFileName] = useState<string | undefined>(undefined)
    const [uploadError, setUploadError] = useState<string | undefined>(undefined)

    const errorMessage = uploadError ?? props.errorMessage

    const handleBrowse = useCallback((): void => {
        fileInputRef.current?.click()
    }, [])

    const handleRemove = useCallback((): void => {
        setFileName(undefined)
        setUploadError(undefined)
        onChange(undefined)
    }, [onChange])

    const handleFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) {
            return
        }

        const validationError = getCvFileError(file)
        if (validationError) {
            setUploadError(validationError)
            return
        }

        setUploadError(undefined)
        setProgress(0)
        setUploading(true)
        onUploadingChange?.(true)

        try {
            const result = await uploadEngagementAttachment(file, {
                category: CV_UPLOAD_CATEGORY,
                engagementId,
                onProgress: setProgress,
            })
            setFileName(result.filename || file.name)
            onChange(result.url)
        } catch (err: unknown) {
            setUploadError(
                err instanceof Error && err.message
                    ? err.message
                    : 'Unable to upload your CV. Please try again.',
            )
        } finally {
            setUploading(false)
            onUploadingChange?.(false)
        }
    }, [engagementId, onChange, onUploadingChange])

    return (
        <div className={styles.cvUpload}>
            <div className={styles.fieldHint} id='cv-file-hint'>
                {`Upload your CV as a PDF, DOC or DOCX file (max ${CV_MAX_FILE_SIZE_MB} MB).`}
            </div>
            <input
                ref={fileInputRef}
                type='file'
                accept={CV_ACCEPTED_EXTENSIONS.join(',')}
                className={styles.cvFileInput}
                onChange={handleFileChange}
                disabled={disabled || uploading}
                tabIndex={-1}
                aria-hidden='true'
            />
            {value && !uploading && (
                <div className={styles.cvUploadRow}>
                    <a
                        className={styles.cvFileLink}
                        href={value}
                        target='_blank'
                        rel='noreferrer noopener'
                    >
                        {fileName ?? 'View uploaded CV'}
                    </a>
                    <button
                        type='button'
                        className={styles.removeButton}
                        onClick={handleRemove}
                        disabled={disabled}
                    >
                        Remove
                    </button>
                </div>
            )}
            {uploading && (
                <div className={styles.fieldHint} role='status'>
                    {`Uploading CV... ${Math.round(progress)}%`}
                </div>
            )}
            {!value && !uploading && (
                <button
                    id='cv-file'
                    type='button'
                    className={styles.addButton}
                    onClick={handleBrowse}
                    disabled={disabled}
                    aria-describedby={errorMessage ? 'cv-file-hint cv-file-error' : 'cv-file-hint'}
                >
                    Upload CV
                </button>
            )}
            {errorMessage && (
                <div className={styles.fieldError} id='cv-file-error'>
                    {errorMessage}
                </div>
            )}
        </div>
    )
}

export default CvUploadField
