import {
    FC,
    MouseEvent,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import _ from 'lodash'
import classNames from 'classnames'
import { useSWRConfig } from 'swr'
import { FullConfiguration } from 'swr/dist/types'

import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { IsRemovingType } from '~/apps/admin/src/lib/models'
import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { handleError, useWindowSize, WindowSize } from '~/libs/shared'
import { BaseModal, IconOutline, Table, TableColumn } from '~/libs/ui'

import { ChallengeDetailContext, ReviewAppContext } from '../../contexts'
import {
    useFetchAiReviewEscalations,
    useRole,
    useScorecardPassingScores,
    useSubmissionDownloadAccess,
} from '../../hooks'
import type { useRoleProps } from '../../hooks/useRole'
import { useSubmissionHistory } from '../../hooks/useSubmissionHistory'
import type { UseSubmissionHistoryResult } from '../../hooks/useSubmissionHistory'
import { useRolePermissions } from '../../hooks/useRolePermissions'
import type { UseRolePermissionsResult } from '../../hooks/useRolePermissions'
import type { UseSubmissionDownloadAccessResult } from '../../hooks/useSubmissionDownloadAccess'
import {
    ChallengeDetailContextModel,
    MappingReviewAppeal,
    ReviewAppContextModel,
    SubmissionInfo,
} from '../../models'
import {
    aggregateSubmissionReviews,
    challengeHasSubmissionLimit,
    isReviewPhase,
    isReviewPhaseCurrentlyOpen,
    refreshChallengeReviewData,
    REOPEN_MESSAGE_OTHER,
    REOPEN_MESSAGE_SELF,
} from '../../utils'
import type {
    AggregatedReviewDetail,
    AggregatedSubmissionReviews,
} from '../../utils'
import { getSubmissionHistoryKey } from '../../utils/submissionHistory'
import {
    AiReviewDecisionEscalation,
    AiReviewEscalationDecision,
    createAiReviewEscalation,
    getAiReviewEscalationsCacheKey,
    updateAiReviewEscalation,
    updateReview,
} from '../../services'
import { TableWrapper } from '../TableWrapper'
import { SubmissionHistoryModal } from '../SubmissionHistoryModal'
import { ConfirmModal } from '../ConfirmModal'
import { createSubmissionMetaMap } from '../common/columnUtils'
import {
    renderReviewDateCell,
    renderReviewerCell,
    renderReviewScoreCell,
    renderScoreCell,
    renderSubmissionIdCell,
    renderSubmitterHandleCell,
} from '../common/TableColumnRenderers'
import type {
    DownloadButtonConfig,
    ScoreVisibilityConfig,
    SubmissionReviewerRow,
    SubmissionRow,
} from '../common/types'
import { buildSubmissionReviewerRows, resolveSubmissionReviewResult } from '../common/reviewResult'
import { shouldIncludeInReviewPhase } from '../../utils/reviewPhaseGuards'
import { CollapsibleAiReviewsRow } from '../CollapsibleAiReviewsRow'

import styles from './TableReview.module.scss'

export interface TableReviewProps {
    aiReviewers?: { aiWorkflowId: string }[]
    className?: string
    datas: SubmissionInfo[]
    screeningOutcome: {
        failingSubmissionIds: Set<string>;
        passingSubmissionIds: Set<string>;
    }
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    mappingReviewAppeal: MappingReviewAppeal
    hideHandleColumn?: boolean
}

interface PendingReopenState {
    review?: AggregatedReviewDetail
    submission?: SubmissionRow
    isOwnReview?: boolean
}

type RestrictionResult = {
    restricted: boolean
    message?: string
}

export const TableReview: FC<TableReviewProps> = (props: TableReviewProps) => {
    const className: string | undefined = props.className
    const datas: SubmissionInfo[] = props.datas
    const downloadSubmission: (submissionId: string) => void = props.downloadSubmission
    const hideHandleColumn: boolean | undefined = props.hideHandleColumn
    const isDownloading: IsRemovingType = props.isDownloading
    const mappingReviewAppeal: MappingReviewAppeal = props.mappingReviewAppeal
    const {
        challengeInfo,
        reviewers,
        resources,
        myResources,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const { width: screenWidth }: WindowSize = useWindowSize()
    const { actionChallengeRole }: useRoleProps = useRole()
    const {
        canManageCompletedReviews,
        hasCopilotRole,
        isCopilotWithReviewerAssignments,
        isAdmin,
        ownedMemberIds,
    }: UseRolePermissionsResult = useRolePermissions()
    const {
        getRestrictionMessageForMember,
        isSubmissionDownloadRestricted,
        isSubmissionDownloadRestrictedForMember,
        restrictionMessage,
    }: UseSubmissionDownloadAccessResult = useSubmissionDownloadAccess()
    const { loginUserInfo }: ReviewAppContextModel = useContext(ReviewAppContext)
    const { mutate }: FullConfiguration = useSWRConfig()

    const isTablet = useMemo<boolean>(() => screenWidth <= 744, [screenWidth])
    const reviewPhaseDatas = useMemo<SubmissionInfo[]>(
        () => datas.filter(submission => shouldIncludeInReviewPhase(
            submission,
            challengeInfo?.phases,
        )),
        [challengeInfo?.phases, datas],
    )

    const submissionTypes = useMemo<Set<string>>(
        () => new Set<string>(
            reviewPhaseDatas
                .map(submission => submission.type)
                .filter((type): type is string => Boolean(type)),
        ),
        [reviewPhaseDatas],
    )

    const filteredChallengeSubmissions = useMemo<SubmissionInfo[]>(
        () => {
            const challengeSubmissions = challengeInfo?.submissions ?? []

            if (!submissionTypes.size) {
                return challengeSubmissions
            }

            return challengeSubmissions.filter(submission => (
                submission.type ? submissionTypes.has(submission.type) : false
            ))
        },
        [challengeInfo, submissionTypes],
    )

    const {
        closeHistoryModal,
        historyByMember,
        historyEntriesForModal,
        historyKey,
        latestSubmissionIds,
        latestSubmissions,
        openHistoryModal,
        shouldShowHistoryActions,
    }: UseSubmissionHistoryResult = useSubmissionHistory({
        datas: reviewPhaseDatas,
        filteredAll: filteredChallengeSubmissions,
        isSubmissionTab: true,
    })

    const restrictToLatest = useMemo<boolean>(
        () => challengeHasSubmissionLimit(challengeInfo),
        [challengeInfo],
    )

    const submissionMetaById = useMemo<Map<string, SubmissionInfo>>(
        () => createSubmissionMetaMap(filteredChallengeSubmissions, reviewPhaseDatas),
        [filteredChallengeSubmissions, reviewPhaseDatas],
    )

    const resolveSubmissionMeta = useCallback(
        (submissionId: string): SubmissionInfo | undefined => submissionMetaById.get(submissionId),
        [submissionMetaById],
    )

    const getHistoryRestriction = useCallback(
        (submission: SubmissionInfo): RestrictionResult => {
            const memberId = submission.memberId
            const restricted = isSubmissionDownloadRestrictedForMember(memberId)
                || isSubmissionDownloadRestricted
            const memberMessage = getRestrictionMessageForMember(memberId)
            const message = memberMessage ?? restrictionMessage

            return {
                message,
                restricted,
            }
        },
        [
            getRestrictionMessageForMember,
            isSubmissionDownloadRestricted,
            isSubmissionDownloadRestrictedForMember,
            restrictionMessage,
        ],
    )

    const handleHistoryButtonClick = useCallback((event: MouseEvent<HTMLButtonElement>): void => {
        const submissionId = event.currentTarget.dataset.submissionId
        const memberId = event.currentTarget.dataset.memberId

        if (!submissionId) {
            return
        }

        openHistoryModal(memberId || undefined, submissionId)
    }, [openHistoryModal])

    const myReviewerResourceIds = useMemo<Set<string>>(
        () => new Set<string>(
            myResources
                .filter(resource => {
                    const roleName = (resource.roleName || '').toLowerCase()
                    return roleName.includes('reviewer') && !roleName.includes('iterative')
                })
                .map(resource => resource.id)
                .filter((id): id is string => Boolean(id)),
        ),
        [myResources],
    )

    const hasReviewRole = useMemo<boolean>(
        () => myReviewerResourceIds.size > 0,
        [myReviewerResourceIds],
    )

    const filterScreeningPassedReviews = useCallback(
        (submissions: SubmissionInfo[]): SubmissionInfo[] => submissions.filter(
            submission => !props.screeningOutcome.failingSubmissionIds.has(submission.id ?? ''),
        ),
        [props.screeningOutcome.failingSubmissionIds],
    )

    const submissionsForAggregation = useMemo<SubmissionInfo[]>(
        () => (
            restrictToLatest
                ? filterScreeningPassedReviews(latestSubmissions)
                : filterScreeningPassedReviews(reviewPhaseDatas)
        ),
        [latestSubmissions, restrictToLatest, reviewPhaseDatas, filterScreeningPassedReviews],
    )

    const aggregatedSubmissionRows = useMemo<AggregatedSubmissionReviews[]>(() => (
        aggregateSubmissionReviews({
            mappingReviewAppeal,
            reviewers,
            submissions: submissionsForAggregation,
        })
    ), [mappingReviewAppeal, reviewers, submissionsForAggregation])

    const scorecardIds = useMemo<Set<string>>(() => {
        const ids = new Set<string>()

        aggregatedSubmissionRows.forEach(aggregated => {
            const primary = aggregated.submission?.review?.scorecardId?.trim()
            if (primary) {
                ids.add(primary)
            }

            aggregated.reviews?.forEach(review => {
                const derived = review.reviewInfo?.scorecardId?.trim()
                if (derived) {
                    ids.add(derived)
                }
            })
        })

        return ids
    }, [aggregatedSubmissionRows])

    const minimumPassingScoreByScorecardId = useScorecardPassingScores(scorecardIds)

    const aggregatedRows = useMemo<SubmissionRow[]>(() => {
        const rows = aggregatedSubmissionRows.map(aggregated => ({
            ...(aggregated.submission ?? {}),
            ...aggregated.submission,
            aggregated,
        })) as SubmissionRow[]

        if (!restrictToLatest) {
            return rows
        }

        return rows.filter(row => row.id && latestSubmissionIds.has(row.id))
    }, [aggregatedSubmissionRows, latestSubmissionIds, restrictToLatest])

    const reviewerRows = useMemo<SubmissionReviewerRow[]>(
        () => buildSubmissionReviewerRows(aggregatedRows),
        [aggregatedRows],
    )

    const {
        decisions: escalationDecisions,
    } = useFetchAiReviewEscalations({
        challengeId: challengeInfo?.id,
        submissionLocked: true,
    })

    const escalationDecisionBySubmissionId = useMemo<Map<string, AiReviewEscalationDecision>>(
        () => new Map(escalationDecisions.map(decision => [decision.submissionId, decision])),
        [escalationDecisions],
    )

    const handleByMemberId = useMemo<Map<string, string>>(
        () => {
            const map = new Map<string, string>()
            ;[
                ...resources,
                ...reviewers,
            ].forEach(resource => {
                if (resource.memberId && resource.memberHandle) {
                    map.set(String(resource.memberId), resource.memberHandle)
                }
            })

            return map
        },
        [resources, reviewers],
    )

    const [isReopening, setIsReopening] = useState(false)
    const [pendingReopen, setPendingReopen] = useState<PendingReopenState | undefined>(undefined)
    const [escalateTarget, setEscalateTarget] = useState<SubmissionReviewerRow | undefined>(undefined)
    const [unlockTarget, setUnlockTarget] = useState<SubmissionReviewerRow | undefined>(undefined)
    const [verifyTarget, setVerifyTarget] = useState<{
        submission: SubmissionReviewerRow
        decision: AiReviewEscalationDecision
        escalation: AiReviewDecisionEscalation
    } | undefined>(undefined)
    const [escalationNotes, setEscalationNotes] = useState('')
    const [unlockNotes, setUnlockNotes] = useState('')
    const [verifyNotes, setVerifyNotes] = useState('')
    const [isEscalationSubmitting, setIsEscalationSubmitting] = useState(false)

    const openReopenDialog = useCallback((submission: SubmissionRow, review: AggregatedReviewDetail): void => {
        const resourceId = review.reviewInfo?.resourceId ?? review.resourceId
        const isOwnReview = resourceId ? myReviewerResourceIds.has(resourceId) : false

        setPendingReopen({
            isOwnReview,
            review,
            submission,
        })
    }, [myReviewerResourceIds])

    const closeReopenDialog = useCallback((): void => {
        setPendingReopen(undefined)
    }, [])

    const closeEscalateDialog = useCallback((): void => {
        if (isEscalationSubmitting) {
            return
        }
        setEscalateTarget(undefined)
        setEscalationNotes('')
    }, [isEscalationSubmitting])

    const closeUnlockDialog = useCallback((): void => {
        if (isEscalationSubmitting) {
            return
        }
        setUnlockTarget(undefined)
        setUnlockNotes('')
    }, [isEscalationSubmitting])

    const closeVerifyDialog = useCallback((): void => {
        if (isEscalationSubmitting) {
            return
        }
        setVerifyTarget(undefined)
        setVerifyNotes('')
    }, [isEscalationSubmitting])

    const revalidateEscalationData = useCallback(async (): Promise<void> => {
        if (!challengeInfo?.id) {
            return
        }

        await mutate(getAiReviewEscalationsCacheKey({
            challengeId: challengeInfo.id,
            submissionLocked: true,
        }))
    }, [challengeInfo?.id, mutate])

    const handleSubmitEscalation = useCallback(async (): Promise<void> => {
        if (!escalateTarget?.id) {
            return
        }

        const decision = escalationDecisionBySubmissionId.get(escalateTarget.id)
        if (!decision?.aiReviewDecisionId) {
            toast.error('Unable to find AI review decision for this submission.')
            return
        }

        const notes = escalationNotes.trim()
        if (!notes) {
            toast.error('Escalation notes are required.')
            return
        }

        setIsEscalationSubmitting(true)

        try {
            await createAiReviewEscalation(decision.aiReviewDecisionId, {
                escalationNotes: notes,
            })
            toast.success('Escalation request submitted.')
            closeEscalateDialog()
            if (challengeInfo?.id) {
                await refreshChallengeReviewData(challengeInfo.id)
            }
            await revalidateEscalationData()
        } catch (error) {
            handleError(error)
        } finally {
            setIsEscalationSubmitting(false)
        }
    }, [
        escalateTarget?.id,
        escalationDecisionBySubmissionId,
        escalationNotes,
        closeEscalateDialog,
        challengeInfo?.id,
        revalidateEscalationData,
    ])

    const handleSubmitUnlock = useCallback(async (): Promise<void> => {
        if (!unlockTarget?.id) {
            return
        }

        const decision = escalationDecisionBySubmissionId.get(unlockTarget.id)
        if (!decision?.aiReviewDecisionId) {
            toast.error('Unable to find AI review decision for this submission.')
            return
        }

        const notes = unlockNotes.trim()
        if (!notes) {
            toast.error('Reason is required to unlock this submission.')
            return
        }

        setIsEscalationSubmitting(true)

        try {
            await createAiReviewEscalation(decision.aiReviewDecisionId, {
                approverNotes: notes,
            })
            toast.success('Submission unlocked successfully.')
            closeUnlockDialog()
            if (challengeInfo?.id) {
                await refreshChallengeReviewData(challengeInfo.id)
            }
            await revalidateEscalationData()
        } catch (error) {
            handleError(error)
        } finally {
            setIsEscalationSubmitting(false)
        }
    }, [
        unlockTarget?.id,
        escalationDecisionBySubmissionId,
        unlockNotes,
        closeUnlockDialog,
        challengeInfo?.id,
        revalidateEscalationData,
    ])

    const handleVerifyEscalation = useCallback(async (
        status: 'APPROVED' | 'REJECTED',
    ): Promise<void> => {
        if (!verifyTarget?.decision.aiReviewDecisionId || !verifyTarget.escalation.id) {
            return
        }

        const notes = verifyNotes.trim()
        if (!notes) {
            toast.error('Reason is required to approve or reject this request.')
            return
        }

        setIsEscalationSubmitting(true)

        try {
            await updateAiReviewEscalation(
                verifyTarget.decision.aiReviewDecisionId,
                verifyTarget.escalation.id,
                {
                    approverNotes: notes,
                    status,
                },
            )
            toast.success(status === 'APPROVED' ? 'Escalation approved.' : 'Escalation rejected.')
            closeVerifyDialog()
            if (challengeInfo?.id) {
                await refreshChallengeReviewData(challengeInfo.id)
            }
            await revalidateEscalationData()
        } catch (error) {
            handleError(error)
        } finally {
            setIsEscalationSubmitting(false)
        }
    }, [
        verifyTarget,
        verifyNotes,
        closeVerifyDialog,
        challengeInfo?.id,
        revalidateEscalationData,
    ])

    const handleConfirmReopen = useCallback(async (): Promise<void> => {
        const reviewId = pendingReopen?.review?.reviewInfo?.id
        if (!reviewId) {
            closeReopenDialog()
            return
        }

        setIsReopening(true)

        try {
            await updateReview(reviewId, {
                committed: false,
                status: 'PENDING',
            })
            toast.success('Scorecard reopened.')
            closeReopenDialog()
            if (challengeInfo?.id) {
                await refreshChallengeReviewData(challengeInfo.id)
            }
        } catch (error) {
            handleError(error)
        } finally {
            setIsReopening(false)
        }
    }, [challengeInfo?.id, closeReopenDialog, pendingReopen])

    const tableKey = useMemo<string>(
        () => (actionChallengeRole ? `table-review-${actionChallengeRole}` : 'table-review'),
        [actionChallengeRole],
    )

    const canViewHistory = useMemo<boolean>(
        () => isAdmin || hasCopilotRole,
        [isAdmin, hasCopilotRole],
    )

    const shouldShowAggregatedActions = useMemo<boolean>(
        () => isReviewPhase(challengeInfo) && (myReviewerResourceIds.size > 0 || canManageCompletedReviews),
        [canManageCompletedReviews, challengeInfo, myReviewerResourceIds],
    )

    const scoreVisibilityConfig = useMemo<ScoreVisibilityConfig>(
        () => ({
            canDisplayScores: () => true,
            canViewScorecard: true,
            isAppealsTab: false,
        }),
        [],
    )

    const { canViewAllSubmissions }: UseRolePermissionsResult = useRolePermissions()

    const isCompletedDesignChallenge = useMemo(() => {
        if (!challengeInfo) return false
        const type = challengeInfo.track.name ? String(challengeInfo.track.name)
            .toLowerCase() : ''
        const status = challengeInfo.status ? String(challengeInfo.status)
            .toLowerCase() : ''
        return type === 'design' && (
            status === 'completed'
        )
    }, [challengeInfo])

    const isSubmissionsViewable = useMemo(() => {
        if (!challengeInfo?.metadata?.length) return false
        return challengeInfo.metadata.some(m => m.name === 'submissionsViewable' && String(m.value)
            .toLowerCase() === 'true')
    }, [challengeInfo])

    const canViewSubmissions = useMemo(() => {
        if (isCompletedDesignChallenge) {
            return canViewAllSubmissions || isSubmissionsViewable
        }

        return true
    }, [isCompletedDesignChallenge, isSubmissionsViewable, canViewAllSubmissions])

    const isSubmissionNotViewable = (submission: SubmissionRow): boolean => (
        !canViewSubmissions && String(submission.memberId) !== String(loginUserInfo?.userId)
    )

    const downloadButtonConfig = useMemo<DownloadButtonConfig>(
        () => ({
            downloadSubmission,
            getRestrictionMessageForMember,
            isDownloading,
            isSubmissionDownloadRestricted,
            isSubmissionDownloadRestrictedForMember,
            isSubmissionNotViewable,
            ownedMemberIds,
            restrictionMessage,
            shouldRestrictSubmitterToOwnSubmission: false,
        }),
        [
            downloadSubmission,
            getRestrictionMessageForMember,
            isDownloading,
            isSubmissionDownloadRestricted,
            isSubmissionDownloadRestrictedForMember,
            isSubmissionNotViewable,
            ownedMemberIds,
            restrictionMessage,
        ],
    )

    const renderActionsCell = useCallback<(submission: SubmissionReviewerRow) => JSX.Element>((
        submission: SubmissionReviewerRow,
    ) => {
        const reviews = submission.aggregated?.reviews ?? []
        const myReviewDetail = reviews.find(review => {
            const resourceId = review.reviewInfo?.resourceId ?? review.resourceId
            return resourceId ? myReviewerResourceIds.has(resourceId) : false
        })
        const actionEntries: Array<{ element: JSX.Element; wrapperKey: string }> = []

        const appendAction = (element: JSX.Element | undefined, fallbackKey: string): void => {
            if (!element) {
                return
            }

            const elementKeyValue = typeof element.key === 'string' || typeof element.key === 'number'
                ? String(element.key)
                : fallbackKey
            actionEntries.push({
                element,
                wrapperKey: `wrapper-${fallbackKey}-${elementKeyValue}`,
            })
        }

        const buildPrimaryAction = (): JSX.Element | undefined => {
            const reviewInfo = myReviewDetail?.reviewInfo
            const status = (reviewInfo?.status ?? '').toUpperCase()

            if ((hasReviewRole || isCopilotWithReviewerAssignments)
                && (status === 'COMPLETED' || status === 'SUBMITTED')) {
                return (
                    <div className={styles.completedAction} key='completed-indicator'>
                        <span className={styles.completedIcon}>
                            <IconOutline.CheckIcon />
                        </span>
                        <span className={styles.completedPill}>
                            Review Complete
                        </span>
                    </div>
                )
            }

            if (!hasReviewRole && !isCopilotWithReviewerAssignments) {
                return undefined
            }

            if (!myReviewDetail) {
                return undefined
            }

            const reviewId = reviewInfo?.id ?? myReviewDetail.reviewId
            if (reviewId) {
                return (
                    <Link
                        key='complete-review'
                        to={`./../reviews/${submission.id}?reviewId=${reviewId}`}
                        className={styles.submit}
                    >
                        <i className='icon-upload' />
                        Complete Review
                    </Link>
                )
            }

            return undefined
        }

        const buildReopenAction = (): JSX.Element | undefined => {
            if (!myReviewDetail?.reviewInfo?.id) {
                return undefined
            }

            const reviewDetail = myReviewDetail
            const reviewInfo = reviewDetail.reviewInfo!
            const status = (reviewInfo.status ?? '').toUpperCase()
            if (status !== 'COMPLETED') {
                return undefined
            }

            if (!isReviewPhaseCurrentlyOpen(challengeInfo, reviewInfo.phaseId)) {
                return undefined
            }

            const resourceId = reviewInfo.resourceId ?? reviewDetail.resourceId
            const isOwnReview = resourceId ? myReviewerResourceIds.has(resourceId) : false

            if (!canManageCompletedReviews && !isOwnReview) {
                return undefined
            }

            const reviewId = reviewInfo.id
            const isPendingReopen = pendingReopen?.review?.reviewInfo?.id === reviewId

            function handleReopenClick(): void {
                openReopenDialog(submission, reviewDetail)
            }

            return (
                <button
                    key='reopen-review'
                    type='button'
                    className={classNames(styles.submit, styles.textBlue)}
                    onClick={handleReopenClick}
                    disabled={isReopening && isPendingReopen}
                >
                    <i className='icon-reopen' />
                    Reopen Review
                </button>
            )
        }

        const historyKeyForRow = getSubmissionHistoryKey(submission.memberId, submission.id)
        const rowHistory = historyByMember.get(historyKeyForRow) ?? []

        const buildHistoryAction = (): JSX.Element | undefined => {
            if (!canViewHistory || !shouldShowHistoryActions) {
                return undefined
            }

            if (!rowHistory.length) {
                return undefined
            }

            return (
                <button
                    key='view-submission-history'
                    type='button'
                    className={styles.historyButton}
                    data-member-id={submission.memberId ?? ''}
                    data-submission-id={submission.id}
                    onClick={handleHistoryButtonClick}
                >
                    View Submission History
                </button>
            )
        }

        const buildEscalateAction = (): JSX.Element | undefined => {
            const isLocked = submission.status === 'AI_FAILED_REVIEW'
            if (!isLocked || !submission.id) {
                return undefined
            }

            const decision = escalationDecisionBySubmissionId.get(submission.id)
            if (!decision?.submissionLocked) {
                return undefined
            }

            const isReviewerOnly = (hasReviewRole || isCopilotWithReviewerAssignments)
                && !canManageCompletedReviews
            if (!isReviewerOnly || !isReviewPhase(challengeInfo)) {
                return undefined
            }

            const hasOwnEscalation = decision.escalations.some(escalation => (
                String(escalation.createdBy ?? '') === String(loginUserInfo?.userId ?? '')
            ))
            if (hasOwnEscalation) {
                return undefined
            }

            return (
                <button
                    key='escalate-submission'
                    type='button'
                    className={classNames(styles.actionButton, styles.textBlue)}
                    onClick={() => {
                        setEscalateTarget(submission)
                        setEscalationNotes('')
                    }}
                >
                    Escalate
                </button>
            )
        }

        const buildVerifyAction = (): JSX.Element | undefined => {
            const isLocked = submission.status === 'AI_FAILED_REVIEW'
            if (!isLocked || !submission.id || !canManageCompletedReviews) {
                return undefined
            }

            const decision = escalationDecisionBySubmissionId.get(submission.id)
            if (!decision?.submissionLocked) {
                return undefined
            }

            const pendingEscalation = decision.escalations.find(escalation => (
                escalation.status === 'PENDING_APPROVAL'
            ))

            if (!pendingEscalation) {
                return undefined
            }

            return (
                <button
                    key='verify-escalation'
                    type='button'
                    className={classNames(styles.actionButton, styles.textBlue)}
                    onClick={() => {
                        setVerifyTarget({
                            decision,
                            escalation: pendingEscalation,
                            submission,
                        })
                        setVerifyNotes('')
                    }}
                >
                    Verify
                </button>
            )
        }

        const buildUnlockAction = (): JSX.Element | undefined => {
            const isLocked = submission.status === 'AI_FAILED_REVIEW'
            if (!isLocked || !submission.id || !canManageCompletedReviews) {
                return undefined
            }

            const decision = escalationDecisionBySubmissionId.get(submission.id)
            if (!decision?.submissionLocked) {
                return undefined
            }

            return (
                <button
                    key='unlock-submission'
                    type='button'
                    className={classNames(styles.actionButton, styles.textBlue)}
                    onClick={() => {
                        setUnlockTarget(submission)
                        setUnlockNotes('')
                    }}
                >
                    Unlock
                </button>
            )
        }

        appendAction(buildPrimaryAction(), 'primary')
        appendAction(buildEscalateAction(), 'escalate')
        appendAction(buildVerifyAction(), 'verify')
        appendAction(buildUnlockAction(), 'unlock')
        appendAction(buildHistoryAction(), 'history')
        appendAction(buildReopenAction(), 'reopen')

        if (!actionEntries.length) {
            return (
                <span className={styles.notReviewed}>
                    --
                </span>
            )
        }

        if (actionEntries.length === 1) {
            return actionEntries[0].element
        }

        const renderActionEntry = (entry: { element: JSX.Element; wrapperKey: string }): JSX.Element => (
            <span
                key={entry.wrapperKey}
                className={styles.actionItem}
            >
                {entry.element}
            </span>
        )

        return (
            <span className={styles.actionsCell}>
                {actionEntries.map(renderActionEntry)}
            </span>
        )
    }, [
        canManageCompletedReviews,
        canViewHistory,
        challengeInfo,
        escalationDecisionBySubmissionId,
        handleHistoryButtonClick,
        hasReviewRole,
        historyByMember,
        isCopilotWithReviewerAssignments,
        isReopening,
        loginUserInfo?.userId,
        myReviewerResourceIds,
        openReopenDialog,
        pendingReopen,
        shouldShowHistoryActions,
    ])

    const columns = useMemo<TableColumn<SubmissionReviewerRow>[]>(() => {
        const submissionIdColumn: TableColumn<SubmissionReviewerRow> = {
            className: classNames(styles.submissionColumn, 'no-row-border'),
            columnId: 'submission-id',
            label: 'Submission ID',
            propertyName: 'id',
            renderer: (row: SubmissionReviewerRow) => (
                row.isFirstReviewerRow
                    ? renderSubmissionIdCell(row, downloadButtonConfig)
                    : <span />
            ),
            type: 'element',
        }

        const baseColumns: TableColumn<SubmissionReviewerRow>[] = [submissionIdColumn]

        if (!hideHandleColumn) {
            baseColumns.push({
                className: 'no-row-border',
                columnId: 'handle-aggregated',
                label: 'Submitter',
                propertyName: 'handle',
                renderer: (row: SubmissionReviewerRow) => (
                    row.isFirstReviewerRow
                        ? renderSubmitterHandleCell(row)
                        : <span />
                ),
                type: 'element',
            })
        }

        baseColumns.push({
            className: 'no-row-border',
            columnId: 'review-score',
            label: 'Review Score',
            renderer: (row: SubmissionReviewerRow) => (
                row.isFirstReviewerRow
                    ? renderReviewScoreCell(row, scoreVisibilityConfig)
                    : <span />
            ),
            type: 'element',
        })

        baseColumns.push(
            {
                columnId: 'reviewer',
                label: 'Reviewer',
                renderer: (row: SubmissionReviewerRow) => renderReviewerCell(
                    row,
                    row.reviewerIndex,
                ),
                type: 'element',
            },
            {
                columnId: 'review-date',
                label: 'Review Date',
                renderer: (row: SubmissionReviewerRow) => renderReviewDateCell(row),
                type: 'element',
            },
            {
                columnId: 'score',
                label: 'Score',
                renderer: (row: SubmissionReviewerRow) => renderScoreCell(
                    row,
                    row.reviewerIndex,
                    scoreVisibilityConfig,
                    challengeInfo,
                    pendingReopen,
                    canManageCompletedReviews,
                    isReopening,
                    openReopenDialog,
                ),
                type: 'element',
            },
            {
                columnId: 'review-result',
                label: 'Review Result',
                renderer: (row: SubmissionReviewerRow) => {
                    const isLocked = row.status === 'AI_FAILED_REVIEW'
                    if (!row.isFirstReviewerRow) {
                        return <span />
                    }

                    if (isLocked) {
                        return (
                            <span className={styles.statusLocked}>
                                AI Locked
                            </span>
                        )
                    }

                    const result = resolveSubmissionReviewResult(row, {
                        minimumPassingScoreByScorecardId,
                    })
                    if (result === 'PASS') {
                        return (
                            <span className={styles.resultPass}>
                                Pass
                            </span>
                        )
                    }

                    if (result === 'FAIL') {
                        return (
                            <span className={styles.resultFail}>
                                Fail
                            </span>
                        )
                    }

                    return <span>--</span>
                },
                type: 'element',
            },
        )

        if (shouldShowAggregatedActions) {
            baseColumns.push({
                className: styles.textBlue,
                columnId: 'actions',
                label: 'Actions',
                renderer: (row: SubmissionReviewerRow) => (
                    row.isFirstReviewerRow ? renderActionsCell(row) : (
                        <span className={styles.notReviewed}>
                            --
                        </span>
                    )
                ),
                type: 'element',
            })
        }

        if (props.aiReviewers) {
            baseColumns.push({
                columnId: 'ai-reviews-table',
                isExpand: true,
                label: '',
                renderer: (row: SubmissionReviewerRow, allRows?: SubmissionReviewerRow[]) => {
                    if (!row.isLastReviewerRow || !props.aiReviewers) {
                        return <span />
                    }

                    const rows = allRows ?? []
                    const firstIndexForSubmission = rows.findIndex(candidate => (
                        candidate.id === row.id && candidate.isFirstReviewerRow
                    ))
                    const defaultOpen = firstIndexForSubmission === 0

                    return (
                        <CollapsibleAiReviewsRow
                            className={styles.aiReviews}
                            aiReviewers={props.aiReviewers}
                            submission={row as any}
                            defaultOpen={defaultOpen}
                        />
                    )
                },
                type: 'element',
            })
        }

        return baseColumns
    }, [
        downloadButtonConfig,
        hideHandleColumn,
        minimumPassingScoreByScorecardId,
        renderActionsCell,
        scoreVisibilityConfig,
        shouldShowAggregatedActions,
        canManageCompletedReviews,
        isReopening,
        openReopenDialog,
        challengeInfo,
        pendingReopen,
    ])

    const columnsMobile = useMemo<MobileTableColumn<SubmissionReviewerRow>[][]>(
        () => columns.map(column => {
            const resolvedLabel = typeof column.label === 'function'
                ? column.label() ?? ''
                : (column.label ?? '')
            const labelForAction = typeof column.label === 'string'
                ? column.label
                : resolvedLabel

            if (labelForAction === 'Action' || labelForAction === 'Actions') {
                return [
                    {
                        ...column,
                        colSpan: 2,
                        mobileType: 'last-value',
                    },
                ]
            }

            const labelText = resolvedLabel || ''

            return [
                (labelText && (
                    {
                        ...column,
                        className: '',
                        label: labelText ? `${labelText} label` : 'label',
                        mobileType: 'label',
                        renderer: () => (
                            <div>
                                {labelText}
                                :
                            </div>
                        ),
                        type: 'element',
                    }
                )),
                {
                    ...column,
                    colSpan: labelText ? 1 : 2,
                    mobileType: 'last-value',
                },
            ].filter(Boolean) as MobileTableColumn<SubmissionReviewerRow>[]
        }),
        [columns],
    )

    return (
        <TableWrapper
            className={classNames(
                styles.container,
                className,
                'enhanced-table',
            )}
        >
            {isTablet ? (
                <TableMobile columns={columnsMobile} data={reviewerRows} />
            ) : (
                <Table
                    key={tableKey}
                    showExpand
                    expandMode='always'
                    columns={columns}
                    data={reviewerRows}
                    disableSorting
                    onToggleSort={_.noop}
                    removeDefaultSort
                />
            )}

            <BaseModal
                open={Boolean(escalateTarget)}
                onClose={closeEscalateDialog}
                title={`Escalate Submission #${escalateTarget?.id ?? ''}`}
                classNames={{
                    modal: styles.escalationModal,
                }}
            >
                <div className={styles.escalationDescription}>
                    Escalate this submission to the copilot. Add your reason below why you think
                    the submission should pass the AI Review.
                </div>
                <textarea
                    className={styles.escalationTextarea}
                    placeholder='Add your notes here...'
                    value={escalationNotes}
                    onChange={event => setEscalationNotes(event.target.value)}
                    disabled={isEscalationSubmitting}
                />
                <div className={styles.escalationActions}>
                    <button
                        type='button'
                        className='borderButton'
                        onClick={closeEscalateDialog}
                        disabled={isEscalationSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type='button'
                        className='filledButton'
                        onClick={handleSubmitEscalation}
                        disabled={isEscalationSubmitting}
                    >
                        Send to Copilot
                    </button>
                </div>
            </BaseModal>

            <BaseModal
                open={Boolean(verifyTarget)}
                onClose={closeVerifyDialog}
                title='Verify Escalation Request'
                classNames={{
                    modal: styles.escalationModal,
                }}
            >
                <div className={styles.verifySubmission}>Submission: #{verifyTarget?.submission.id ?? ''}</div>
                <div className={styles.escalationDescription}>
                    The AI reviewers failed submission #{verifyTarget?.submission.id ?? ''}. The reviewer
                    has challenged this result and is requesting a manual override. Review their
                    reasoning below and decide whether to approve or reject this escalation.
                </div>
                <div className={styles.verifyDetails}>
                    <div>
                        <strong>Reviewer:</strong>{' '}
                        {handleByMemberId.get(String(verifyTarget?.escalation.createdBy ?? ''))
                            ?? verifyTarget?.escalation.createdBy
                            ?? '--'}
                    </div>
                    <div>
                        <strong>Reviewer’s Note:</strong>
                    </div>
                    <div>{verifyTarget?.escalation.escalationNotes ?? '--'}</div>
                </div>
                <textarea
                    className={styles.escalationTextarea}
                    placeholder='Add your reasoning before approving or rejecting...'
                    value={verifyNotes}
                    onChange={event => setVerifyNotes(event.target.value)}
                    disabled={isEscalationSubmitting}
                />
                <div className={styles.escalationActions}>
                    <button
                        type='button'
                        className='borderButton'
                        onClick={() => {
                            handleVerifyEscalation('REJECTED')
                        }}
                        disabled={isEscalationSubmitting}
                    >
                        Reject Request
                    </button>
                    <button
                        type='button'
                        className='filledButton'
                        onClick={() => {
                            handleVerifyEscalation('APPROVED')
                        }}
                        disabled={isEscalationSubmitting}
                    >
                        Approve Override
                    </button>
                </div>
            </BaseModal>

            <BaseModal
                open={Boolean(unlockTarget)}
                onClose={closeUnlockDialog}
                title='Unlock Submission'
                classNames={{
                    modal: styles.escalationModal,
                }}
            >
                <div className={styles.verifySubmission}>Submission: #{unlockTarget?.id ?? ''}</div>
                <div className={styles.escalationDescription}>
                    The AI reviewers failed submission #{unlockTarget?.id ?? ''}. As a copilot/admin,
                    you can unlock it and allow it to proceed to human review. Add your reason below.
                </div>
                <textarea
                    className={styles.escalationTextarea}
                    placeholder='Add your reasoning for approving the submission...'
                    value={unlockNotes}
                    onChange={event => setUnlockNotes(event.target.value)}
                    disabled={isEscalationSubmitting}
                />
                <div className={styles.escalationActions}>
                    <button
                        type='button'
                        className='borderButton'
                        onClick={closeUnlockDialog}
                        disabled={isEscalationSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type='button'
                        className='filledButton'
                        onClick={handleSubmitUnlock}
                        disabled={isEscalationSubmitting}
                    >
                        Unlock Submission
                    </button>
                </div>
            </BaseModal>

            <SubmissionHistoryModal
                open={Boolean(historyKey)}
                onClose={closeHistoryModal}
                submissions={historyEntriesForModal}
                downloadSubmission={downloadSubmission}
                isDownloading={isDownloading}
                getRestriction={getHistoryRestriction}
                getSubmissionMeta={resolveSubmissionMeta}
                aiReviewers={props.aiReviewers}
            />

            <ConfirmModal
                title='Reopen Scorecard Confirmation'
                open={Boolean(pendingReopen)}
                onClose={closeReopenDialog}
                onConfirm={handleConfirmReopen}
                cancelText='Cancel'
                action='Confirm'
                isLoading={isReopening}
            >
                <div>
                    {pendingReopen?.isOwnReview
                        ? REOPEN_MESSAGE_SELF
                        : REOPEN_MESSAGE_OTHER}
                </div>
            </ConfirmModal>
        </TableWrapper>
    )
}

export default TableReview
