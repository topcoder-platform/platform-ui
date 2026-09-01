/* eslint-disable react/jsx-no-bind */
import {
    ChangeEvent,
    DragEvent,
    FC,
    useEffect,
    useRef,
    useState,
} from 'react'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { recordAnalyticsEvent } from '~/libs/core'
import { IconOutline } from '~/libs/ui'

import {
    ChallengeOpportunity,
    ChallengeSubmission,
    ChallengeSubmissionType,
} from '../models'
import { createChallengeSubmission } from '../services'

import { challengeCatalogKey } from './challenge-card.utils'
import styles from './ChallengeSubmissionUpload.module.scss'

const MAX_SUBMISSION_BYTES = 500 * 1024 * 1024

interface ChallengeSubmissionUploadProps {
    challenge: ChallengeOpportunity
    memberId: string
    onBack: () => void
    onContactSupport: () => void
    onShowRequirements: () => void
    onShowTerms: () => void
    onSubmitted: (submission: ChallengeSubmission) => Promise<unknown> | unknown
}

/**
 * Selects the Review API submission type represented by the currently open phase.
 *
 * @param challenge challenge with expanded or compact current-phase data.
 * @returns final-fix, checkpoint, or standard contest submission type.
 * @throws Does not throw.
 */
export function challengeSubmissionType(challenge: ChallengeOpportunity): ChallengeSubmissionType {
    const phaseKeys = [
        ...(challenge.phases ?? [])
            .filter(phase => phase.isOpen === true)
            .map(phase => challengeCatalogKey(phase.name)),
        ...(challenge.currentPhaseNames ?? []).map(challengeCatalogKey),
    ]
    if (phaseKeys.some(key => key.includes('finalfix'))) return 'STUDIO_FINAL_FIX_SUBMISSION'
    if (phaseKeys.some(key => key.includes('checkpointsubmission'))) return 'CHECKPOINT_SUBMISSION'
    return 'CONTEST_SUBMISSION'
}

/**
 * Validates the single archive accepted by the Figma submission flow.
 *
 * @param file browser-selected candidate file.
 * @returns member-facing validation failure, or undefined when the file is accepted.
 * @throws Does not throw.
 */
export function validateChallengeSubmissionFile(file: File): string | undefined {
    if (!file.name.toLowerCase()
        .endsWith('.zip')) return 'Choose a ZIP file ending in .zip.'
    if (file.size > MAX_SUBMISSION_BYTES) return 'The ZIP file must be 500MB or smaller.'
    return undefined
}

/**
 * Formats the compact whole-megabyte size displayed beside an uploaded archive.
 *
 * @param bytes file size in bytes.
 * @returns rounded member-facing size in megabytes.
 * @throws Does not throw.
 */
function formatFileSize(bytes: number): string {
    return `${Math.max(1, Math.round(bytes / (1024 * 1024)))} MB`
}

/**
 * Renders the Figma upload, progress, declaration, and confirmation states inside
 * the active My Submissions challenge tab.
 *
 * @param props challenge identity, member identity, navigation, legal, support, and cache callbacks.
 * @returns accessible DMZ-to-Review-API submission workflow.
 * @throws Does not throw; upload and clipboard failures are rendered or toasted in place.
 */
export const ChallengeSubmissionUpload: FC<ChallengeSubmissionUploadProps> = props => {
    const [agreementAccepted, setAgreementAccepted] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [error, setError] = useState<string | undefined>()
    const [file, setFile] = useState<File | undefined>()
    const [progress, setProgress] = useState(0)
    const [submissionId, setSubmissionId] = useState<string | undefined>()
    const [uploading, setUploading] = useState(false)
    const abortController = useRef<AbortController | undefined>()
    const input = useRef<HTMLInputElement | null>(null)
    const trackKey = challengeCatalogKey(props.challenge.track)
    const typeKey = challengeCatalogKey(props.challenge.type)
    const designChallenge = trackKey === 'design'
    const pluralUpload = trackKey === 'qualityassurance' || typeKey === 'marathonmatch'

    useEffect(() => () => abortController.current?.abort(), [])

    /**
     * Clears a selected file and cancels its active multipart request when present.
     *
     * @returns void after restoring the empty uploader state.
     * @throws Does not throw.
     */
    const clearFile = (): void => {
        abortController.current?.abort()
        abortController.current = undefined
        if (input.current) input.current.value = ''
        setAgreementAccepted(false)
        setError(undefined)
        setFile(undefined)
        setProgress(0)
        setUploading(false)
    }

    /**
     * Validates and stores the first dropped or browsed archive.
     *
     * @param files file-list-like collection supplied by the browser.
     * @returns void after accepting one ZIP or showing its validation error.
     * @throws Does not throw.
     */
    const acceptFiles = (files: FileList | File[]): void => {
        const candidate = files[0]
        if (!candidate) return
        const validationError = validateChallengeSubmissionFile(candidate)
        setError(validationError)
        setAgreementAccepted(false)
        setProgress(0)
        setFile(validationError ? undefined : candidate)
    }

    /**
     * Opens the hidden native file picker from the styled Figma drop zone.
     *
     * @returns void after forwarding focus to the picker.
     * @throws Does not throw.
     */
    const browse = (): void => input.current?.click()

    /**
     * Handles a native picker change and accepts its first archive.
     *
     * @param event file-input change event.
     * @returns void after validation.
     * @throws Does not throw.
     */
    const changeFile = (event: ChangeEvent<HTMLInputElement>): void => {
        if (event.target.files) acceptFiles(event.target.files)
    }

    /**
     * Enables the browser's file-drop behavior over the styled drop zone.
     *
     * @param event drop-zone drag-over event.
     * @returns void after preventing browser navigation.
     * @throws Does not throw.
     */
    const dragOver = (event: DragEvent<HTMLButtonElement>): void => {
        event.preventDefault()
        setDragActive(true)
    }

    /**
     * Accepts the first archive dropped onto the uploader.
     *
     * @param event drop-zone file event.
     * @returns void after validation.
     * @throws Does not throw.
     */
    const dropFile = (event: DragEvent<HTMLButtonElement>): void => {
        event.preventDefault()
        setDragActive(false)
        acceptFiles(event.dataTransfer.files)
    }

    /**
     * Uploads the accepted archive and advances to the immutable confirmation state.
     *
     * @returns promise settled after the Review API response and cache refresh callback.
     * @throws Does not throw; request failures restore the ready state with an error message.
     */
    const submit = async (): Promise<void> => {
        if (!file || !agreementAccepted || uploading) return
        const controller = new AbortController()
        abortController.current = controller
        setError(undefined)
        setProgress(0)
        setUploading(true)
        try {
            const submission = await createChallengeSubmission(
                props.challenge.id,
                props.memberId,
                challengeSubmissionType(props.challenge),
                file,
                setProgress,
                controller.signal,
            )
            recordAnalyticsEvent('challenge_submitted', {
                challenge_id: props.challenge.id,
                challenge_track: trackKey,
                member_id: props.memberId,
                submission_type: challengeSubmissionType(props.challenge),
            }, true)
            setProgress(100)
            setSubmissionId(submission.id)
            setUploading(false)
            await props.onSubmitted(submission)
        } catch (caughtError) {
            if (controller.signal.aborted) return
            setError(caughtError instanceof Error
                ? caughtError.message
                : 'Unable to upload this submission.')
            setUploading(false)
        } finally {
            if (abortController.current === controller) abortController.current = undefined
        }
    }

    /**
     * Copies the created submission identifier for later support or review use.
     *
     * @returns promise settled after clipboard feedback is displayed.
     * @throws Does not throw; unavailable clipboard access is reported with a toast.
     */
    const copySubmissionId = async (): Promise<void> => {
        if (!submissionId || !navigator.clipboard) {
            toast.error('Clipboard access is unavailable. Select and copy the submission ID instead.')
            return
        }

        try {
            await navigator.clipboard.writeText(submissionId)
            toast.success('Submission ID copied.')
        } catch {
            toast.error('Unable to copy the submission ID.')
        }
    }

    /**
     * Restores a clean form after a successful upload while preserving challenge context.
     *
     * @returns void after clearing every transient form field.
     * @throws Does not throw.
     */
    const submitAnother = (): void => {
        clearFile()
        setSubmissionId(undefined)
    }

    return (
        <div className={styles.uploadFlow}>
            <header className={styles.header}>
                <div>
                    <button aria-label='Back to My Submissions' onClick={props.onBack} type='button'>
                        <IconOutline.ArrowLeftIcon aria-hidden='true' />
                    </button>
                    <h2>Submit your solution</h2>
                </div>
                <p>Upload your solution files as described in the requirements.</p>
            </header>
            <div className={styles.columns}>
                <aside className={styles.leftPanel}>
                    <section className={styles.infoCard}>
                        <h3>
                            <IconOutline.DocumentAddIcon aria-hidden='true' />
                            Required Files
                        </h3>
                        {designChallenge ? (
                            <ul className={styles.requiredFiles}>
                                <li>
                                    <IconOutline.ArchiveIcon aria-hidden='true' />
                                    Source folder zip file
                                </li>
                                <li>
                                    <IconOutline.ArchiveIcon aria-hidden='true' />
                                    Submission folder zip file
                                </li>
                                <li>
                                    <IconOutline.DocumentTextIcon aria-hidden='true' />
                                    Declarations txt file
                                </li>
                                <li>
                                    <IconOutline.PhotographIcon aria-hidden='true' />
                                    Preview jpg image
                                </li>
                            </ul>
                        ) : (
                            <p>
                                Please follow the instructions on the Requirements tab regarding what your submission
                                should contain and how it should be organized.
                            </p>
                        )}
                        <button className={styles.textButton} onClick={props.onShowRequirements} type='button'>
                            Learn more
                            <IconOutline.ArrowRightIcon aria-hidden='true' />
                        </button>
                    </section>
                    <section className={styles.infoCard}>
                        <h3>
                            <IconOutline.BadgeCheckIcon aria-hidden='true' />
                            Submission tips
                        </h3>
                        <ul className={styles.tips}>
                            <li>
                                <IconOutline.LightBulbIcon aria-hidden='true' />
                                Upload a single ZIP file only
                            </li>
                            <li>
                                <IconOutline.LightBulbIcon aria-hidden='true' />
                                Do not password protect the files
                            </li>
                            <li>
                                <IconOutline.LightBulbIcon aria-hidden='true' />
                                Include all files as per guidelines
                            </li>
                            <li>
                                <IconOutline.LightBulbIcon aria-hidden='true' />
                                Keep your handle out of your files and file names
                            </li>
                        </ul>
                    </section>
                    <section className={styles.infoCard}>
                        <h3>
                            <IconOutline.QuestionMarkCircleIcon aria-hidden='true' />
                            Need help?
                        </h3>
                        <p>
                            Having issues with submitting your solution? To get assistance contact
                            {' '}
                            <button className={styles.inlineButton} onClick={props.onContactSupport} type='button'>
                                Topcoder Support
                            </button>
                            .
                        </p>
                    </section>
                </aside>
                <section className={classNames(styles.mainPanel, {
                    [styles.successPanel]: !!submissionId,
                })}
                >
                    {submissionId ? (
                        <div className={styles.successContent}>
                            <div className={styles.successCopy}>
                                <span className={styles.successIcon}>
                                    <IconOutline.CheckCircleIcon aria-hidden='true' />
                                </span>
                                <h3>Your solutions has been submitted</h3>
                                <p>Thank you for your submission. You will receive an email confirmation shortly.</p>
                                <div className={styles.submissionId}>
                                    <span>
                                        Your submission ID is:
                                        {' '}
                                        <strong>{submissionId}</strong>
                                    </span>
                                    <button
                                        aria-label='Copy submission ID'
                                        onClick={copySubmissionId}
                                        type='button'
                                    >
                                        <IconOutline.DocumentDuplicateIcon aria-hidden='true' />
                                    </button>
                                </div>
                            </div>
                            <div className={styles.successActions}>
                                <button className={styles.primaryButton} onClick={props.onBack} type='button'>
                                    Back to submissions
                                </button>
                                <button className={styles.secondaryButton} onClick={submitAnother} type='button'>
                                    Submit another solution
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className={styles.fileUploader}>
                                <label htmlFor='challenge-submission-file'>
                                    {pluralUpload ? 'Upload File(s)' : 'Upload File'}
                                    <span>*</span>
                                </label>
                                <input
                                    accept='.zip,application/zip,application/x-zip-compressed'
                                    disabled={uploading}
                                    id='challenge-submission-file'
                                    onChange={changeFile}
                                    ref={input}
                                    type='file'
                                />
                                <button
                                    className={classNames(styles.dropZone, { [styles.dragActive]: dragActive })}
                                    disabled={uploading}
                                    onClick={browse}
                                    onDragEnter={() => setDragActive(true)}
                                    onDragLeave={() => setDragActive(false)}
                                    onDragOver={dragOver}
                                    onDrop={dropFile}
                                    type='button'
                                >
                                    <IconOutline.UploadIcon aria-hidden='true' />
                                    <span>Drop your file(s) here or</span>
                                    <strong>Browse</strong>
                                </button>
                                <small>Format file must be .zip | Max file size 500MB</small>
                                {error && <p className={styles.error} role='alert'>{error}</p>}
                            </div>
                            {file && (
                                <div className={styles.uploadedFile}>
                                    <strong>Uploading</strong>
                                    <div className={styles.fileRow}>
                                        <IconOutline.PhotographIcon aria-hidden='true' />
                                        <div className={styles.fileCopy}>
                                            <strong>{file.name}</strong>
                                            <span>
                                                {uploading && progress < 100
                                                    ? `${formatFileSize(file.size * (progress / 100))} / `
                                                    : ''}
                                                {formatFileSize(file.size)}
                                            </span>
                                        </div>
                                        <button
                                            aria-label={uploading ? 'Cancel upload' : 'Remove selected file'}
                                            onClick={clearFile}
                                            type='button'
                                        >
                                            {uploading
                                                ? <IconOutline.XIcon aria-hidden='true' />
                                                : <IconOutline.TrashIcon aria-hidden='true' />}
                                        </button>
                                        {uploading && (
                                            <div className={styles.uploadProgress}>
                                                <span
                                                    aria-label='Upload progress'
                                                    aria-valuemax={100}
                                                    aria-valuemin={0}
                                                    aria-valuenow={progress}
                                                    role='progressbar'
                                                >
                                                    <i style={{ width: `${progress}%` }} />
                                                </span>
                                                <strong>{`${progress}%`}</strong>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className={styles.declaration}>
                                <h3>Declaration</h3>
                                <p>
                                    Submitting your files means you hereby agree to the
                                    {' '}
                                    <button className={styles.inlineButton} onClick={props.onShowTerms} type='button'>
                                        Topcoder Terms of Use
                                    </button>
                                    {' '}
                                    and to the extent your uploaded file wins a Topcoder competition, you hereby assign,
                                    grant and transfer and agree to assign, grant and transfer to Topcoder all right and
                                    title in and to the Winning Submission (as further described in the terms of use).
                                </p>
                            </div>
                            <label className={styles.agreement}>
                                <input
                                    checked={agreementAccepted}
                                    disabled={!file || uploading}
                                    onChange={event => setAgreementAccepted(event.target.checked)}
                                    type='checkbox'
                                />
                                <span>I understand and agree</span>
                            </label>
                            <div className={styles.divider} />
                            <div className={styles.actions}>
                                <button className={styles.secondaryButton} onClick={props.onBack} type='button'>
                                    Cancel
                                </button>
                                <button
                                    className={styles.primaryButton}
                                    data-analytics-id='challenge-submit-confirm'
                                    data-analytics-placement='challenge-submission'
                                    disabled={!file || !agreementAccepted || uploading}
                                    onClick={submit}
                                    type='button'
                                >
                                    <IconOutline.UploadIcon aria-hidden='true' />
                                    {uploading ? 'Uploading…' : 'Submit'}
                                </button>
                            </div>
                        </>
                    )}
                </section>
            </div>
        </div>
    )
}
