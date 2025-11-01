/**
 * Challenge Details Content.
 */
import { FC, ReactNode, useCallback, useContext, useMemo } from 'react'
import { toast } from 'react-toastify'

import { ActionLoading } from '~/apps/admin/src/lib'

import { ChallengeDetailContext } from '../../contexts'
import {
    BackendSubmission,
    ChallengeInfo,
    MappingReviewAppeal,
    Screening,
    SubmissionInfo,
} from '../../models'
import {
    useDownloadSubmission,
    useDownloadSubmissionProps,
    useRole,
    useRoleProps,
    useSubmissionDownloadAccess,
    UseSubmissionDownloadAccessResult,
} from '../../hooks'
import {
    useFetchChallengeResults,
    useFetchChallengeResultsProps,
} from '../../hooks/useFetchChallengeResults'
import { ITERATIVE_REVIEW, SUBMITTER } from '../../../config/index.config'
import { TableNoRecord } from '../TableNoRecord'
import { hasIsLatestFlag } from '../../utils'
import { shouldIncludeInReviewPhase } from '../../utils/reviewPhaseGuards'

import TabContentApproval from './TabContentApproval'
import TabContentCheckpoint from './TabContentCheckpoint'
import TabContentIterativeReview from './TabContentIterativeReview'
import TabContentRegistration from './TabContentRegistration'
import TabContentReview from './TabContentReview'
import TabContentScreening from './TabContentScreening'
import TabContentSubmissions from './TabContentSubmissions'
import TabContentWinners from './TabContentWinners'

const normalizeType = (value?: string): string => (
    value
        ? value
            .toLowerCase()
            .replace(/[^a-z]/g, '')
        : ''
)

interface Props {
    selectedTab: string
    isLoadingSubmission: boolean
    screening: Screening[]
    screeningMinimumPassingScore: number | null | undefined
    submissions: BackendSubmission[]
    checkpoint: Screening[]
    checkpointScreeningMinimumPassingScore: number | null | undefined
    checkpointReview: Screening[]
    checkpointReviewMinimumPassingScore: number | null | undefined
    review: SubmissionInfo[]
    reviewMinimumPassingScore: number | null | undefined
    submitterReviews: SubmissionInfo[]
    approvalReviews: SubmissionInfo[]
    approvalMinimumPassingScore: number | null | undefined
    postMortemReviews: SubmissionInfo[]
    postMortemMinimumPassingScore: number | null | undefined
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

const SUBMISSION_TAB_KEYS = new Set([
    normalizeType('submission'),
    normalizeType('screening'),
    normalizeType('submission / screening'),
    normalizeType('topgear submission'),
])

const CHECKPOINT_REVIEW_KEY = normalizeType('checkpoint review')
const CHECKPOINT_SCREENING_KEY = normalizeType('checkpoint screening')
const CHECKPOINT_TAB_KEYS = new Set([
    normalizeType('checkpoint'),
    normalizeType('checkpoint submission'),
    CHECKPOINT_SCREENING_KEY,
    CHECKPOINT_REVIEW_KEY,
])

interface BuildScreeningRowsParams {
    screening: Screening[]
    actionChallengeRole: useRoleProps['actionChallengeRole']
    currentMemberId: UseSubmissionDownloadAccessResult['currentMemberId']
}

const buildScreeningRows = ({
    screening,
    actionChallengeRole,
    currentMemberId,
}: BuildScreeningRowsParams): Screening[] => {
    if (actionChallengeRole === SUBMITTER && currentMemberId) {
        const mySubmissions = screening.filter(entry => entry.memberId === currentMemberId)

        return hasIsLatestFlag(mySubmissions)
            ? mySubmissions.filter(submission => submission.isLatest === true)
            : mySubmissions
    }

    return screening
}

interface SubmissionTabParams {
    selectedTabNormalized: string
    submissions: BackendSubmission[]
    screeningRows: Screening[]
    screeningMinimumPassingScore: number | null | undefined
    isLoadingSubmission: boolean
    isDownloadingSubmission: useDownloadSubmissionProps['isLoading']
    downloadSubmission: useDownloadSubmissionProps['downloadSubmission']
    isActiveChallenge: boolean
}

const renderSubmissionTab = ({
    selectedTabNormalized,
    submissions,
    screeningRows,
    screeningMinimumPassingScore,
    isLoadingSubmission,
    isDownloadingSubmission,
    downloadSubmission,
    isActiveChallenge,
}: SubmissionTabParams): JSX.Element => {
    const isSubmissionTab = selectedTabNormalized === 'submission'
    const isTopgearSubmissionTab = selectedTabNormalized === 'topgearsubmission'
    const shouldRestrictToContestSubmissions = selectedTabNormalized
        .startsWith('submission')
        || isTopgearSubmissionTab
    const visibleSubmissions = shouldRestrictToContestSubmissions
        ? submissions.filter(
            submission => normalizeType(submission.type) === 'contestsubmission',
        )
        : submissions
    const canShowSubmissionList = !isTopgearSubmissionTab
        && selectedTabNormalized !== 'screening'
        && visibleSubmissions.length > 0

    if (canShowSubmissionList) {
        return (
            <TabContentSubmissions
                submissions={visibleSubmissions}
                isLoading={isLoadingSubmission}
                isDownloading={isDownloadingSubmission}
                downloadSubmission={downloadSubmission}
            />
        )
    }

    return (
        <TabContentScreening
            screening={screeningRows}
            screeningMinimumPassingScore={screeningMinimumPassingScore}
            isLoadingScreening={isLoadingSubmission}
            isDownloading={isDownloadingSubmission}
            downloadSubmission={downloadSubmission}
            isActiveChallenge={isActiveChallenge}
            showScreeningColumns={!isSubmissionTab && !isTopgearSubmissionTab}
        />
    )
}

export const ChallengeDetailsContent: FC<Props> = (props: Props) => {
    const { challengeInfo }: { challengeInfo?: ChallengeInfo } = useContext(ChallengeDetailContext)
    const { actionChallengeRole }: useRoleProps = useRole()
    const { currentMemberId }: UseSubmissionDownloadAccessResult = useSubmissionDownloadAccess()
    const {
        isLoading: isDownloadingSubmission,
        isLoadingBool: isDownloadingSubmissionBool,
        downloadSubmission,
    }: useDownloadSubmissionProps = useDownloadSubmission()
    const submissionsById = useMemo(() => {
        const map = new Map<string, BackendSubmission>()
        props.submissions.forEach(submission => {
            if (submission?.id) {
                map.set(submission.id, submission)
            }
        })
        return map
    }, [props.submissions])
    const handleSubmissionDownload = useCallback((submissionId: string) => {
        const submission = submissionsById.get(submissionId)
        if (submission && submission.isFileSubmission === false) {
            const targetUrl = submission.url?.trim()
            if (targetUrl) {
                if (typeof window !== 'undefined') {
                    const openedWindow = window.open(targetUrl, '_blank', 'noopener,noreferrer')
                    if (openedWindow === null) {
                        window.location.assign(targetUrl)
                    }
                } else {
                    toast.error('Unable to open the submission URL from this environment.')
                }
            } else {
                toast.error('Submission URL is not available for this entry.')
            }

            return
        }

        downloadSubmission(submissionId)
    }, [downloadSubmission, submissionsById])
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
    const postMortemReviewRows = useMemo(
        () => props.postMortemReviews,
        [props.postMortemReviews],
    )
    const postMortemSubmitterReviews = useMemo(() => {
        const filtered = props.submitterReviews.filter(
            submission => normalizeType(submission.reviewTypeId)
                .includes('postmortem'),
        )

        return filtered.length ? filtered : props.postMortemReviews
    }, [props.postMortemReviews, props.submitterReviews])
    const hasScreeningPhase = useMemo(
        () => (challengeInfo?.phases ?? []).some(
            phase => (phase.name || '').trim()
                .toLowerCase() === 'screening',
        ),
        [challengeInfo?.phases],
    )
    const passesReviewTabGuards: (submission: SubmissionInfo) => boolean = useMemo(
        () => (submission: SubmissionInfo): boolean => shouldIncludeInReviewPhase(
            submission,
            challengeInfo?.phases,
        ),
        [challengeInfo?.phases],
    )
    const {
        reviews: reviewTabReviews,
        submitterReviews: reviewTabSubmitterReviews,
    }: {
        reviews: SubmissionInfo[]
        submitterReviews: SubmissionInfo[]
    } = useMemo(() => {
        const shouldFilter = props.isActiveChallenge && hasScreeningPhase
        if (!shouldFilter) {
            return {
                reviews: props.review.filter(passesReviewTabGuards),
                submitterReviews: props.submitterReviews.filter(passesReviewTabGuards),
            }
        }

        const passingSubmissionIds = new Set<string>()
        props.screening.forEach(entry => {
            if (!entry?.submissionId) {
                return
            }

            const result = (entry.result || '').toUpperCase()
            if (result === 'PASS') {
                passingSubmissionIds.add(`${entry.submissionId}`)
            }
        })

        if (passingSubmissionIds.size === 0) {
            return {
                reviews: props.review
                    .filter(passesReviewTabGuards),
                submitterReviews: props.submitterReviews
                    .filter(passesReviewTabGuards),
            }
        }

        const matchesPassingScreening = (submission: SubmissionInfo): boolean => {
            if (!submission) {
                return false
            }

            const candidateIds: string[] = []
            if (submission.id) {
                candidateIds.push(`${submission.id}`)
            }

            const reviewSubmissionId = submission.review?.submissionId
            if (reviewSubmissionId) {
                candidateIds.push(`${reviewSubmissionId}`)
            }

            if (!candidateIds.length) {
                return true
            }

            return candidateIds.some(id => passingSubmissionIds.has(id))
        }

        return {
            reviews: props.review
                .filter(matchesPassingScreening)
                .filter(passesReviewTabGuards),
            submitterReviews: props.submitterReviews
                .filter(matchesPassingScreening)
                .filter(passesReviewTabGuards),
        }
    }, [
        hasScreeningPhase,
        props.isActiveChallenge,
        props.review,
        props.submitterReviews,
        props.screening,
        passesReviewTabGuards,
    ])

    const renderSelectedTab = (): JSX.Element => {
        const selectedTabLower = (props.selectedTab || '').toLowerCase()
        const selectedTabNormalized = normalizeType(props.selectedTab)

        if (selectedTabLower === 'registration') {
            return <TabContentRegistration />
        }

        const screeningRows = buildScreeningRows({
            actionChallengeRole,
            currentMemberId,
            screening: props.screening,
        })

        if (SUBMISSION_TAB_KEYS.has(selectedTabNormalized)) {
            return renderSubmissionTab({
                downloadSubmission: handleSubmissionDownload,
                isActiveChallenge: props.isActiveChallenge,
                isDownloadingSubmission,
                isLoadingSubmission: props.isLoadingSubmission,
                screeningMinimumPassingScore: props.screeningMinimumPassingScore,
                screeningRows,
                selectedTabNormalized,
                submissions: props.submissions,
            })
        }

        if (CHECKPOINT_TAB_KEYS.has(selectedTabNormalized)) {
            const checkpointMode: 'submission' | 'screening' | 'review' = selectedTabNormalized
                .startsWith(CHECKPOINT_REVIEW_KEY)
                ? 'review'
                : selectedTabNormalized.startsWith(CHECKPOINT_SCREENING_KEY)
                    ? 'screening'
                    : 'submission'
            return (
                <TabContentCheckpoint
                    checkpoint={props.checkpoint}
                    checkpointReview={props.checkpointReview}
                    checkpointScreeningMinimumPassingScore={props.checkpointScreeningMinimumPassingScore}
                    checkpointReviewMinimumPassingScore={props.checkpointReviewMinimumPassingScore}
                    isLoading={props.isLoadingSubmission}
                    isDownloading={isDownloadingSubmission}
                    downloadSubmission={handleSubmissionDownload}
                    mode={checkpointMode}
                />
            )
        }

        if (selectedTabLower === 'winners') {
            return (
                <TabContentWinners
                    isLoading={isLoadingProjectResult}
                    projectResults={projectResults}
                    isDownloading={isDownloadingSubmission}
                    downloadSubmission={handleSubmissionDownload}
                />
            )
        }

        if (selectedTabLower === 'approval') {
            return (
                <TabContentApproval
                    reviews={props.approvalReviews}
                    submitterReviews={props.submitterReviews}
                    approvalMinimumPassingScore={props.approvalMinimumPassingScore}
                    isLoadingReview={props.isLoadingSubmission}
                    isDownloading={isDownloadingSubmission}
                    downloadSubmission={handleSubmissionDownload}
                    isActiveChallenge={props.isActiveChallenge}
                />
            )
        }

        if (selectedTabLower === 'post-mortem') {
            return (
                <TabContentIterativeReview
                    reviews={postMortemReviewRows}
                    submitterReviews={postMortemSubmitterReviews}
                    postMortemMinimumPassingScore={props.postMortemMinimumPassingScore}
                    isLoadingReview={props.isLoadingSubmission}
                    isDownloading={isDownloadingSubmission}
                    downloadSubmission={handleSubmissionDownload}
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
                    postMortemMinimumPassingScore={props.postMortemMinimumPassingScore}
                    isLoadingReview={props.isLoadingSubmission}
                    isDownloading={isDownloadingSubmission}
                    downloadSubmission={handleSubmissionDownload}
                    isActiveChallenge={props.isActiveChallenge}
                    phaseIdFilter={props.selectedPhaseId}
                />
            )
        }

        return (
            <TabContentReview
                selectedTab={props.selectedTab}
                reviews={reviewTabReviews}
                submitterReviews={reviewTabSubmitterReviews}
                reviewMinimumPassingScore={props.reviewMinimumPassingScore}
                isLoadingReview={props.isLoadingSubmission}
                isDownloading={isDownloadingSubmission}
                downloadSubmission={handleSubmissionDownload}
                mappingReviewAppeal={props.mappingReviewAppeal}
                isActiveChallenge={props.isActiveChallenge}
            />
        )
    }

    return (
        <>
            {isFuturePhaseForSubmitter ? (
                <TabContentPlaceholder message={unopenedPhaseMessage || "This phase hasn't opened yet."} />
            ) : (
                renderSelectedTab()
            )}

            {isDownloadingSubmissionBool && <ActionLoading />}
        </>
    )
}

export default ChallengeDetailsContent
