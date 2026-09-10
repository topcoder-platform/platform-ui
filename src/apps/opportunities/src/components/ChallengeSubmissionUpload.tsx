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

import { EnvironmentConfig } from '~/config'
import { recordAnalyticsEvent } from '~/libs/core'
import { IconOutline } from '~/libs/ui'

import {
    ChallengeOpportunity,
    ChallengeSubmission,
    ChallengeSubmissionType,
} from '../models'
import {
    createChallengeSubmission,
    createChallengeUrlSubmission,
} from '../services'
import { challengeSubmissionMode } from '../utils/challenge-detail.utils'

import { challengeCatalogKey } from './challenge-card.utils'
import styles from './ChallengeSubmissionUpload.module.scss'

const MAX_SUBMISSION_BYTES = 500 * 1024 * 1024

interface ChallengeSubmissionUploadProps {
    challenge: ChallengeOpportunity
    memberId: string
    onBack: () => void
    onContactSupport: () => void
    onShowRequirements: () => void
    onSubmitted: (submission: ChallengeSubmission) => Promise<unknown> | unknown
    onUploadingChange?: (uploading: boolean) => void
    onValidateRegistration: () => Promise<boolean>
}

/** Renders the compact extension badge used by Design required-file rows. */
const FileTypeIcon: FC<{ extension: 'JPG' | 'TXT' | 'ZIP' }> = props => (
    <span aria-hidden='true' className={styles.fileTypeIcon}>{props.extension}</span>
)

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
 * Validates a member-authored challenge deliverable URL.
 *
 * @param value URL entered in the submission form.
 * @returns member-facing validation failure, or undefined for an absolute HTTP(S) URL.
 * @throws Does not throw; malformed URLs are returned as validation failures.
 */
export function validateChallengeSubmissionUrl(value: string): string | undefined {
    const normalizedValue = value.trim()
    if (!normalizedValue) return 'Enter the URL to your submission.'

    try {
        const url = new URL(normalizedValue)
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return 'Enter a URL beginning with http:// or https://.'
        }

        if (!url.hostname) return 'Enter a valid submission URL.'
        return undefined
    } catch {
        return 'Enter a valid submission URL.'
    }
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
    const onUploadingChange = props.onUploadingChange
    const [agreementAccepted, setAgreementAccepted] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [error, setError] = useState<string | undefined>()
    const [file, setFile] = useState<File | undefined>()
    const [progress, setProgress] = useState(0)
    const [submissionUrl, setSubmissionUrl] = useState<string | undefined>()
    const [urlInput, setUrlInput] = useState('')
    const [submissionId, setSubmissionId] = useState<string | undefined>()
    const [uploading, setUploading] = useState(false)
    const abortController = useRef<AbortController | undefined>()
    const input = useRef<HTMLInputElement | null>(null)
    const trackKey = challengeCatalogKey(props.challenge.track)
    const typeKey = challengeCatalogKey(props.challenge.type)
    const designChallenge = trackKey === 'design'
    const pluralUpload = trackKey === 'qualityassurance' || typeKey === 'marathonmatch'
    const submissionMode = challengeSubmissionMode(props.challenge)
    const urlMode = submissionMode === 'url'
    const selectionReady = urlMode ? !!submissionUrl : !!file

    useEffect(() => () => {
        abortController.current?.abort()
        onUploadingChange?.(false)
    }, [onUploadingChange])

    /**
     * Keeps the local form and parent tab-navigation lock in sync.
     *
     * @param active whether a submission request is active.
     * @returns void after notifying both owners.
     * @throws Does not throw.
     */
    const setUploadActive = (active: boolean): void => {
        setUploading(active)
        onUploadingChange?.(active)
    }

    /**
     * Clears the selected file or URL and cancels its active request when present.
     *
     * @returns void after restoring the empty uploader state.
     * @throws Does not throw.
     */
    const clearSelection = (): void => {
        abortController.current?.abort()
        abortController.current = undefined
        if (input.current) input.current.value = ''
        setAgreementAccepted(false)
        setError(undefined)
        setFile(undefined)
        setProgress(0)
        setSubmissionUrl(undefined)
        setUrlInput('')
        setUploadActive(false)
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
     * Updates the URL draft and invalidates any previously confirmed link.
     *
     * @param event text-input change event.
     * @returns void after returning the URL mode to its editable state.
     * @throws Does not throw.
     */
    const changeUrl = (event: ChangeEvent<HTMLInputElement>): void => {
        setUrlInput(event.target.value)
        setSubmissionUrl(undefined)
        setAgreementAccepted(false)
        setError(undefined)
    }

    /**
     * Validates and confirms the URL that will be sent to Review API.
     *
     * @returns void after accepting the trimmed URL or showing an inline error.
     * @throws Does not throw.
     */
    const confirmUrl = (): void => {
        const normalizedUrl = urlInput.trim()
        const validationError = validateChallengeSubmissionUrl(normalizedUrl)
        setError(validationError)
        setAgreementAccepted(false)
        if (!validationError) setUrlInput(normalizedUrl)
        setSubmissionUrl(validationError ? undefined : normalizedUrl)
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
     * Revalidates challenge registration, uploads the accepted archive, and advances
     * to the immutable confirmation state.
     *
     * @returns promise settled after the Review API response and cache refresh callback.
     * @throws Does not throw; request failures restore the ready state with an error message.
     */
    const submit = async (): Promise<void> => {
        if (!selectionReady || !agreementAccepted || uploading) return
        const controller = new AbortController()
        abortController.current = controller
        setError(undefined)
        setProgress(0)
        setUploadActive(true)
        try {
            const registrationIsCurrent = await props.onValidateRegistration()
            if (!registrationIsCurrent || controller.signal.aborted) return
            const submissionType = challengeSubmissionType(props.challenge)
            const submission = urlMode
                ? await createChallengeUrlSubmission(
                    props.challenge.id,
                    props.memberId,
                    submissionType,
                    submissionUrl as string,
                    controller.signal,
                )
                : await createChallengeSubmission(
                    props.challenge.id,
                    props.memberId,
                    submissionType,
                    file as File,
                    setProgress,
                    controller.signal,
                )
            recordAnalyticsEvent('challenge_submitted', {
                challenge_id: props.challenge.id,
                challenge_track: trackKey,
                member_id: props.memberId,
                submission_type: submissionType,
            }, true)
            setProgress(100)
            setSubmissionId(submission.id)
            await props.onSubmitted(submission)
        } catch (caughtError) {
            if (controller.signal.aborted) return
            setError(caughtError instanceof Error
                ? caughtError.message
                : 'Unable to upload this submission.')
        } finally {
            if (abortController.current === controller) abortController.current = undefined
            setUploadActive(false)
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
        clearSelection()
        setSubmissionId(undefined)
    }

    return (
        <div className={styles.uploadFlow}>
            <header className={styles.header}>
                <div>
                    <button
                        aria-label='Back to My Submissions'
                        disabled={uploading}
                        onClick={props.onBack}
                        type='button'
                    >
                        <IconOutline.ArrowLeftIcon aria-hidden='true' />
                    </button>
                    <h2>Submit your solution</h2>
                </div>
                <p>
                    {urlMode
                        ? 'Submit the URL to your solution as described in the requirements.'
                        : 'Upload your solution files as described in the requirements.'}
                </p>
            </header>
            <div className={styles.columns}>
                <aside className={styles.leftPanel}>
                    <section className={styles.infoCard}>
                        <h3>
                            <IconOutline.DocumentAddIcon aria-hidden='true' />
                            {urlMode ? 'Required Link' : 'Required Files'}
                        </h3>
                        {urlMode ? (
                            <p>
                                Provide a direct link to the solution requested in the Requirements tab and keep it
                                accessible throughout review.
                            </p>
                        ) : designChallenge ? (
                            <ul className={styles.requiredFiles}>
                                <li>
                                    <FileTypeIcon extension='ZIP' />
                                    Source folder zip file
                                </li>
                                <li>
                                    <FileTypeIcon extension='ZIP' />
                                    Submission folder zip file
                                </li>
                                <li>
                                    <FileTypeIcon extension='TXT' />
                                    Declarations txt file
                                </li>
                                <li>
                                    <FileTypeIcon extension='JPG' />
                                    Preview jpg image
                                </li>
                            </ul>
                        ) : (
                            <p>
                                Please follow the instructions on the Requirements tab regarding what your submission
                                should contain and how it should be organized.
                            </p>
                        )}
                        <button
                            className={styles.textButton}
                            disabled={uploading}
                            onClick={props.onShowRequirements}
                            type='button'
                        >
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
                            {urlMode ? (
                                <>
                                    <li>
                                        <IconOutline.SunIcon aria-hidden='true' />
                                        Link directly to your challenge deliverable
                                    </li>
                                    <li>
                                        <IconOutline.SunIcon aria-hidden='true' />
                                        Use a link that challenge reviewers can access
                                    </li>
                                    <li>
                                        <IconOutline.SunIcon aria-hidden='true' />
                                        Keep access available throughout review
                                    </li>
                                    <li>
                                        <IconOutline.SunIcon aria-hidden='true' />
                                        Follow all challenge submission guidelines
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li>
                                        <IconOutline.SunIcon aria-hidden='true' />
                                        Upload a single ZIP file only
                                    </li>
                                    <li>
                                        <IconOutline.SunIcon aria-hidden='true' />
                                        Do not password protect the files
                                    </li>
                                    <li>
                                        <IconOutline.SunIcon aria-hidden='true' />
                                        Include all files as per guidelines
                                    </li>
                                    <li>
                                        <IconOutline.SunIcon aria-hidden='true' />
                                        Keep your handle out of your files and file names
                                    </li>
                                </>
                            )}
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
                            {urlMode ? (
                                <div className={styles.urlSubmission}>
                                    <label htmlFor='challenge-submission-url'>
                                        Submission URL
                                        <span>*</span>
                                    </label>
                                    <div className={styles.urlInputRow}>
                                        <input
                                            aria-describedby={error
                                                ? 'challenge-submission-url-help challenge-submission-url-error'
                                                : 'challenge-submission-url-help'}
                                            aria-invalid={!!error}
                                            autoComplete='url'
                                            disabled={uploading}
                                            id='challenge-submission-url'
                                            onChange={changeUrl}
                                            placeholder='https://example.com/your-solution'
                                            type='url'
                                            value={urlInput}
                                        />
                                        <button
                                            className={styles.setUrlButton}
                                            disabled={uploading}
                                            onClick={confirmUrl}
                                            type='button'
                                        >
                                            Set URL
                                        </button>
                                    </div>
                                    <small id='challenge-submission-url-help'>
                                        Enter an absolute URL beginning with http:// or https://.
                                    </small>
                                    {error && (
                                        <p className={styles.error} id='challenge-submission-url-error' role='alert'>
                                            {error}
                                        </p>
                                    )}
                                </div>
                            ) : (
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
                            )}
                            {file && (
                                <div className={styles.uploadedFile}>
                                    <strong aria-live='polite'>{uploading ? 'Uploading' : 'Ready to upload'}</strong>
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
                                            onClick={clearSelection}
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
                            {submissionUrl && (
                                <div className={styles.uploadedFile}>
                                    <strong aria-live='polite'>
                                        {uploading ? 'Submitting URL' : 'Ready to submit'}
                                    </strong>
                                    <div className={styles.fileRow}>
                                        <IconOutline.LinkIcon aria-hidden='true' />
                                        <div className={styles.fileCopy}>
                                            <strong>{submissionUrl}</strong>
                                            <span>Submission URL</span>
                                        </div>
                                        <button
                                            aria-label={uploading ? 'Cancel submission' : 'Clear submission URL'}
                                            onClick={clearSelection}
                                            type='button'
                                        >
                                            {uploading
                                                ? <IconOutline.XIcon aria-hidden='true' />
                                                : <IconOutline.TrashIcon aria-hidden='true' />}
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className={styles.declaration}>
                                <h3>Declaration</h3>
                                <p>
                                    {urlMode
                                        ? 'Submitting your link means you hereby agree to the'
                                        : 'Submitting your files means you hereby agree to the'}
                                    {' '}
                                    <a
                                        className={styles.inlineButton}
                                        href={EnvironmentConfig.URLS.TERMS_OF_USE}
                                        rel='noreferrer'
                                        target='_blank'
                                    >
                                        Topcoder Terms of Use
                                    </a>
                                    {' '}
                                    {urlMode
                                        ? 'and to the extent your linked solution wins a Topcoder competition, '
                                        : 'and to the extent your uploaded file wins a Topcoder competition, '}
                                    you hereby assign, grant and transfer and agree to assign, grant and transfer to
                                    Topcoder all right and title in and to the Winning Submission (as further described
                                    in the terms of use).
                                </p>
                            </div>
                            <label className={styles.agreement}>
                                <input
                                    checked={agreementAccepted}
                                    disabled={!selectionReady || uploading}
                                    onChange={event => setAgreementAccepted(event.target.checked)}
                                    type='checkbox'
                                />
                                <span>I understand and agree</span>
                            </label>
                            <div className={styles.divider} />
                            <div className={styles.actions}>
                                <button
                                    className={styles.secondaryButton}
                                    disabled={uploading}
                                    onClick={props.onBack}
                                    type='button'
                                >
                                    Cancel
                                </button>
                                <button
                                    className={styles.primaryButton}
                                    data-analytics-id='challenge-submit-confirm'
                                    data-analytics-placement='challenge-submission'
                                    disabled={!selectionReady || !agreementAccepted || uploading}
                                    onClick={submit}
                                    type='button'
                                >
                                    {urlMode
                                        ? <IconOutline.LinkIcon aria-hidden='true' />
                                        : <IconOutline.UploadIcon aria-hidden='true' />}
                                    {uploading ? (urlMode ? 'Submitting…' : 'Uploading…') : 'Submit'}
                                </button>
                            </div>
                        </>
                    )}
                </section>
            </div>
        </div>
    )
}
