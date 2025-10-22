import {
    FC,
    useCallback,
    useMemo,
    useState,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import _ from 'lodash'
import classNames from 'classnames'

import { Button, LinkButton, ProgressBar } from '~/libs/ui'

import {
    ActionLoading,
    PageWrapper,
    TableLoading,
    TableNoRecord,
} from '../../lib'
import { ConfirmModal } from '../../lib/components'
import {
    useDownloadSubmission,
    useDownloadSubmissionProps,
    useManageBusEvent,
    useManageBusEventProps,
    useManageMarathonMatch,
    useManageMarathonMatchProps,
} from '../../lib/hooks'
import { IsRemovingType } from '../../lib/models'
import { removeReviewSummations } from '../../lib/services/reviews.service'
import { removeSubmission } from '../../lib/services/submissions.service'
import { closeMarathonMatch } from '../../lib/services/challenges.service'
import { handleError } from '../../lib/utils'

import { MarathonMatchScoreTable } from './MarathonMatchScoreTable'
import styles from './ManageMarathonMatchPage.module.scss'

interface Props {
    className?: string
}

export const ManageMarathonMatchPage: FC<Props> = (props: Props) => {
    const { challengeId = '' }: { challengeId?: string }
        = useParams<{ challengeId: string }>()
    const navigate = useNavigate()

    const {
        error,
        finalScoresData,
        isLoading,
        provisionalScores,
        submissions,
    }: useManageMarathonMatchProps = useManageMarathonMatch(challengeId)

    const {
        doPostBusEvent,
        isRunningTest,
        isRunningTestBool,
    }: useManageBusEventProps = useManageBusEvent()

    const {
        downloadSubmission,
        isLoading: isDownloadingSubmission,
        isLoadingBool: isDownloadingSubmissionBool,
    }: useDownloadSubmissionProps = useDownloadSubmission()

    const [isRemovingSubmission, setIsRemovingSubmission]
        = useState<IsRemovingType>({})
    const isRemovingSubmissionBool = useMemo(
        () => _.some(isRemovingSubmission, value => value === true),
        [isRemovingSubmission],
    )

    const [isRemovingReviewSummations, setIsRemovingReviewSummations]
        = useState<IsRemovingType>({})
    const isRemovingReviewSummationsBool = useMemo(
        () => _.some(isRemovingReviewSummations, value => value === true),
        [isRemovingReviewSummations],
    )

    const [showRunAllTestsConfirm, setShowRunAllTestsConfirm]
        = useState<boolean>(false)
    const [showCloseConfirm, setShowCloseConfirm]
        = useState<boolean>(false)
    const [showCloseError, setShowCloseError]
        = useState<boolean>(false)
    const [isRunningAllTests, setIsRunningAllTests]
        = useState<boolean>(false)
    const [runAllTestsProgress, setRunAllTestsProgress] = useState<{ current: number; total: number }>({
        current: 0,
        total: 0,
    })
    const [isClosingChallenge, setIsClosingChallenge]
        = useState<boolean>(false)

    const doRemoveSubmission = useCallback(
        (submissionId: string) => {
            if (!submissionId) {
                return
            }

            setIsRemovingSubmission(prev => ({
                ...prev,
                [submissionId]: true,
            }))

            removeSubmission(submissionId)
                .then(() => {
                    toast.success('Submission removed successfully', {
                        toastId: 'Remove submission',
                    })
                })
                .catch(handleError)
                .finally(() => {
                    setIsRemovingSubmission(prev => ({
                        ...prev,
                        [submissionId]: false,
                    }))
                })
        },
        [],
    )

    const doRemoveReviewSummations = useCallback(
        (reviewSummationId?: string) => {
            if (!reviewSummationId) {
                return
            }

            setIsRemovingReviewSummations(prev => ({
                ...prev,
                [reviewSummationId]: true,
            }))

            removeReviewSummations([reviewSummationId])
                .then(() => {
                    toast.success('Review summation removed successfully', {
                        toastId: 'Remove review summation',
                    })
                })
                .catch(handleError)
                .finally(() => {
                    setIsRemovingReviewSummations(prev => ({
                        ...prev,
                        [reviewSummationId]: false,
                    }))
                })
        },
        [],
    )

    const handleRunAllSystemTests = useCallback(() => {
        setShowRunAllTestsConfirm(true)
    }, [])

    const dismissRunAllTestsConfirm = useCallback(() => {
        setShowRunAllTestsConfirm(false)
    }, [])

    const noop = useCallback(() => undefined, [])

    const handleConfirmRunAllTests = useCallback(async () => {
        const submissionIds = submissions
            .map(submission => submission.id)
            .filter(Boolean)

        setShowRunAllTestsConfirm(false)
        if (!submissionIds.length) {
            toast.info('No submissions available for system tests', {
                toastId: 'Run all system tests',
            })
            return
        }

        setIsRunningAllTests(true)
        setRunAllTestsProgress({ current: 0, total: submissionIds.length })

        let hasError = false

        for (let index = 0; index < submissionIds.length; index += 1) {
            const submissionId = submissionIds[index]

            try {
                // Ensure sequential updates for progress tracking
                // eslint-disable-next-line no-await-in-loop
                await doPostBusEvent(submissionId, 'system', { silent: true })
            } catch (err) {
                hasError = true
                handleError(err)
            } finally {
                setRunAllTestsProgress({
                    current: index + 1,
                    total: submissionIds.length,
                })
            }
        }

        setIsRunningAllTests(false)

        if (hasError) {
            toast.error('Some system tests failed to queue. Please review the errors and retry as needed.', {
                toastId: 'Run all system tests error',
            })
            return
        }

        toast.success('All system tests have been queued successfully', {
            toastId: 'Run all system tests',
        })
    }, [doPostBusEvent, submissions])

    const handleCloseChallenge = useCallback(() => {
        const hasIncompleteFinalScores = finalScoresData.some(item => !item.reviewSummation)

        if (hasIncompleteFinalScores) {
            setShowCloseError(true)
            return
        }

        setShowCloseConfirm(true)
    }, [finalScoresData])

    const dismissCloseConfirmModal = useCallback(() => {
        setShowCloseConfirm(false)
    }, [])

    const dismissCloseErrorModal = useCallback(() => {
        setShowCloseError(false)
    }, [])

    const handleConfirmCloseChallenge = useCallback(async () => {
        setIsClosingChallenge(true)
        setShowCloseConfirm(false)

        try {
            await closeMarathonMatch(challengeId)
            toast.success('Challenge closed successfully', {
                toastId: 'Close marathon match challenge',
            })
            // TODO: Confirm the appropriate post-close destination once the navigation flow is finalized.
            navigate('../..')
        } catch (err) {
            handleError(err)
        } finally {
            setIsClosingChallenge(false)
        }
    }, [challengeId, navigate])

    const isActionInProgress = useMemo(
        () => (
            isDownloadingSubmissionBool
            || isRemovingSubmissionBool
            || isRunningTestBool
            || isRemovingReviewSummationsBool
            || isRunningAllTests
            || isClosingChallenge
        ),
        [
            isDownloadingSubmissionBool,
            isRemovingReviewSummationsBool,
            isRemovingSubmissionBool,
            isRunningTestBool,
            isClosingChallenge,
            isRunningAllTests,
        ],
    )

    const renderScoresSection = (
        heading: string,
        content: JSX.Element,
        hasRecords: boolean,
    ): JSX.Element => (
        <section className={styles.tableSection}>
            <h3 className={styles.sectionHeading}>{heading}</h3>
            {hasRecords ? content : <TableNoRecord />}
        </section>
    )

    let pageContent: JSX.Element | undefined

    if (isLoading) {
        pageContent = <TableLoading />
    } else if (error) {
        pageContent = (
            <div className={styles.errorMessage}>
                {error.message || 'Unable to load marathon match data.'}
            </div>
        )
    } else {
        pageContent = (
            <>
                {renderScoresSection(
                    'Provisional Scores',
                    (
                        <MarathonMatchScoreTable
                            data={provisionalScores}
                            testType='provisional'
                            isRunningTest={isRunningTest}
                            doPostBusEvent={doPostBusEvent}
                            isRemovingSubmission={isRemovingSubmission}
                            doRemoveSubmission={doRemoveSubmission}
                            doRemoveReviewSummations={doRemoveReviewSummations}
                            isRemovingReviewSummations={isRemovingReviewSummations}
                            isDownloadingSubmission={isDownloadingSubmission}
                            downloadSubmission={downloadSubmission}
                        />
                    ),
                    provisionalScores.length > 0,
                )}

                {renderScoresSection(
                    'Final Scores',
                    (
                        <MarathonMatchScoreTable
                            data={finalScoresData}
                            testType='system'
                            isFinalScores
                            isRunningTest={isRunningTest}
                            doPostBusEvent={doPostBusEvent}
                            isRemovingSubmission={isRemovingSubmission}
                            doRemoveSubmission={doRemoveSubmission}
                            doRemoveReviewSummations={doRemoveReviewSummations}
                            isRemovingReviewSummations={isRemovingReviewSummations}
                            isDownloadingSubmission={isDownloadingSubmission}
                            downloadSubmission={downloadSubmission}
                        />
                    ),
                    finalScoresData.length > 0,
                )}
            </>
        )
    }

    return (
        <PageWrapper
            pageTitle='Marathon Match Management'
            className={classNames(styles.container, props.className)}
            headerActions={(
                <div className={styles.headerButtons}>
                    <Button
                        primary
                        size='lg'
                        disabled={isRunningAllTests || isClosingChallenge}
                        onClick={handleRunAllSystemTests}
                    >
                        Run all system tests
                    </Button>
                    <Button
                        size='lg'
                        disabled={isRunningAllTests || isClosingChallenge}
                        onClick={handleCloseChallenge}
                    >
                        Close challenge
                    </Button>
                    <LinkButton primary light to='./../..' size='lg'>
                        Back
                    </LinkButton>
                </div>
            )}
        >
            {pageContent}

            {isActionInProgress && !isRunningAllTests && <ActionLoading />}

            {showRunAllTestsConfirm && (
                <ConfirmModal
                    open={showRunAllTestsConfirm}
                    onClose={dismissRunAllTestsConfirm}
                    onConfirm={handleConfirmRunAllTests}
                    title='Run All System Tests'
                    action='Run Tests'
                >
                    <p>
                        Are you sure you want to run system tests for this challenge?
                        {' '}
                        This will overwrite any existing system tests run for these submissions.
                    </p>
                    <p>
                        {submissions.length}
                        {' '}
                        submission(s) will be tested.
                    </p>
                </ConfirmModal>
            )}

            {isRunningAllTests && (
                <ConfirmModal
                    open={isRunningAllTests}
                    onClose={noop}
                    onConfirm={noop}
                    title='Running System Tests'
                    showButtons={false}
                >
                    <p>
                        Queueing system tests:
                        {' '}
                        {runAllTestsProgress.current}
                        {' '}
                        of
                        {' '}
                        {runAllTestsProgress.total}
                    </p>
                    <ProgressBar
                        progress={runAllTestsProgress.total > 0
                            ? runAllTestsProgress.current / runAllTestsProgress.total
                            : 0}
                    />
                </ConfirmModal>
            )}

            {showCloseConfirm && (
                <ConfirmModal
                    open={showCloseConfirm}
                    onClose={dismissCloseConfirmModal}
                    onConfirm={handleConfirmCloseChallenge}
                    title='Close Challenge'
                    action='Close'
                    isLoading={isClosingChallenge}
                >
                    Are you sure you want to close this challenge?
                    {' '}
                    This will finalize the results and determine winners based on final scores.
                </ConfirmModal>
            )}

            {showCloseError && (
                <ConfirmModal
                    open={showCloseError}
                    onClose={dismissCloseErrorModal}
                    onConfirm={dismissCloseErrorModal}
                    title='Cannot Close Challenge'
                    showButtons={false}
                >
                    <p>Final system tests are not complete. Please wait until all tests have finished and try again.</p>
                    <div>
                        <Button
                            primary
                            size='lg'
                            onClick={dismissCloseErrorModal}
                        >
                            OK
                        </Button>
                    </div>
                </ConfirmModal>
            )}
        </PageWrapper>
    )
}

export default ManageMarathonMatchPage
