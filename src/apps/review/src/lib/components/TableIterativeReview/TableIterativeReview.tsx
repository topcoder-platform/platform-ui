/**
 * Table Iterative Review.
 */
import {
    FC,
    MouseEvent,
    useCallback,
    useContext,
    useMemo,
} from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import _ from 'lodash'
import classNames from 'classnames'

import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { IsRemovingType } from '~/apps/admin/src/lib/models'
import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { EnvironmentConfig } from '~/config'
import { UserRole } from '~/libs/core'
import {
    copyTextToClipboard,
    useWindowSize,
    WindowSize,
} from '~/libs/shared'
import { IconOutline, Table, TableColumn, Tooltip } from '~/libs/ui'

import { SUBMITTER } from '../../../config/index.config'
import { ChallengeDetailContext, ReviewAppContext } from '../../contexts'
import type { useRoleProps } from '../../hooks'
import { useRole, useScorecardPassingScores, useSubmissionDownloadAccess } from '../../hooks'
import type { UseRolePermissionsResult } from '../../hooks/useRolePermissions'
import { useRolePermissions } from '../../hooks/useRolePermissions'
import type { UseSubmissionDownloadAccessResult } from '../../hooks/useSubmissionDownloadAccess'
import {
    BackendResource,
    ChallengeDetailContextModel,
    ReviewAppContextModel,
    ReviewInfo,
    SubmissionInfo,
} from '../../models'
import { getHandleUrl, isReviewPhase } from '../../utils'
import type { SubmissionRow } from '../common/types'
import { resolveSubmissionReviewResult } from '../common/reviewResult'
import { ProgressBar } from '../ProgressBar'
import { TableWrapper } from '../TableWrapper'

import styles from './TableIterativeReview.module.scss'

interface Props {
    className?: string
    datas: SubmissionInfo[]
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    hideHandleColumn?: boolean
    columnLabel?: string
    hideSubmissionColumn?: boolean
    isChallengeCompleted?: boolean
    hasPassedThreshold?: boolean
}

interface ScoreMetadata {
    outcome?: unknown
    result?: unknown
    status?: unknown
    score?: unknown
    isPassing?: unknown
    passing?: unknown
    passed?: unknown
}

const POST_MORTEM_OUTCOME_KEYS = ['outcome', 'result', 'status']
const POST_MORTEM_PASS_KEYS = ['isPassing', 'passing', 'passed']
const PASS_KEYWORDS = new Set(['pass', 'passed', 'yes', 'true', 'y'])
const FAIL_KEYWORDS = new Set(['fail', 'failed', 'no pass', 'no-pass', 'nopass', 'false', 'no', 'n'])

const normaliseAlphaKey = (value: string): string => value.replace(/[^a-z]/g, '')

const normaliseOutcomeValue = (value: unknown): 'Pass' | 'Fail' | undefined => {
    if (typeof value === 'boolean') {
        return value ? 'Pass' : 'Fail'
    }

    if (typeof value !== 'string') {
        return undefined
    }

    const trimmed = value.trim()
    if (!trimmed) {
        return undefined
    }

    const lower = trimmed.toLowerCase()
    if (PASS_KEYWORDS.has(lower)) {
        return 'Pass'
    }

    if (FAIL_KEYWORDS.has(lower)) {
        return 'Fail'
    }

    return undefined
}

const parseMetadataObject = (
    metadata: ScoreMetadata | string | null | undefined,
): Record<string, unknown> | undefined => {
    if (!metadata) {
        return undefined
    }

    if (typeof metadata === 'object') {
        return metadata as Record<string, unknown>
    }

    if (typeof metadata === 'string') {
        const trimmed = metadata.trim()
        if (!trimmed) {
            return undefined
        }

        try {
            const parsed = JSON.parse(trimmed)
            if (parsed && typeof parsed === 'object') {
                return parsed as Record<string, unknown>
            }
        } catch {
            // Fall through to treat as raw outcome string
        }

        return { outcome: trimmed }
    }

    return undefined
}

const toFiniteNumber = (value: unknown): number | undefined => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : undefined
    }

    if (typeof value === 'string') {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : undefined
    }

    return undefined
}

const getReviewScore = (review: ReviewInfo | undefined): number | undefined => {
    if (!review) {
        return undefined
    }

    const metadata = review.metadata as ScoreMetadata | undefined
    const metadataScore = metadata ? toFiniteNumber(metadata.score) : undefined
    const finalScore = toFiniteNumber(review.finalScore)
    const initialScore = toFiniteNumber(review.initialScore)

    return metadataScore ?? finalScore ?? initialScore ?? undefined
}

const resolvePostMortemOutcome = (submission: SubmissionInfo): 'Pass' | 'Fail' | undefined => {
    const review = submission.review
    if (!review) {
        return undefined
    }

    const metadataObject = parseMetadataObject(review.metadata as ScoreMetadata | string | undefined)

    if (metadataObject) {
        for (const key of POST_MORTEM_OUTCOME_KEYS) {
            const value = metadataObject[key]
            const outcome = normaliseOutcomeValue(value)
            if (outcome) {
                return outcome
            }
        }

        for (const key of POST_MORTEM_PASS_KEYS) {
            const value = metadataObject[key]
            const outcome = normaliseOutcomeValue(value)
            if (outcome) {
                return outcome
            }
        }
    }

    const directOutcome = normaliseOutcomeValue(review.metadata)
    if (directOutcome) {
        return directOutcome
    }

    if (typeof submission.isPassingReview === 'boolean') {
        return submission.isPassingReview ? 'Pass' : 'Fail'
    }

    const reviewScore = getReviewScore(review)
    if (typeof reviewScore === 'number') {
        if (reviewScore > 0) {
            return 'Pass'
        }

        if (reviewScore === 0) {
            return 'Fail'
        }
    }

    return undefined
}

const formatScore = (score: number): string => (
    Number.isInteger(score) ? `${score}` : score.toFixed(2)
)

const formatOutcome = (value: unknown): string | undefined => {
    if (typeof value !== 'string') {
        return undefined
    }

    const trimmed = value.trim()

    if (!trimmed) {
        return undefined
    }

    return _.upperFirst(_.toLower(trimmed))
}

const formatStatusLabel = (status: string, pendingLabel = 'Pending Review'): string => {
    const trimmedStatus = status.trim()
    const normalised = trimmedStatus ? _.toUpper(trimmedStatus) : ''

    switch (normalised) {
        case 'IN_PROGRESS':
            return 'In Progress'
        case 'PENDING':
            return pendingLabel
        case 'QUEUED':
            return 'Queued'
        default:
            return _.upperFirst(_.toLower(normalised))
    }
}

const hasActiveReview = (review: ReviewInfo | undefined): boolean => (
    Boolean(review?.id)
)

const DOWNLOAD_OWN_SUBMISSION_TOOLTIP
    = 'You can download only your own submissions until the challenge completes or fails review.'
const VIEW_OWN_SCORECARD_TOOLTIP = 'You can only view scorecards for your own submissions.'

interface CompletedReviewRenderParams {
    canAccessReview: boolean
    outcomeLabel?: string
    reviewId?: string
    reviewPath?: string
    reviewScore?: number
}

const renderCompletedReviewCell = ({
    canAccessReview,
    outcomeLabel,
    reviewId,
    reviewPath,
    reviewScore,
}: CompletedReviewRenderParams): JSX.Element => {
    if (reviewScore !== undefined) {
        const normalisedOutcome = outcomeLabel?.toLowerCase()
        const isPassOutcome = normalisedOutcome === 'pass'
        const isFailOutcome = normalisedOutcome === 'fail'
        const outcomeIndicator = isPassOutcome ? (
            <span
                className={classNames(styles.statusIcon, styles.passIcon)}
                aria-label='Pass'
            >
                <IconOutline.CheckCircleIcon aria-hidden />
            </span>
        ) : isFailOutcome ? (
            <span
                className={classNames(styles.statusIcon, styles.failIcon)}
                aria-label='Fail'
            >
                <IconOutline.XCircleIcon aria-hidden />
            </span>
        ) : undefined
        const scoreDisplay = formatScore(reviewScore)
        const scoreElement = canAccessReview && reviewPath ? (
            <Link
                to={reviewPath}
                className={styles.scoreLink}
            >
                {scoreDisplay}
            </Link>
        ) : (
            <span className={styles.scoreLink}>
                {scoreDisplay}
            </span>
        )
        const renderedScoreElement = !canAccessReview && reviewPath ? (
            <Tooltip
                content={VIEW_OWN_SCORECARD_TOOLTIP}
                triggerOn='click-hover'
            >
                <span className={styles.tooltipTrigger}>
                    {scoreElement}
                </span>
            </Tooltip>
        ) : (
            scoreElement
        )

        return (
            <div className={styles.reviewCell}>
                <div className={styles.scoreRow}>
                    {outcomeIndicator}
                    {renderedScoreElement}
                </div>
                {!outcomeIndicator && outcomeLabel ? (
                    <span className={styles.outcome}>
                        {outcomeLabel}
                    </span>
                ) : undefined}
            </div>
        )
    }

    if (!reviewId || !reviewPath) {
        return <></>
    }

    const viewScorecardContent = canAccessReview ? (
        <Link
            to={reviewPath}
            className={styles.scoreLink}
        >
            View Scorecard
        </Link>
    ) : (
        <span className={styles.scoreLink}>
            View Scorecard
        </span>
    )

    return !canAccessReview ? (
        <Tooltip
            content={VIEW_OWN_SCORECARD_TOOLTIP}
            triggerOn='click-hover'
        >
            <span className={styles.tooltipTrigger}>
                {viewScorecardContent}
            </span>
        </Tooltip>
    ) : (
        viewScorecardContent
    )
}

interface RenderStandardReviewParams {
    canAccessReview: boolean
    data: SubmissionInfo
    pendingStatusLabel: string
}

const renderStandardReviewCell = ({
    canAccessReview,
    data,
    pendingStatusLabel,
}: RenderStandardReviewParams): JSX.Element => {
    const review = data.review

    if (!hasActiveReview(review)) {
        return (
            <span className={styles.pendingText}>
                Pending
            </span>
        )
    }

    const status = (review?.status ?? '').toUpperCase()
    const reviewScore = getReviewScore(review)
    const outcomeLabel = formatOutcome(
        (review?.metadata as ScoreMetadata | undefined)?.outcome,
    )
    const reviewId = review?.id
    const reviewPath = reviewId ? `./../review/${reviewId}` : undefined
    const isCompleted = ['COMPLETED', 'SUBMITTED'].includes(status)

    if (isCompleted) {
        return renderCompletedReviewCell({
            canAccessReview,
            outcomeLabel,
            reviewId,
            reviewPath,
            reviewScore,
        })
    }

    if (review?.reviewProgress) {
        return (
            <div className={styles.reviewCell}>
                <ProgressBar progress={review.reviewProgress} />
                <span className={styles.statusBadgePending}>
                    In Progress
                </span>
            </div>
        )
    }

    if (status) {
        return (
            <span className={styles.statusBadgePending}>
                {formatStatusLabel(status, pendingStatusLabel)}
            </span>
        )
    }

    return (
        <span className={styles.pendingText}>
            Pending
        </span>
    )
}

const renderPostMortemReviewCell = (data: SubmissionInfo): JSX.Element => {
    const review = data.review

    if (!hasActiveReview(review)) {
        return (
            <span className={styles.pendingText}>
                --
            </span>
        )
    }

    const status = (review?.status ?? '').toUpperCase()
    if (status !== 'COMPLETED') {
        return (
            <span className={styles.pendingText}>
                --
            </span>
        )
    }

    const outcomeLabel = resolvePostMortemOutcome(data)
    if (!outcomeLabel) {
        return (
            <span className={styles.pendingText}>
                --
            </span>
        )
    }

    const isPassOutcome = outcomeLabel === 'Pass'

    return (
        <div className={styles.postMortemResult}>
            <span
                className={classNames(
                    styles.statusIcon,
                    isPassOutcome ? styles.passIcon : styles.failIcon,
                )}
                aria-label={outcomeLabel}
            >
                {isPassOutcome ? (
                    <IconOutline.CheckCircleIcon aria-hidden />
                ) : (
                    <IconOutline.XCircleIcon aria-hidden />
                )}
            </span>
            <span
                className={classNames(
                    styles.postMortemOutcomeLabel,
                    isPassOutcome ? styles.passText : styles.failText,
                )}
            >
                {outcomeLabel}
            </span>
        </div>
    )
}

export const TableIterativeReview: FC<Props> = (props: Props) => {
    const className = props.className
    const datas = props.datas
    const downloadSubmission = props.downloadSubmission
    const hideHandleColumn = props.hideHandleColumn
    const hideSubmissionColumn = props.hideSubmissionColumn ?? false
    const isDownloading = props.isDownloading
    const columnLabel = props.columnLabel || 'Iterative Review'
    const { challengeInfo, myRoles, resources }: ChallengeDetailContextModel = useContext(
        ChallengeDetailContext,
    )
    const {
        isSubmissionDownloadRestricted,
        restrictionMessage,
        isSubmissionDownloadRestrictedForMember,
        getRestrictionMessageForMember,
        shouldRestrictSubmitterToOwnSubmission,
    }: UseSubmissionDownloadAccessResult = useSubmissionDownloadAccess()
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 744, [screenWidth])
    const { loginUserInfo }: ReviewAppContextModel = useContext(ReviewAppContext)
    const { actionChallengeRole, myChallengeResources }: useRoleProps = useRole()
    const { isCopilotWithReviewerAssignments }: UseRolePermissionsResult = useRolePermissions()
    const isSubmitterView = actionChallengeRole === SUBMITTER
    const ownedMemberIds: Set<string> = useMemo(
        (): Set<string> => new Set(
            myChallengeResources
                .map(resource => resource.memberId)
                .filter((memberId): memberId is string => Boolean(memberId)),
        ),
        [myChallengeResources],
    )

    const scorecardIds = useMemo<Set<string>>(() => {
        const ids = new Set<string>()

        for (const entry of datas ?? []) {
            const scorecardId = entry.review?.scorecardId?.trim()
            if (scorecardId) {
                ids.add(scorecardId)
            }
        }

        return ids
    }, [datas])

    const minimumPassingScoreByScorecardId = useScorecardPassingScores(scorecardIds)

    const myResourceIds: Set<string> = useMemo(
        (): Set<string> => new Set(
            (myChallengeResources ?? [])
                .map(resource => resource.id)
                .filter((resourceId): resourceId is string => Boolean(resourceId)),
        ),
        [myChallengeResources],
    )

    const resourcesById = useMemo<Record<string, BackendResource>>(() => {
        const mapping: Record<string, BackendResource> = {};
        (resources ?? []).forEach(resource => {
            if (resource?.id) {
                mapping[resource.id] = resource
            }
        })
        return mapping
    }, [resources])

    const isAdmin = useMemo(
        () => loginUserInfo?.roles?.some(
            role => typeof role === 'string'
                && role.toLowerCase() === UserRole.administrator,
        ) ?? false,
        [loginUserInfo?.roles],
    )

    const normalizedRoles = useMemo(
        () => (myRoles ?? [])
            .map(role => (role || '').toLowerCase()),
        [myRoles],
    )

    const hasCopilotRole = useMemo(
        () => normalizedRoles
            .some(role => {
                const normalized = normaliseAlphaKey(role)
                return normalized.includes('copilot')
            }),
        [normalizedRoles],
    )

    const isAdminOrCopilot = useMemo(
        () => isAdmin || hasCopilotRole,
        [hasCopilotRole, isAdmin],
    )

    const hasIterativeReviewerRole = useMemo(
        () => normalizedRoles
            .some(role => {
                const normalized = normaliseAlphaKey(role)
                return normalized.includes('iterativereviewer')
            }),
        [normalizedRoles],
    )

    const hasPostMortemReviewerRole = useMemo(
        () => normalizedRoles
            .some(role => {
                const normalized = normaliseAlphaKey(role)
                return normalized.includes('postmortemreviewer')
            }),
        [normalizedRoles],
    )

    const hasApproverRole = useMemo(
        () => normalizedRoles
            .some(role => {
                const normalized = normaliseAlphaKey(role)
                return normalized.includes('approver')
            }),
        [normalizedRoles],
    )

    const isActiveChallenge = useMemo(() => {
        const status = (challengeInfo?.status ?? '')
            .toString()
            .toLowerCase()
        return status === 'active' || status.includes('active ')
    }, [challengeInfo?.status])

    const isCurrentPhaseApproval = useMemo(
        () => (
            (challengeInfo?.currentPhaseObject?.name
                ?? challengeInfo?.currentPhase
                ?? '')
        )
            .toString()
            .toLowerCase() === 'approval',
        [challengeInfo?.currentPhase, challengeInfo?.currentPhaseObject?.name],
    )

    const isF2FOrTopgearTask = useMemo(() => {
        const typeName = (challengeInfo?.type?.name || '').toString()
            .toLowerCase()
        const trackName = (challengeInfo?.track?.name || '').toString()
            .toLowerCase()
        return typeName === 'first2finish'
            || trackName === 'first2finish'
            || typeName === 'topgear task'
            || trackName === 'topgear task'
    }, [challengeInfo?.type?.name, challengeInfo?.track?.name])

    // Specifically detect First2Finish (exclude Topgear Task)
    const isFirst2Finish = useMemo(() => {
        const typeName = (challengeInfo?.type?.name || '').toString()
            .toLowerCase()
        const trackName = (challengeInfo?.track?.name || '').toString()
            .toLowerCase()
        return typeName === 'first2finish' || trackName === 'first2finish'
    }, [challengeInfo?.type?.name, challengeInfo?.track?.name])

    const isApproverResourceAssigned = useMemo(
        () => (datas ?? []).some(entry => {
            const resourceId = entry.review?.resourceId
            return resourceId ? myResourceIds.has(resourceId) : false
        }),
        [datas, myResourceIds],
    )

    const normalisedColumnLabel = (columnLabel || '')
        .trim()
        .toLowerCase()
    const columnLabelKey = normaliseAlphaKey(normalisedColumnLabel)
    const isPostMortemColumn = columnLabelKey === 'postmortem'
    const isApprovalColumn = columnLabelKey === 'approval'

    const submissionColumn: TableColumn<SubmissionInfo> = useMemo(
        () => ({
            className: styles.submissionColumn,
            columnId: 'submission-id',
            label: 'Submission ID',
            propertyName: 'id',
            renderer: (data: SubmissionInfo) => {
                const isOwnedSubmission = data.memberId
                    ? ownedMemberIds.has(data.memberId)
                    : false
                const isOwnershipRestricted = shouldRestrictSubmitterToOwnSubmission
                    && isSubmitterView
                    && !isOwnedSubmission
                const isRestrictedForMember = isSubmissionDownloadRestrictedForMember(
                    data.memberId,
                )
                const memberRestrictionMessage = getRestrictionMessageForMember(
                    data.memberId,
                )
                const failedScan = (data as SubmissionInfo).virusScan === false
                const isButtonDisabled = Boolean(
                    isDownloading[data.id]
                    || isRestrictedForMember
                    || failedScan,
                )

                const downloadButton = (
                    <button
                        onClick={function onClick() {
                            if (
                                isRestrictedForMember
                                || failedScan
                                || isOwnershipRestricted
                            ) {
                                return
                            }

                            downloadSubmission(data.id)
                        }}
                        className={styles.textBlue}
                        disabled={isButtonDisabled}
                        type='button'
                    >
                        {data.id}
                    </button>
                )

                async function handleCopySubmissionId(
                    event: MouseEvent<HTMLButtonElement>,
                ): Promise<void> {
                    event.stopPropagation()
                    event.preventDefault()

                    if (!data.id) {
                        return
                    }

                    await copyTextToClipboard(data.id)
                    toast.success('Submission ID copied to clipboard', {
                        toastId: `challenge-submission-id-copy-${data.id}`,
                    })
                }

                let tooltipContent: string | undefined
                if (failedScan) {
                    tooltipContent = 'Submission failed virus scan'
                } else if (isRestrictedForMember) {
                    tooltipContent = memberRestrictionMessage ?? restrictionMessage
                } else if (isOwnershipRestricted) {
                    tooltipContent = DOWNLOAD_OWN_SUBMISSION_TOOLTIP
                } else if (isSubmissionDownloadRestricted && restrictionMessage) {
                    tooltipContent = restrictionMessage
                }

                const downloadControl = isOwnershipRestricted ? (
                    <span className={styles.textBlue}>
                        {data.id}
                    </span>
                ) : (
                    downloadButton
                )

                const renderedDownloadButton = tooltipContent ? (
                    <Tooltip
                        content={tooltipContent}
                        triggerOn='click-hover'
                    >
                        <span className={styles.tooltipTrigger}>
                            {downloadControl}
                        </span>
                    </Tooltip>
                ) : (
                    downloadControl
                )

                return (
                    <span className={styles.submissionCell}>
                        {renderedDownloadButton}
                        <button
                            type='button'
                            className={styles.copyButton}
                            aria-label='Copy submission ID'
                            title='Copy submission ID'
                            onClick={handleCopySubmissionId}
                            disabled={!data.id}
                        >
                            <IconOutline.DocumentDuplicateIcon />
                        </button>
                    </span>
                )
            },
            type: 'element',
        }),
        [
            getRestrictionMessageForMember,
            isSubmissionDownloadRestricted,
            isSubmissionDownloadRestrictedForMember,
            downloadSubmission,
            isDownloading,
            restrictionMessage,
            isSubmitterView,
            shouldRestrictSubmitterToOwnSubmission,
            ownedMemberIds,
        ],
    )

    const postMortemSubmissionColumn: TableColumn<SubmissionInfo> = useMemo(
        () => ({
            className: styles.submissionColumn,
            columnId: 'submission-id',
            label: 'Submission',
            propertyName: 'id',
            renderer: () => (
                <span className={styles.submissionLabel}>
                    Post-Mortem
                </span>
            ),
            type: 'element',
        }),
        [],
    )

    const handleColumn: TableColumn<SubmissionInfo> | undefined = useMemo(() => {
        if (hideHandleColumn) {
            return undefined
        }

        return {
            columnId: 'handle',
            label: 'Handle',
            propertyName: 'handle',
            renderer: (data: SubmissionInfo) => (
                <a
                    href={getHandleUrl(data.userInfo)}
                    target='_blank'
                    rel='noreferrer'
                    style={{
                        color: data.userInfo?.handleColor,
                    }}
                    onClick={function onClick() {
                        window.open(
                            getHandleUrl(data.userInfo),
                            '_blank',
                        )
                    }}
                >
                    {data.userInfo?.memberHandle ?? ''}
                </a>
            ),
            type: 'element',
        }
    }, [hideHandleColumn])

    const reviewColumn: TableColumn<SubmissionInfo> = useMemo(
        () => ({
            columnId: 'iterative-review',
            label: isPostMortemColumn
                ? 'Post-Mortem Result'
                : (columnLabel || 'Iterative Review'),
            renderer: (data: SubmissionInfo) => {
                if (isPostMortemColumn) {
                    return renderPostMortemReviewCell(data)
                }

                const isOwnedSubmission = data.memberId
                    ? ownedMemberIds.has(data.memberId)
                    : false
                const canAccessReview = !isSubmitterView
                    || isOwnedSubmission
                    || Boolean(props.isChallengeCompleted && props.hasPassedThreshold)
                const pendingStatusLabel = isApprovalColumn
                    ? 'Pending Approval'
                    : 'Pending Review'
                return renderStandardReviewCell({
                    canAccessReview,
                    data,
                    pendingStatusLabel,
                })
            },
            type: 'element',
        }),
        [
            columnLabel,
            isApprovalColumn,
            isPostMortemColumn,
            isSubmitterView,
            ownedMemberIds,
            props.isChallengeCompleted,
            props.hasPassedThreshold,
        ],
    )

    const reviewDateColumn: TableColumn<SubmissionInfo> = useMemo(
        () => ({
            columnId: 'review-date',
            label: isApprovalColumn ? 'Approval Date' : 'Review Date',
            renderer: (data: SubmissionInfo) => {
                const review = data.review

                const status = (review?.status ?? '').toUpperCase()
                const isCompleted = ['COMPLETED', 'SUBMITTED'].includes(status)

                if (!hasActiveReview(review) || !isCompleted) {
                    return (
                        <span className={styles.pendingText}>
                            Not Reviewed
                        </span>
                    )
                }

                const reviewDate = review?.updatedAtString
                    || review?.reviewDateString
                    || review?.createdAtString

                return reviewDate ? (
                    <span>{reviewDate}</span>
                ) : (
                    <span className={styles.pendingText}>Not Reviewed</span>
                )
            },
            type: 'element',
        }),
        [isApprovalColumn],
    )

    const approvalResultColumn: TableColumn<SubmissionInfo> | undefined = useMemo(() => {
        if (!isApprovalColumn) {
            return undefined
        }

        return {
            columnId: 'approval-result',
            label: 'Approval Result',
            renderer: (data: SubmissionInfo) => {
                const review = data.review
                const status = (review?.status ?? '').toUpperCase()
                const hasReview = hasActiveReview(review)
                const isCompleted = ['COMPLETED', 'SUBMITTED'].includes(status)

                if (!hasReview) {
                    return <span>--</span>
                }

                if (!isCompleted) {
                    return <span>--</span>
                }

                const outcome = resolveSubmissionReviewResult(
                    data as SubmissionRow,
                    {
                        minimumPassingScoreByScorecardId,
                    },
                )

                if (outcome === 'PASS') {
                    return (
                        <span className={styles.resultPass}>
                            Pass
                        </span>
                    )
                }

                if (outcome === 'FAIL') {
                    return (
                        <span className={styles.resultFail}>
                            Fail
                        </span>
                    )
                }

                return <span>--</span>
            },
            type: 'element',
        }
    }, [isApprovalColumn, minimumPassingScoreByScorecardId])

    const shouldShowApproverColumn = useMemo(
        () => isApprovalColumn
            && isActiveChallenge
            && isCurrentPhaseApproval
            && (isAdminOrCopilot || hasApproverRole || isApproverResourceAssigned),
        [
            hasApproverRole,
            isActiveChallenge,
            isAdminOrCopilot,
            isApprovalColumn,
            isApproverResourceAssigned,
            isCurrentPhaseApproval,
        ],
    )

    const approverColumn: TableColumn<SubmissionInfo> | undefined = useMemo(() => {
        if (!shouldShowApproverColumn) {
            return undefined
        }

        return {
            columnId: 'approver',
            label: 'Approver',
            renderer: (data: SubmissionInfo) => {
                const resourceId = data.review?.resourceId
                const resource = resourceId ? resourcesById[resourceId] : undefined
                const handle = resource?.memberHandle?.trim()
                    ?? data.review?.reviewerHandle?.trim()

                if (!handle) {
                    return <span>--</span>
                }

                const color = resource?.handleColor
                    ?? data.review?.reviewerHandleColor
                    ?? '#2a2a2a'
                const url = resource
                    ? getHandleUrl(resource)
                    : `${EnvironmentConfig.REVIEW.PROFILE_PAGE_URL}/${encodeURIComponent(handle)}`

                return (
                    <a
                        href={url}
                        target='_blank'
                        rel='noreferrer'
                        style={{ color }}
                        onClick={function onClick() {
                            window.open(url, '_blank')
                        }}
                    >
                        {handle}
                    </a>
                )
            },
            type: 'element',
        }
    }, [shouldShowApproverColumn, resourcesById])

    const reviewerColumn: TableColumn<SubmissionInfo> = useMemo(
        () => ({
            columnId: 'reviewer',
            label: isPostMortemColumn ? 'Post-Mortem Reviewer' : 'Reviewer',
            renderer: (data: SubmissionInfo) => {
                if (isPostMortemColumn) {
                    const reviewerEntries = (data.reviews ?? [])
                        .map(reviewResult => {
                            const handle = reviewResult.reviewerHandle?.trim()
                            if (!handle) {
                                return undefined
                            }

                            return {
                                color: reviewResult.reviewerHandleColor ?? '#2a2a2a',
                                handle,
                            }
                        })
                        .filter(
                            (entry): entry is { handle: string; color: string } => Boolean(entry),
                        )

                    const seenHandles = new Set<string>()
                    const uniqueReviewers = reviewerEntries.filter(entry => {
                        const key = entry.handle.toLowerCase()
                        if (seenHandles.has(key)) {
                            return false
                        }

                        seenHandles.add(key)
                        return true
                    })

                    if (uniqueReviewers.length) {
                        const profileUrlBase = EnvironmentConfig.REVIEW.PROFILE_PAGE_URL

                        return (
                            <span className={styles.reviewerList}>
                                {uniqueReviewers.map((entry, index) => {
                                    const url = `${profileUrlBase}/${encodeURIComponent(entry.handle)}`
                                    const isLast = index === uniqueReviewers.length - 1
                                    return (
                                        <span key={entry.handle}>
                                            <a
                                                href={url}
                                                target='_blank'
                                                rel='noreferrer'
                                                style={{ color: entry.color }}
                                                onClick={function onClick() {
                                                    window.open(url, '_blank')
                                                }}
                                            >
                                                {entry.handle}
                                            </a>
                                            {!isLast ? ', ' : ''}
                                        </span>
                                    )
                                })}
                            </span>
                        )
                    }
                }

                const handle = data.review?.reviewerHandle?.trim()
                const color = data.review?.reviewerHandleColor ?? '#2a2a2a'

                if (!handle) {
                    return <span>--</span>
                }

                const url = `${EnvironmentConfig.REVIEW.PROFILE_PAGE_URL}/${encodeURIComponent(handle)}`
                return (
                    <a
                        href={url}
                        target='_blank'
                        rel='noreferrer'
                        style={{ color }}
                        onClick={function onClick() {
                            window.open(url, '_blank')
                        }}
                    >
                        {handle}
                    </a>
                )
            },
            type: 'element',
        }),
        [isPostMortemColumn],
    )

    const renderApprovalAction = useCallback((data: SubmissionInfo) => {
        const review = data.review
        const reviewId = review?.id
        const resourceId = review?.resourceId

        if (!review || !reviewId || !resourceId || !myResourceIds.has(resourceId)) {
            return <span>--</span>
        }

        const status = (review.status || '')
            .toString()
            .toUpperCase()
        const normalizedLabel = (columnLabel || 'Approval').trim() || 'Approval'

        if (['COMPLETED', 'SUBMITTED'].includes(status)) {
            const pillText = `${normalizedLabel} Complete`
            return (
                <div
                    aria-label='Review completed'
                    className={classNames(styles.completedAction, 'last-element')}
                    title='Review completed'
                >
                    <span className={styles.completedIcon} aria-hidden='true'>
                        <IconOutline.CheckIcon />
                    </span>
                    <span className={styles.completedPill}>{pillText}</span>
                </div>
            )
        }

        if (['PENDING', 'IN_PROGRESS'].includes(status) || review?.reviewProgress || !status) {
            const actionLabel = `Complete ${normalizedLabel}`

            return (
                <Link
                    to={`./../review/${reviewId}`}
                    className={classNames(styles.submit, 'last-element')}
                >
                    <i className='icon-upload' />
                    {actionLabel}
                </Link>
            )
        }

        return <span>--</span>
    }, [columnLabel, myResourceIds])

    const renderPostMortemAction = useCallback((data: SubmissionInfo) => {
        const review = data.review
        const reviewId = review?.id
        const resourceId = review?.resourceId

        if (!review || !reviewId || !resourceId || !myResourceIds.has(resourceId)) {
            return <span>--</span>
        }

        const status = (review.status || '')
            .toString()
            .toUpperCase()

        if (status === 'COMPLETED') {
            return (
                <div
                    aria-label='Review completed'
                    className={classNames(styles.completedAction, 'last-element')}
                    title='Review completed'
                >
                    <span className={styles.completedIcon} aria-hidden='true'>
                        <IconOutline.CheckIcon />
                    </span>
                    <span className={styles.completedPill}>Post-Mortem Complete</span>
                </div>
            )
        }

        return (
            <Link
                to={`./../review/${reviewId}`}
                className={classNames(styles.submit, 'last-element')}
            >
                <i className='icon-upload' />
                Complete Post-Mortem
            </Link>
        )
    }, [myResourceIds])

    const renderIterativeAction = useCallback((data: SubmissionInfo) => {
        const review = data.review
        const reviewId = review?.id
        const status = (review?.status ?? '').toUpperCase()
        const hasReview = Boolean(reviewId)
        const resourceId = review?.resourceId

        if (!resourceId || !myResourceIds.has(resourceId)) {
            return undefined
        }

        if (['COMPLETED', 'SUBMITTED'].includes(status)) {
            const normalized = (columnLabel || 'Iterative Review').trim()
            const pillText = `${normalized} Complete`
            return (
                <div
                    aria-label='Review completed'
                    className={classNames(styles.completedAction, 'last-element')}
                    title='Review completed'
                >
                    <span className={styles.completedIcon} aria-hidden='true'>
                        <IconOutline.CheckIcon />
                    </span>
                    <span className={styles.completedPill}>{pillText}</span>
                </div>
            )
        }

        if (
            ['PENDING', 'IN_PROGRESS'].includes(status)
            || (!status && hasReview)
            || review?.reviewProgress
        ) {
            if (!reviewId) {
                return undefined
            }

            return (
                <Link
                    to={`./../review/${reviewId}`}
                    className={classNames(styles.submit, 'last-element')}
                >
                    <i className='icon-upload' />
                    Complete Review
                </Link>
            )
        }

        return undefined
    }, [columnLabel, myResourceIds])

    // eslint-disable-next-line complexity
    const actionColumn: TableColumn<SubmissionInfo> | undefined = useMemo(() => {
        if (isApprovalColumn) {
            const allowApproverActions = isActiveChallenge
                && isCurrentPhaseApproval
                && (hasApproverRole || isApproverResourceAssigned)

            if (!allowApproverActions) {
                return undefined
            }

            return {
                columnId: 'action',
                label: 'Action',
                renderer: renderApprovalAction,
                type: 'element',
            }
        }

        if (isPostMortemColumn) {
            if (!hasPostMortemReviewerRole && !isCopilotWithReviewerAssignments) {
                return undefined
            }

            return {
                columnId: 'action',
                label: 'Action',
                renderer: renderPostMortemAction,
                type: 'element',
            }
        }

        // Show Action column to Iterative Reviewers during active review phase,
        // and for First2Finish also when iterative reviews are completed (past phase)
        if (!hasIterativeReviewerRole && !isCopilotWithReviewerAssignments) {
            return undefined
        }

        const hasMyIterativeReviewAssignments = (datas || []).some(entry => {
            const resourceId = entry.review?.resourceId
            return resourceId ? myResourceIds.has(resourceId) : false
        })

        const hasCompletedIterativeReviews = (datas || []).some(d => (
            ['COMPLETED', 'SUBMITTED'].includes((d.review?.status || '').toString()
                .toUpperCase())
        ))

        const allowColumn = isReviewPhase(challengeInfo)
            || hasMyIterativeReviewAssignments
            || (isFirst2Finish && hasCompletedIterativeReviews)
        if (!allowColumn) {
            return undefined
        }

        return {
            columnId: 'action',
            label: 'Action',
            renderer: renderIterativeAction,
            type: 'element',
        }
    }, [
        challengeInfo,
        datas,
        hasApproverRole,
        hasIterativeReviewerRole,
        hasPostMortemReviewerRole,
        isActiveChallenge,
        isApprovalColumn,
        isApproverResourceAssigned,
        isCopilotWithReviewerAssignments,
        isCurrentPhaseApproval,
        isFirst2Finish,
        isPostMortemColumn,
        renderApprovalAction,
        renderIterativeAction,
        renderPostMortemAction,
        myResourceIds,
    ])

    const columns = useMemo<TableColumn<SubmissionInfo>[]>(() => {
        const baseColumns: TableColumn<SubmissionInfo>[] = []

        if (!hideSubmissionColumn) {
            baseColumns.push(
                isPostMortemColumn
                    ? postMortemSubmissionColumn
                    : submissionColumn,
            )
        }

        if (!isPostMortemColumn && handleColumn) {
            baseColumns.push(handleColumn)
        }

        if (isPostMortemColumn) {
            baseColumns.push(reviewerColumn)
        }

        baseColumns.push(
            reviewColumn,
            ...(approverColumn ? [approverColumn] : []),
            ...(approvalResultColumn ? [approvalResultColumn] : []),
            reviewDateColumn,
        )

        if (!isPostMortemColumn && isAdminOrCopilot && isF2FOrTopgearTask) {
            baseColumns.push(reviewerColumn)
        }

        return baseColumns
    }, [
        approverColumn,
        handleColumn,
        hideSubmissionColumn,
        isAdminOrCopilot,
        isF2FOrTopgearTask,
        isPostMortemColumn,
        approvalResultColumn,
        postMortemSubmissionColumn,
        reviewColumn,
        reviewDateColumn,
        reviewerColumn,
        submissionColumn,
    ])

    const columnsMobile = useMemo<MobileTableColumn<SubmissionInfo>[][]>(() => (
        (actionColumn ? [...columns, actionColumn] : columns).map(column => ([
            {
                ...column,
                className: '',
                label: `${column.label as string} label`,
                mobileType: 'label',
                renderer: () => (
                    <div>
                        {column.label as string}
                        :
                    </div>
                ),
                type: 'element',
            },
            {
                ...column,
                mobileType: 'last-value',
            },
        ] as MobileTableColumn<SubmissionInfo>[]))
    ), [actionColumn, columns])

    return (
        <TableWrapper
            className={classNames(
                styles.container,
                className,
                'enhanced-table',
            )}
        >
            {isTablet ? (
                <TableMobile columns={columnsMobile} data={datas} />
            ) : (
                <Table
                    columns={actionColumn ? [...columns, actionColumn] : columns}
                    data={datas}
                    disableSorting
                    onToggleSort={_.noop}
                    removeDefaultSort
                />
            )}
        </TableWrapper>
    )
}

export default TableIterativeReview
