/**
 * Manage Submission Page.
 */
import {
    ChangeEvent,
    FC,
    useCallback,
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
    FieldHandleSelect,
    PageWrapper,
    SubmissionTable,
    TableLoading,
    TableNoRecord,
} from '../../lib'
import { SelectOption } from '../../lib/models'
import { uploadManualSubmission } from '../../lib/services'
import {
    checkIsMM,
    getSubmissionReprocessTopic,
    handleError,
} from '../../lib/utils'

import styles from './ManageSubmissionPage.module.scss'

interface Props {
    className?: string
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
        if (!challengeId || !selectedFile || !selectedHandle?.value) {
            return
        }

        try {
            setIsUploading(true)
            await uploadManualSubmission({
                challengeId,
                file: selectedFile,
                fileName: selectedFile.name,
                memberId: selectedHandle.value,
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
    }, [challengeId, selectedFile, selectedHandle, resetUploadForm, refresh])

    return (
        <PageWrapper
            pageTitle='Submission Management'
            className={classNames(styles.container, props.className)}
            headerActions={(
                <div className={styles.headerButtons}>
                    <Button
                        primary
                        size='lg'
                        disabled={isUploading}
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
            {isLoading ? (
                <TableLoading />
            ) : (
                <>
                    {submissions.length === 0 ? (
                        <TableNoRecord />
                    ) : (
                        <div className={styles.blockTableContainer}>
                            <SubmissionTable
                                isDoingAvScan={isDoingAvScan}
                                doPostBusEventAvScan={doPostBusEventAvScan}
                                isDownloading={isDownloadingSubmission}
                                downloadSubmission={downloadSubmission}
                                data={submissions}
                                isRemovingSubmission={isRemovingSubmission}
                                doRemoveSubmission={doRemoveSubmission}
                                isRemovingReviewSummations={
                                    isRemovingReviewSummations
                                }
                                doRemoveReviewSummations={
                                    doRemoveReviewSummations
                                }
                                isRunningTest={isRunningTest}
                                doPostBusEvent={doPostBusEvent}
                                showSubmissionHistory={showSubmissionHistory}
                                setShowSubmissionHistory={setShowSubmissionHistory}
                                isMM={isMM}
                                isReprocessingSubmission={
                                    isReprocessingSubmission
                                }
                                doReprocessSubmission={doReprocessSubmission}
                                canReprocessSubmission={Boolean(
                                    submissionReprocessTopic,
                                )}
                            />

                            {(isDoingAvScanBool
                                || isDownloadingSubmissionBool
                                || isRemovingSubmissionBool
                                || isRunningTestBool
                                || isRemovingReviewSummationsBool
                                || isReprocessingSubmissionBool) && (
                                <ActionLoading />
                            )}
                        </div>
                    )}
                </>
            )}

            <BaseModal
                title='Upload Submission'
                size='lg'
                open={isUploadModalOpen}
                onClose={closeUploadModal}
            >
                <div className={styles.uploadForm}>
                    <div className={styles.uploadFormFields}>
                        <FieldHandleSelect
                            label='Member Handle'
                            placeholder='Start typing a handle'
                            value={selectedHandle}
                            onChange={setSelectedHandle}
                            disabled={isUploading}
                            isLoading={isUploading}
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
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />
                            {selectedFile && (
                                <span className={styles.selectedFile}>
                                    {selectedFile.name}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className={styles.actionButtons}>
                        <Button
                            secondary
                            size='lg'
                            onClick={closeUploadModal}
                            disabled={isUploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            primary
                            size='lg'
                            onClick={handleUploadSubmission}
                            disabled={
                                isUploading
                                || !selectedHandle?.value
                                || !selectedFile
                            }
                        >
                            Upload
                        </Button>
                    </div>

                    {isUploading && (
                        <div className={styles.dialogLoadingSpinnerContainer}>
                            <LoadingSpinner className={styles.spinner} />
                        </div>
                    )}
                </div>
            </BaseModal>
        </PageWrapper>
    )
}

export default ManageSubmissionPage
