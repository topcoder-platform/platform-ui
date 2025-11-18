/**
 * Manage Submission Page.
 */
import { FC, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import classNames from 'classnames'

import { LinkButton } from '~/libs/ui'

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
    PageWrapper,
    SubmissionTable,
    TableLoading,
    TableNoRecord,
} from '../../lib'
import { checkIsMM, getSubmissionReprocessTopic } from '../../lib/utils'

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

    return (
        <PageWrapper
            pageTitle='Submission Management'
            className={classNames(styles.container, props.className)}
            headerActions={(
                <LinkButton primary light to='./../..' size='lg'>
                    Back
                </LinkButton>
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
        </PageWrapper>
    )
}

export default ManageSubmissionPage
