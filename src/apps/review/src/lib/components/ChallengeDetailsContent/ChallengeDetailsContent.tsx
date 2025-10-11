/**
 * Challenge Details Content.
 */
import { FC, ReactNode, useContext, useMemo } from 'react'

import { ActionLoading } from '~/apps/admin/src/lib'

import { ChallengeDetailContext } from '../../contexts'
import { ChallengeInfo, MappingReviewAppeal, Screening, SubmissionInfo } from '../../models'
import {
    useDownloadSubmission,
    useDownloadSubmissionProps,
    useRole, useRoleProps } from '../../hooks'
import {
    useFetchChallengeResults,
    useFetchChallengeResultsProps,
} from '../../hooks/useFetchChallengeResults'
import { ITERATIVE_REVIEW, SUBMITTER } from '../../../config/index.config'
import { TableNoRecord } from '../TableNoRecord'

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
    checkpointReview: Screening[]
    review: SubmissionInfo[]
    submitterReviews: SubmissionInfo[]
    approvalReviews: SubmissionInfo[]
    postMortemReviews: SubmissionInfo[]
    mappingReviewAppeal: MappingReviewAppeal // from review id to appeal info
    isActiveChallenge: boolean
    selectedPhaseId?: string
}

// Internal wrapper to match tab layout spacing
const TabContentWrapper = (props: { children: ReactNode }): JSX.Element => <>{props.children}</>

// Lightweight wrapper to reuse existing empty-state style
const TabContentPlaceholder = (props: { message: string }): JSX.Element => (
    <TabContentWrapper>
        <TableNoRecord message={props.message} />
    </TabContentWrapper>
)

export const ChallengeDetailsContent: FC<Props> = (props: Props) => {
    const { challengeInfo }: { challengeInfo?: ChallengeInfo } = useContext(ChallengeDetailContext)
    const { actionChallengeRole }: useRoleProps = useRole()
    const {
        isLoading: isDownloadingSubmission,
        isLoadingBool: isDownloadingSubmissionBool,
        downloadSubmission,
    }: useDownloadSubmissionProps = useDownloadSubmission()
    const {
        isLoading: isLoadingProjectResult,
        projectResults,
    }: useFetchChallengeResultsProps = useFetchChallengeResults(props.review)

    // Determine if the selected tab corresponds to a phase that hasn't opened yet
    const selectedPhase = useMemo(
        () => (props.selectedPhaseId
            ? (challengeInfo?.phases || []).find(p => p.id === props.selectedPhaseId)
            : undefined),
        [challengeInfo?.phases, props.selectedPhaseId],
    )
    const isFuturePhaseForSubmitter = useMemo(() => {
        if (!props.isActiveChallenge) return false
        if (actionChallengeRole !== SUBMITTER) return false
        if (!selectedPhase) return false
        const isOpen = Boolean((selectedPhase as { isOpen?: boolean }).isOpen)
        const hasStarted = Boolean(selectedPhase.actualStartDate)
        // If phase is not open and hasn't actually started, consider it future
        if (!isOpen && !hasStarted) return true
        // Fallback to scheduled start in the future if available
        const startMs = Date.parse(selectedPhase.actualStartDate || selectedPhase.scheduledStartDate || '')
        if (Number.isFinite(startMs)) {
            return startMs > Date.now()
        }

        return false
    }, [actionChallengeRole, selectedPhase, props.isActiveChallenge])
    const unopenedPhaseMessage = useMemo(() => {
        if (!selectedPhase) return undefined
        const name = (selectedPhase.name || props.selectedTab || 'selected').toLowerCase()
        return `The ${name} phase hasn't opened yet.`
    }, [selectedPhase, props.selectedTab])

    return (
        <>
            {isFuturePhaseForSubmitter ? (
                <TabContentPlaceholder message={unopenedPhaseMessage || "This phase hasn't opened yet."} />
            ) : (
                (() => {
                    const selectedTabLower = (props.selectedTab || '').toLowerCase()

                    if (selectedTabLower === 'registration') {
                        return <TabContentRegistration />
                    }

                    if (['submission / screening', 'submission', 'screening'].includes(selectedTabLower)) {
                        const restrictScreeningToLatest = ['screening', 'submission / screening', 'submission']
                            .includes(selectedTabLower)
                        const screeningRows = restrictScreeningToLatest
                            ? props.screening.filter(submission => submission.isLatest === true)
                            : props.screening

                        return (
                            <TabContentScreening
                                screening={screeningRows}
                                isLoadingScreening={props.isLoadingSubmission}
                                isDownloading={isDownloadingSubmission}
                                downloadSubmission={downloadSubmission}
                                isActiveChallenge={props.isActiveChallenge}
                            />
                        )
                    }

                    if ([
                        'checkpoint',
                        'checkpoint submission',
                        'checkpoint screening',
                        'checkpoint review',
                    ].includes(selectedTabLower)) {
                        return (
                            <TabContentCheckpoint
                                checkpoint={props.checkpoint}
                                checkpointReview={props.checkpointReview}
                                isLoading={props.isLoadingSubmission}
                                isDownloading={isDownloadingSubmission}
                                downloadSubmission={downloadSubmission}
                                selectedTab={props.selectedTab}
                            />
                        )
                    }

                    if (selectedTabLower === 'winners') {
                        return (
                            <TabContentWinners
                                isLoading={isLoadingProjectResult}
                                projectResults={projectResults}
                                isDownloading={isDownloadingSubmission}
                                downloadSubmission={downloadSubmission}
                            />
                        )
                    }

                    if (selectedTabLower === 'approval') {
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

                    if (selectedTabLower === 'post-mortem') {
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
                })()
            )}

            {isDownloadingSubmissionBool && <ActionLoading />}
        </>
    )
}

export default ChallengeDetailsContent
