/**
 * Challenge Details Content.
 */
import { FC } from 'react'

import { ActionLoading } from '~/apps/admin/src/lib'

import { MappingReviewAppeal, Screening, SubmissionInfo } from '../../models'
import {
    useDownloadSubmission,
    useDownloadSubmissionProps,
} from '../../hooks'
import {
    useFetchChallengeResults,
    useFetchChallengeResultsProps,
} from '../../hooks/useFetchChallengeResults'
import { ITERATIVE_REVIEW } from '../../../config/index.config'

import TabContentApproval from './TabContentApproval'
import TabContentCheckpoint from './TabContentCheckpoint'
import TabContentIterativeReview from './TabContentIterativeReview'
import TabContentRegistration from './TabContentRegistration'
import TabContentReview from './TabContentReview'
import TabContentScreening from './TabContentScreening'
import TabContentWinners from './TabContentWinners'

interface Props {
    selectedTab: string
    isLoadingSubmission: boolean
    screening: Screening[]
    checkpoint: Screening[]
    review: SubmissionInfo[]
    submitterReviews: SubmissionInfo[]
    approvalReviews: SubmissionInfo[]
    postMortemReviews: SubmissionInfo[]
    mappingReviewAppeal: MappingReviewAppeal // from review id to appeal info
    isActiveChallenge: boolean
    selectedPhaseId?: string
}

export const ChallengeDetailsContent: FC<Props> = (props: Props) => {
    const {
        isLoading: isDownloadingSubmission,
        isLoadingBool: isDownloadingSubmissionBool,
        downloadSubmission,
    }: useDownloadSubmissionProps = useDownloadSubmission()
    const {
        isLoading: isLoadingProjectResult,
        projectResults,
    }: useFetchChallengeResultsProps = useFetchChallengeResults(props.review)

    return (
        <>
            {(() => {
                if (props.selectedTab === 'Registration') {
                    return <TabContentRegistration />
                }

                if (
                    props.selectedTab === 'Submission / Screening'
                    || props.selectedTab === 'Submission'
                    || props.selectedTab === 'Screening'
                ) {
                    return (
                        <TabContentScreening
                            screening={props.screening}
                            isLoadingScreening={props.isLoadingSubmission}
                            isDownloading={isDownloadingSubmission}
                            downloadSubmission={downloadSubmission}
                            isActiveChallenge={props.isActiveChallenge}
                        />
                    )
                }

                if (
                    props.selectedTab === 'Checkpoint'
                    || props.selectedTab === 'Checkpoint Submission'
                    || props.selectedTab === 'Checkpoint Review'
                ) {
                    return (
                        <TabContentCheckpoint
                            checkpoint={props.checkpoint}
                            isLoading={props.isLoadingSubmission}
                            isDownloading={isDownloadingSubmission}
                            downloadSubmission={downloadSubmission}
                        />
                    )
                }

                if (props.selectedTab === 'Winners') {
                    return (
                        <TabContentWinners
                            isLoading={isLoadingProjectResult}
                            projectResults={projectResults}
                            isDownloading={isDownloadingSubmission}
                            downloadSubmission={downloadSubmission}
                        />
                    )
                }

                if (props.selectedTab === 'Approval') {
                    return (
                        <TabContentApproval
                            reviews={props.approvalReviews}
                            submitterReviews={props.submitterReviews}
                            isLoadingReview={props.isLoadingSubmission}
                            isDownloading={isDownloadingSubmission}
                            downloadSubmission={downloadSubmission}
                            isActiveChallenge={props.isActiveChallenge}
                        />
                    )
                }

                if (props.selectedTab === 'Post-Mortem') {
                    return (
                        <TabContentIterativeReview
                            reviews={props.postMortemReviews}
                            submitterReviews={props.submitterReviews}
                            isLoadingReview={props.isLoadingSubmission}
                            isDownloading={isDownloadingSubmission}
                            downloadSubmission={downloadSubmission}
                            isActiveChallenge={props.isActiveChallenge}
                            columnLabel='Post-Mortem'
                        />
                    )
                }

                if (props.selectedTab.startsWith(ITERATIVE_REVIEW)) {
                    return (
                        <TabContentIterativeReview
                            reviews={props.review}
                            submitterReviews={props.submitterReviews}
                            isLoadingReview={props.isLoadingSubmission}
                            isDownloading={isDownloadingSubmission}
                            downloadSubmission={downloadSubmission}
                            isActiveChallenge={props.isActiveChallenge}
                            phaseIdFilter={props.selectedPhaseId}
                        />
                    )
                }

                return (
                    <TabContentReview
                        selectedTab={props.selectedTab}
                        reviews={props.review}
                        submitterReviews={props.submitterReviews}
                        isLoadingReview={props.isLoadingSubmission}
                        isDownloading={isDownloadingSubmission}
                        downloadSubmission={downloadSubmission}
                        mappingReviewAppeal={props.mappingReviewAppeal}
                        isActiveChallenge={props.isActiveChallenge}
                    />
                )
            })()}

            {isDownloadingSubmissionBool && <ActionLoading />}
        </>
    )
}

export default ChallengeDetailsContent
