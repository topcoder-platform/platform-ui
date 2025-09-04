/**
 * Challenge Details Content.
 */
import { FC } from 'react'

import { ActionLoading } from '~/apps/admin/src/lib'

import { Screening, SubmissionInfo } from '../../models'
import {
    useDownloadSubmission,
    useDownloadSubmissionProps,
} from '../../hooks'
import {
    useFetchChallengeResults,
    useFetchChallengeResultsProps,
} from '../../hooks/useFetchChallengeResults'

import TabContentRegistration from './TabContentRegistration'
import TabContentReview from './TabContentReview'
import TabContentScreening from './TabContentScreening'
import TabContentWinners from './TabContentWinners'

interface Props {
    selectedTab: string
    isLoadingSubmission: boolean
    screening: Screening[]
    review: SubmissionInfo[]
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
                />
            ) : props.selectedTab === 'Winners' ? (
                <TabContentWinners
                    isLoading={isLoadingProjectResult}
                    projectResults={projectResults}
                    isDownloading={isDownloadingSubmission}
                    downloadSubmission={downloadSubmission}
                />
            ) : (
                <TabContentReview
                    selectedTab={props.selectedTab}
                    reviews={props.review}
                    isLoadingReview={props.isLoadingSubmission}
                    isDownloading={isDownloadingSubmission}
                    downloadSubmission={downloadSubmission}
                />
            )}

            {isDownloadingSubmissionBool && <ActionLoading />}
        </>
    )
}

export default ChallengeDetailsContent
