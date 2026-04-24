/**
 * Manage Submission Page.
 */
import {
    ChangeEvent,
    FC,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import {
    BaseModal,
    Button,
    LinkButton,
    LoadingSpinner,
} from '~/libs/ui'

import {
    useDownloadSubmission,
    useDownloadSubmissionProps,
    useFetchChallenge,
    useFetchChallengeProps,
    useManageAVScan,
    useManageAVScanProps,
    useManageBusEvent,
    useManageBusEventProps,
    useManageChallengeSubmissions,
    useManageChallengeSubmissionsProps,
    useManageSubmissionReprocess,
    useManageSubmissionReprocessProps,
} from '../../lib/hooks'
import {
    ActionLoading,
    FieldSingleSelect,
    PageWrapper,
    SubmissionTable,
    TableLoading,
    TableNoRecord,
} from '../../lib'
import { SelectOption } from '../../lib/models'
import {
    getChallengeSubmitterResources,
    uploadManualSubmission,
} from '../../lib/services'
import {
    checkIsMM,
    getSubmissionReprocessTopic,
    handleError,
    resolveManualUploadSubmissionType,
} from '../../lib/utils'

import styles from './ManageSubmissionPage.module.scss'

interface Props {
    className?: string
}

interface SubmissionsContentProps {
    isLoading: boolean
    submissions: useManageChallengeSubmissionsProps['submissions']
    isDoingAvScan: useManageAVScanProps['isLoading']
    doPostBusEventAvScan: useManageAVScanProps['doPostBusEvent']
    isDownloadingSubmission: useDownloadSubmissionProps['isLoading']
    downloadSubmission: useDownloadSubmissionProps['downloadSubmission']
    isRemovingSubmission: useManageChallengeSubmissionsProps['isRemovingSubmission']
    doRemoveSubmission: useManageChallengeSubmissionsProps['doRemoveSubmission']
    isRemovingReviewSummations: useManageChallengeSubmissionsProps['isRemovingReviewSummations']
    doRemoveReviewSummations: useManageChallengeSubmissionsProps['doRemoveReviewSummations']
    isRunningTest: useManageBusEventProps['isRunningTest']
    doPostBusEvent: useManageBusEventProps['doPostBusEvent']
    showSubmissionHistory: useManageChallengeSubmissionsProps['showSubmissionHistory']
    setShowSubmissionHistory: useManageChallengeSubmissionsProps['setShowSubmissionHistory']
    isMM: boolean
    isReprocessingSubmission: useManageSubmissionReprocessProps['isLoading']
    doReprocessSubmission: useManageSubmissionReprocessProps['doReprocessSubmission']
    canReprocessSubmission: boolean
    isDoingAvScanBool: useManageAVScanProps['isLoadingBool']
    isDownloadingSubmissionBool: useDownloadSubmissionProps['isLoadingBool']
    isRemovingSubmissionBool: useManageChallengeSubmissionsProps['isRemovingSubmissionBool']
    isRunningTestBool: useManageBusEventProps['isRunningTestBool']
    isRemovingReviewSummationsBool: useManageChallengeSubmissionsProps['isRemovingReviewSummationsBool']
    isReprocessingSubmissionBool: useManageSubmissionReprocessProps['isLoadingBool']
}

interface ManualSubmissionUploadModalProps {
    open: boolean
    onClose: () => void
    selectedHandle?: SelectOption
    setSelectedHandle: (value: SelectOption) => void
    isUploading: boolean
    isLoadingChallenge: boolean
    isLoadingSubmitters: boolean
    submissionTypeLabel: string
    submitterOptions: SelectOption[]
    handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void
    selectedFile?: File
    handleUploadSubmission: () => void
}

/**
 * Renders the submission table area, including loading and empty states, for
 * the submission management page.
 * @param {SubmissionsContentProps} props submission data and action state.
 * @returns {JSX.Element} the submission management content for the page body.
 */
const SubmissionsContent: FC<SubmissionsContentProps> = (
    props: SubmissionsContentProps,
) => {
    const shouldShowActionLoading = props.isDoingAvScanBool
        || props.isDownloadingSubmissionBool
        || props.isRemovingSubmissionBool
        || props.isRunningTestBool
        || props.isRemovingReviewSummationsBool
        || props.isReprocessingSubmissionBool

    if (props.isLoading) {
        return <TableLoading />
    }

    if (props.submissions.length === 0) {
        return <TableNoRecord />
    }

    return (
        <div className={styles.blockTableContainer}>
            <SubmissionTable
                isDoingAvScan={props.isDoingAvScan}
                doPostBusEventAvScan={props.doPostBusEventAvScan}
                isDownloading={props.isDownloadingSubmission}
                downloadSubmission={props.downloadSubmission}
                data={props.submissions}
                isRemovingSubmission={props.isRemovingSubmission}
                doRemoveSubmission={props.doRemoveSubmission}
                isRemovingReviewSummations={props.isRemovingReviewSummations}
                doRemoveReviewSummations={props.doRemoveReviewSummations}
                isRunningTest={props.isRunningTest}
                doPostBusEvent={props.doPostBusEvent}
                showSubmissionHistory={props.showSubmissionHistory}
                setShowSubmissionHistory={props.setShowSubmissionHistory}
                isMM={props.isMM}
                isReprocessingSubmission={props.isReprocessingSubmission}
                doReprocessSubmission={props.doReprocessSubmission}
                canReprocessSubmission={props.canReprocessSubmission}
            />

            {shouldShowActionLoading && <ActionLoading />}
        </div>
    )
}

/**
 * Renders the manual submission upload dialog with challenge-scoped submitter
 * options so admins can only select registered submitter resources.
 * @param {ManualSubmissionUploadModalProps} props upload form state and handlers.
 * @returns {JSX.Element} the upload dialog for manual submission imports.
 */
const ManualSubmissionUploadModal: FC<ManualSubmissionUploadModalProps> = (
    props: ManualSubmissionUploadModalProps,
) => {
    const isHandleSelectDisabled = props.isUploading
        || props.isLoadingChallenge
        || props.isLoadingSubmitters
        || props.submitterOptions.length === 0
    const memberHandleHint = !props.isLoadingSubmitters
        && props.submitterOptions.length === 0
        ? 'No submitter resources are registered for this challenge.'
        : undefined
    const memberHandlePlaceholder = props.isLoadingSubmitters
        ? 'Loading submitter handles...'
        : 'Start typing a handle'

    return (
        <BaseModal
            title='Upload Submission'
            size='lg'
            open={props.open}
            onClose={props.onClose}
        >
            <div className={styles.uploadForm}>
                <div className={styles.uploadFormFields}>
                    <div className={styles.fileInputContainer}>
                        <span className={styles.inputLabel}>
                            Submission type
                        </span>
                        <span className={styles.selectedFile}>
                            {props.isLoadingChallenge
                                ? 'Loading challenge phases...'
                                : props.submissionTypeLabel}
                        </span>
                    </div>
                    <FieldSingleSelect
                        label='Member Handle'
                        hint={memberHandleHint}
                        placeholder={memberHandlePlaceholder}
                        value={props.selectedHandle}
                        onChange={props.setSelectedHandle}
                        disabled={isHandleSelectDisabled}
                        isLoading={props.isLoadingSubmitters}
                        options={props.submitterOptions}
                    />
                    <div className={styles.fileInputContainer}>
                        <label
                            htmlFor='manual-submission-file'
                            className={styles.inputLabel}
                        >
                            Submission file
                        </label>
                        <input
                            id='manual-submission-file'
                            className={styles.fileInput}
                            type='file'
                            onChange={props.handleFileChange}
                            disabled={props.isUploading}
                        />
                        {props.selectedFile && (
                            <span className={styles.selectedFile}>
                                {props.selectedFile.name}
                            </span>
                        )}
                    </div>
                </div>
                <div className={styles.actionButtons}>
                    <Button
                        secondary
                        size='lg'
                        onClick={props.onClose}
                        disabled={props.isUploading}
                    >
                        Cancel
                    </Button>
                    <Button
                        primary
                        size='lg'
                        onClick={props.handleUploadSubmission}
                        disabled={
                            props.isUploading
                            || props.isLoadingChallenge
                            || props.isLoadingSubmitters
                            || !props.selectedHandle?.value
                            || !props.selectedFile
                        }
                    >
                        Upload
                    </Button>
                </div>

                {props.isUploading && (
                    <div className={styles.dialogLoadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                )}
            </div>
        </BaseModal>
    )
}

export const ManageSubmissionPage: FC<Props> = (props: Props) => {
    const { challengeId = '' }: { challengeId?: string } = useParams<{
        challengeId: string
    }>()
    const { isRunningTest, isRunningTestBool, doPostBusEvent }: useManageBusEventProps
        = useManageBusEvent()

    const {
        isLoading: isLoadingChallenge,
        challengeInfo,
    }: useFetchChallengeProps = useFetchChallenge(challengeId)
    const isMM = useMemo(() => checkIsMM(challengeInfo), [challengeInfo])
    const manualUploadSubmissionType = useMemo(
        () => resolveManualUploadSubmissionType(challengeInfo),
        [challengeInfo],
    )
    const manualUploadSubmissionTypeLabel = useMemo(
        () => (
            manualUploadSubmissionType === 'CHECKPOINT_SUBMISSION'
                ? 'Checkpoint Submission'
                : 'Submission'
        ),
        [manualUploadSubmissionType],
    )
    const submissionReprocessTopic = useMemo(
        () => getSubmissionReprocessTopic(challengeInfo),
        [challengeInfo],
    )

    const {
        isLoading: isLoadingSubmission,
        submissions,
        isRemovingSubmission,
        isRemovingSubmissionBool,
        isRemovingReviewSummations,
        isRemovingReviewSummationsBool,
        doRemoveSubmission,
        doRemoveReviewSummations,
        showSubmissionHistory,
        setShowSubmissionHistory,
        refresh,
    }: useManageChallengeSubmissionsProps
        = useManageChallengeSubmissions(challengeId)

    const {
        isLoading: isDownloadingSubmission,
        isLoadingBool: isDownloadingSubmissionBool,
        downloadSubmission,
    }: useDownloadSubmissionProps = useDownloadSubmission()
    const {
        isLoading: isDoingAvScan,
        isLoadingBool: isDoingAvScanBool,
        doPostBusEvent: doPostBusEventAvScan,
    }: useManageAVScanProps = useManageAVScan()
    const {
        isLoading: isReprocessingSubmission,
        isLoadingBool: isReprocessingSubmissionBool,
        doReprocessSubmission,
    }: useManageSubmissionReprocessProps
        = useManageSubmissionReprocess(submissionReprocessTopic)

    const isLoading = isLoadingSubmission || isLoadingChallenge
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
    const [selectedHandle, setSelectedHandle]
        = useState<SelectOption>()
    const [selectedFile, setSelectedFile] = useState<File>()
    const [isUploading, setIsUploading] = useState(false)
    const [submitterOptions, setSubmitterOptions] = useState<SelectOption[]>([])
    const [isLoadingSubmitters, setIsLoadingSubmitters] = useState(false)

    const resetUploadForm = useCallback(() => {
        setSelectedHandle(undefined)
        setSelectedFile(undefined)
    }, [])

    const openUploadModal = useCallback(() => {
        setIsUploadModalOpen(true)
    }, [])

    const closeUploadModal = useCallback(() => {
        if (isUploading) {
            return
        }

        setIsUploadModalOpen(false)
        resetUploadForm()
    }, [isUploading, resetUploadForm])

    const handleFileChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const nextFile = event.target.files?.[0]
            setSelectedFile(nextFile ?? undefined)
        },
        [],
    )

    const handleUploadSubmission = useCallback(async () => {
        if (
            !challengeId
            || !challengeInfo
            || !selectedFile
            || !selectedHandle?.value
        ) {
            return
        }

        try {
            setIsUploading(true)
            await uploadManualSubmission({
                challengeId,
                file: selectedFile,
                fileName: selectedFile.name,
                memberHandle: String(selectedHandle.label),
                memberId: selectedHandle.value,
                type: manualUploadSubmissionType,
            })

            toast.success('Submission uploaded successfully', {
                toastId: 'Manual submission upload',
            })
            setIsUploadModalOpen(false)
            resetUploadForm()
            refresh()
        } catch (error) {
            handleError(error)
        } finally {
            setIsUploading(false)
        }
    }, [
        challengeId,
        challengeInfo,
        manualUploadSubmissionType,
        refresh,
        resetUploadForm,
        selectedFile,
        selectedHandle,
    ])

    useEffect(() => {
        let isCancelled = false

        if (!challengeId) {
            setSubmitterOptions([])
            setSelectedHandle(undefined)
            return undefined
        }

        setIsLoadingSubmitters(true)

        const loadSubmitters = async (): Promise<void> => {
            try {
                const submitters = await getChallengeSubmitterResources(challengeId)
                if (isCancelled) {
                    return
                }

                const nextOptions = submitters.map(submitter => ({
                    label: submitter.memberHandle,
                    value: submitter.memberId,
                }))
                setSubmitterOptions(nextOptions)
                setSelectedHandle(currentValue => (
                    currentValue && nextOptions.some(
                        option => option.value === currentValue.value,
                    )
                        ? currentValue
                        : undefined
                ))
            } catch (error) {
                if (!isCancelled) {
                    setSubmitterOptions([])
                    setSelectedHandle(undefined)
                    handleError(error)
                }
            } finally {
                if (!isCancelled) {
                    setIsLoadingSubmitters(false)
                }
            }
        }

        loadSubmitters()

        return () => {
            isCancelled = true
        }
    }, [challengeId])

    return (
        <PageWrapper
            pageTitle='Submission Management'
            className={classNames(styles.container, props.className)}
            headerActions={(
                <div className={styles.headerButtons}>
                    <Button
                        primary
                        size='lg'
                        disabled={isUploading || isLoadingChallenge || !challengeInfo}
                        onClick={openUploadModal}
                    >
                        Upload submission
                    </Button>
                    <LinkButton primary light to='./../..' size='lg'>
                        Back
                    </LinkButton>
                </div>
            )}
        >
            <SubmissionsContent
                isLoading={isLoading}
                submissions={submissions}
                isDoingAvScan={isDoingAvScan}
                doPostBusEventAvScan={doPostBusEventAvScan}
                isDownloadingSubmission={isDownloadingSubmission}
                downloadSubmission={downloadSubmission}
                isRemovingSubmission={isRemovingSubmission}
                doRemoveSubmission={doRemoveSubmission}
                isRemovingReviewSummations={isRemovingReviewSummations}
                doRemoveReviewSummations={doRemoveReviewSummations}
                isRunningTest={isRunningTest}
                doPostBusEvent={doPostBusEvent}
                showSubmissionHistory={showSubmissionHistory}
                setShowSubmissionHistory={setShowSubmissionHistory}
                isMM={isMM}
                isReprocessingSubmission={isReprocessingSubmission}
                doReprocessSubmission={doReprocessSubmission}
                canReprocessSubmission={Boolean(submissionReprocessTopic)}
                isDoingAvScanBool={isDoingAvScanBool}
                isDownloadingSubmissionBool={isDownloadingSubmissionBool}
                isRemovingSubmissionBool={isRemovingSubmissionBool}
                isRunningTestBool={isRunningTestBool}
                isRemovingReviewSummationsBool={isRemovingReviewSummationsBool}
                isReprocessingSubmissionBool={isReprocessingSubmissionBool}
            />

            <ManualSubmissionUploadModal
                open={isUploadModalOpen}
                onClose={closeUploadModal}
                selectedHandle={selectedHandle}
                setSelectedHandle={setSelectedHandle}
                isUploading={isUploading}
                isLoadingChallenge={isLoadingChallenge}
                isLoadingSubmitters={isLoadingSubmitters}
                submissionTypeLabel={manualUploadSubmissionTypeLabel}
                submitterOptions={submitterOptions}
                handleFileChange={handleFileChange}
                selectedFile={selectedFile}
                handleUploadSubmission={handleUploadSubmission}
            />
        </PageWrapper>
    )
}

export default ManageSubmissionPage
