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
import TabContentPostMortem from './TabContentPostMortem'
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
            {props.selectedTab === 'Registration' ? (
                <TabContentRegistration />
            ) : props.selectedTab === 'Submission / Screening' ? (
                <TabContentScreening
                    screening={props.screening}
                    isLoadingScreening={props.isLoadingSubmission}
                    isDownloading={isDownloadingSubmission}
                    downloadSubmission={downloadSubmission}
                    isActiveChallenge={props.isActiveChallenge}
                />
            ) : props.selectedTab === 'Checkpoint' ? (
                <TabContentCheckpoint
                    checkpoint={props.checkpoint}
                    isLoading={props.isLoadingSubmission}
                    isDownloading={isDownloadingSubmission}
                    downloadSubmission={downloadSubmission}
                />
            ) : props.selectedTab === 'Winners' ? (
                <TabContentWinners
                    isLoading={isLoadingProjectResult}
                    projectResults={projectResults}
                    isDownloading={isDownloadingSubmission}
                    downloadSubmission={downloadSubmission}
                />
            ) : props.selectedTab === 'Approval' ? (
                <TabContentApproval
                    reviews={props.approvalReviews}
                    submitterReviews={props.submitterReviews}
                    isLoadingReview={props.isLoadingSubmission}
                    isDownloading={isDownloadingSubmission}
                    downloadSubmission={downloadSubmission}
                    isActiveChallenge={props.isActiveChallenge}
                />
            ) : props.selectedTab === 'Post-Mortem' ? (
                <TabContentPostMortem
                    reviews={props.postMortemReviews}
                    submitterReviews={props.submitterReviews}
                    isLoadingReview={props.isLoadingSubmission}
                    isDownloading={isDownloadingSubmission}
                    downloadSubmission={downloadSubmission}
                    isActiveChallenge={props.isActiveChallenge}
                />
            ) : props.selectedTab.startsWith(ITERATIVE_REVIEW) ? (
                <TabContentIterativeReview
                    reviews={props.review}
                    submitterReviews={props.submitterReviews}
                    isLoadingReview={props.isLoadingSubmission}
                    isDownloading={isDownloadingSubmission}
                    downloadSubmission={downloadSubmission}
                    isActiveChallenge={props.isActiveChallenge}
                />
            ) : (
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
            )}

            {isDownloadingSubmissionBool && <ActionLoading />}
        </>
    )
}

export default ChallengeDetailsContent
