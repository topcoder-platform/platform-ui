/**
 * Manage Submission Page.
 */
import { FC } from 'react'
import { useParams } from 'react-router-dom'
import classNames from 'classnames'

import { LinkButton } from '~/libs/ui'

import {
    useManageBusEvent,
    useManageBusEventProps,
    useManageChallengeSubmissions,
    useManageChallengeSubmissionsProps,
} from '../../lib/hooks'
import {
    ActionLoading,
    PageWrapper,
    SubmissionTable,
    TableLoading,
    TableNoRecord,
} from '../../lib'

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
        isLoading,
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
                            />

                            {(isRemovingSubmissionBool
                                || isRunningTestBool
                                || isRemovingReviewSummationsBool) && (
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
