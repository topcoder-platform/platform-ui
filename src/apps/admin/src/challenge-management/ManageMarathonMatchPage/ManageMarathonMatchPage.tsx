import {
    FC,
    useCallback,
    useMemo,
    useState,
} from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import _ from 'lodash'
import classNames from 'classnames'

import { Button, LinkButton } from '~/libs/ui'

import {
    ActionLoading,
    PageWrapper,
    TableLoading,
    TableNoRecord,
} from '../../lib'
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
import { handleError } from '../../lib/utils'

import { MarathonMatchScoreTable } from './MarathonMatchScoreTable'
import styles from './ManageMarathonMatchPage.module.scss'

interface Props {
    className?: string
}

export const ManageMarathonMatchPage: FC<Props> = (props: Props) => {
    const { challengeId = '' }: { challengeId?: string }
        = useParams<{ challengeId: string }>()

    const {
        error,
        finalScoresData,
        isLoading,
        provisionalScores,
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

    const isActionInProgress = useMemo(
        () => (
            isDownloadingSubmissionBool
            || isRemovingSubmissionBool
            || isRunningTestBool
            || isRemovingReviewSummationsBool
        ),
        [
            isDownloadingSubmissionBool,
            isRemovingReviewSummationsBool,
            isRemovingSubmissionBool,
            isRunningTestBool,
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
                    <Button primary size='lg' disabled>
                        Run all system tests
                    </Button>
                    <Button size='lg' disabled>
                        Close challenge
                    </Button>
                    <LinkButton primary light to='./../..' size='lg'>
                        Back
                    </LinkButton>
                </div>
            )}
        >
            {pageContent}

            {isActionInProgress && <ActionLoading />}
        </PageWrapper>
    )
}

export default ManageMarathonMatchPage
