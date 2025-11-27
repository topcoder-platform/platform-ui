/**
 * Table Submission Screening.
 */
import {
    FC,
    MouseEvent,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'
import _ from 'lodash'
import classNames from 'classnames'

import { UserRole } from '~/libs/core'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { IsRemovingType } from '~/apps/admin/src/lib/models'
import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { handleError } from '~/apps/admin/src/lib/utils'
import { copyTextToClipboard, useWindowSize, WindowSize } from '~/libs/shared'
import { IconOutline, Table, TableColumn, Tooltip } from '~/libs/ui'

import {
    BackendSubmission,
    ChallengeDetailContextModel,
    ReviewAppContextModel,
    Screening,
    SubmissionInfo,
} from '../../models'
import { TableWrapper } from '../TableWrapper'
import { SubmissionHistoryModal } from '../SubmissionHistoryModal'
import {
    getHandleUrl,
    getSubmissionHistoryKey,
    hasIsLatestFlag,
    isReviewPhaseCurrentlyOpen,
    partitionSubmissionHistory,
    refreshChallengeReviewData,
    REOPEN_MESSAGE_OTHER,
    REOPEN_MESSAGE_SELF,
    SubmissionHistoryPartition,
} from '../../utils'
import { ChallengeDetailContext, ReviewAppContext } from '../../contexts'
import { updateReview } from '../../services'
import { ConfirmModal } from '../ConfirmModal'
import { useRole, useSubmissionDownloadAccess } from '../../hooks'
import type { UseSubmissionDownloadAccessResult } from '../../hooks/useSubmissionDownloadAccess'
import type { useRoleProps } from '../../hooks/useRole'
import { CollapsibleAiReviewsRow } from '../CollapsibleAiReviewsRow'

import styles from './TableSubmissionScreening.module.scss'

const VIEW_OWN_SCORECARD_TOOLTIP = 'You can only view scorecards for your own submissions.'

interface Props {
    className?: string
    screenings: Screening[]
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    hideHandleColumn?: boolean
    showScreeningColumns?: boolean
    aiReviewers?: { aiWorkflowId: string }[]
}

interface SubmissionColumnConfig {
    downloadSubmission: (submissionId: string) => void
    getRestrictionMessageForMember: (memberId?: string) => string | undefined
    isDownloading: IsRemovingType
    isSubmissionDownloadRestrictedForMember: (memberId?: string) => boolean
    restrictionMessage?: string
}

interface BaseColumnsConfig {
    handleColumn?: TableColumn<Screening>
    submissionColumn: TableColumn<Screening>
    submissionDateColumn: TableColumn<Screening>
    virusScanColumn: TableColumn<Screening>
}

interface ScreeningColumnConfig {
    canViewScorecard: (entry: Screening) => boolean
    shouldMaskScore: (entry: Screening) => boolean
}

interface ActionRenderer {
    key: string
    render: (isLast: boolean) => JSX.Element
}

interface ActionColumnConfig {
    allowCompleteScreeningAction: boolean
    hasAnyScreeningAssignment: boolean
    historyByMember: Map<string, SubmissionInfo[]>
    onHistoryClick: (event: MouseEvent<HTMLButtonElement>) => void
    shouldShowHistoryActions: boolean
    canShowReopenActions: boolean
    onRequestReopen: (entry: Screening, isOwnReview: boolean) => void
    isReopening: boolean
    pendingReviewId?: string
    canReopenGlobally: boolean
    myResourceIds: Set<string>
    challengeInfo?: ChallengeDetailContextModel['challengeInfo']
}

interface ReopenActionConfig {
    data: Screening
    canShowReopenActions: boolean
    onRequestReopen: (entry: Screening, isOwnReview: boolean) => void
    isReopening: boolean
    pendingReviewId?: string
    canReopenGlobally: boolean
    myResourceIds: Set<string>
    challengeInfo?: ChallengeDetailContextModel['challengeInfo']
}

interface HistoryActionConfig {
    data: Screening
    historyByMember: Map<string, SubmissionInfo[]>
    onHistoryClick: (event: MouseEvent<HTMLButtonElement>) => void
    shouldShowHistoryActions: boolean
}

const createSubmissionColumn = (config: SubmissionColumnConfig): TableColumn<Screening> => ({
    className: styles.submissionColumn,
    label: 'Submission ID',
    propertyName: 'submissionId',
    renderer: (data: Screening) => {
        const isRestrictedBase = config.isSubmissionDownloadRestrictedForMember(data.memberId)
        const normalizedVirusScan = data.isFileSubmission === false
            ? undefined
            : data.virusScan
        const failedScan = normalizedVirusScan === false
        const isRestrictedForRow = isRestrictedBase || failedScan
        const tooltipMessage = failedScan
            ? 'Submission failed virus scan'
            : (config.getRestrictionMessageForMember(data.memberId) ?? config.restrictionMessage)
        const isButtonDisabled = Boolean(
            config.isDownloading[data.submissionId]
            || isRestrictedForRow,
        )

        const downloadButton = (
            <button
                onClick={function onClick() {
                    if (isRestrictedForRow) {
                        return
                    }

                    config.downloadSubmission(data.submissionId)
                }}
                className={styles.textBlue}
                disabled={isButtonDisabled}
                type='button'
            >
                {data.submissionId}
            </button>
        )

        async function handleCopySubmissionId(
            event: MouseEvent<HTMLButtonElement>,
        ): Promise<void> {
            event.stopPropagation()
            event.preventDefault()

            if (!data.submissionId) {
                return
            }

            await copyTextToClipboard(data.submissionId)
            toast.success('Submission ID copied to clipboard', {
                toastId: `challenge-submission-id-copy-${data.submissionId}`,
            })
        }

        const renderedDownloadButton = isRestrictedForRow ? (
            <Tooltip content={tooltipMessage} triggerOn='click-hover'>
                <span className={styles.tooltipTrigger}>
                    {downloadButton}
                </span>
            </Tooltip>
        ) : (
            downloadButton
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
                    disabled={!data.submissionId}
                >
                    <IconOutline.DocumentDuplicateIcon />
                </button>
            </span>
        )
    },
    type: 'element',
})

const createHandleColumn = (hideHandleColumn: boolean | undefined): TableColumn<Screening> | undefined => {
    if (hideHandleColumn) {
        return undefined
    }

    return {
        label: 'Handle',
        propertyName: 'handle',
        renderer: (data: Screening) => (
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
}

const createVirusScanColumn = (): TableColumn<Screening> => ({
    label: 'Virus Scan',
    propertyName: 'virusScan',
    renderer: (data: Screening) => {
        if (data.isFileSubmission === false) {
            return <span>N/A</span>
        }

        if (data.virusScan === true) {
            return (
                <span className={styles.virusOkIcon} title='Scan passed' aria-label='Scan passed'>
                    <IconOutline.CheckCircleIcon />
                </span>
            )
        }

        if (data.virusScan === false) {
            return (
                <span className={styles.virusWarnIcon} title='Scan failed' aria-label='Scan failed'>
                    <IconOutline.ExclamationIcon />
                </span>
            )
        }

        return <span>-</span>
    },
    type: 'element',
})

const createMyReviewActions = (
    data: Screening,
    options: { allowCompleteScreeningAction: boolean },
): ActionRenderer[] => {
    if (!data.myReviewResourceId) {
        return []
    }

    const status = (data.myReviewStatus ?? '').toUpperCase()
    if (['COMPLETED', 'SUBMITTED'].includes(status)) {
        return [
            {
                key: `completed-${data.submissionId}`,
                render: () => (
                    <div
                        aria-label='Screening completed'
                        className={styles.completedAction}
                        title='Screening completed'
                    >
                        <span className={styles.completedIcon} aria-hidden='true'>
                            <IconOutline.CheckIcon />
                        </span>
                        <span className={styles.completedPill}>Screening Complete</span>
                    </div>
                ),
            },
        ]
    }

    if (!options.allowCompleteScreeningAction) {
        return []
    }

    if (!data.myReviewId) {
        return []
    }

    return [
        {
            key: `complete-${data.myReviewId}`,
            render: isLast => (
                <Link
                    to={`./../reviews/${data.submissionId}?reviewId=${data.myReviewId}`}
                    className={classNames(
                        styles.submit,
                        { 'last-element': isLast },
                    )}
                >
                    <i className='icon-upload' />
                    Complete Screening
                </Link>
            ),
        },
    ]
}

const createReopenAction = ({
    data,
    canShowReopenActions,
    onRequestReopen,
    isReopening,
    pendingReviewId,
    canReopenGlobally,
    myResourceIds,
    challengeInfo,
}: ReopenActionConfig): ActionRenderer | undefined => {
    if (!canShowReopenActions) {
        return undefined
    }

    const reviewId = data.reviewId
    if (!reviewId) {
        return undefined
    }

    if (!isReviewPhaseCurrentlyOpen(challengeInfo, data.reviewPhaseId)) {
        return undefined
    }

    const derivedStatus = (data.reviewStatus ?? data.myReviewStatus ?? '').toUpperCase()
    if (derivedStatus !== 'COMPLETED') {
        return undefined
    }

    const candidateResourceIds = [
        data.myReviewResourceId,
        data.screenerId,
    ].filter((id): id is string => Boolean(id))
    const isOwnReview = candidateResourceIds.some(id => myResourceIds.has(id))

    if (!canReopenGlobally && !isOwnReview) {
        return undefined
    }

    return {
        key: `reopen-${reviewId}`,
        render: isLast => (
            <button
                type='button'
                className={classNames(
                    styles.submit,
                    styles.textBlue,
                    { 'last-element': isLast },
                )}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={() => onRequestReopen(data, isOwnReview)}
                disabled={isReopening && pendingReviewId === reviewId}
            >
                <i className='icon-reopen' />
                Reopen Review
            </button>
        ),
    }
}

const createHistoryAction = ({
    data,
    historyByMember,
    onHistoryClick,
    shouldShowHistoryActions,
}: HistoryActionConfig): ActionRenderer | undefined => {
    if (!shouldShowHistoryActions) {
        return undefined
    }

    const historyKeyForRow = getSubmissionHistoryKey(data.memberId, data.submissionId)
    const historyEntries = historyByMember.get(historyKeyForRow) ?? []
    if (!historyEntries.length) {
        return undefined
    }

    return {
        key: `history-${historyKeyForRow}`,
        render: isLast => (
            <button
                type='button'
                className={classNames(
                    styles.historyButton,
                    { 'last-element': isLast },
                )}
                data-member-id={data.memberId ?? ''}
                data-submission-id={data.submissionId}
                onClick={onHistoryClick}
            >
                View Submission History
            </button>
        ),
    }
}

const createBaseColumns = ({
    handleColumn,
    submissionColumn,
    submissionDateColumn,
    virusScanColumn,
}: BaseColumnsConfig): TableColumn<Screening>[] => [
    submissionColumn,
    ...(handleColumn ? [handleColumn] : []),
    submissionDateColumn,
    virusScanColumn,
]

const isInProgressStatus = (value: string | undefined): boolean => (
    typeof value === 'string'
    && value.trim()
        .toUpperCase() === 'IN_PROGRESS'
)

const isScreeningReviewInProgress = (entry: Screening): boolean => (
    isInProgressStatus(entry.reviewStatus)
    || isInProgressStatus(entry.myReviewStatus)
)

/**
 * Creates columns for displaying screening review data.
 *
 * Note: This function assumes that the input data has been validated
 * to contain only Screening phase reviews. Defensive filtering is
 * performed in TabContentScreening to ensure phase data isolation.
 *
 * @param config - Configuration for scorecard access and score masking
 * @returns Array of table columns for screening data
 */
const createScreeningColumns = ({
    canViewScorecard,
    shouldMaskScore,
}: ScreeningColumnConfig): TableColumn<Screening>[] => [
    {
        label: 'Screener',
        propertyName: 'screener',
        renderer: (data: Screening) => {
            const normalizedPhaseName = data.phaseName
                ?.toLowerCase()
                .trim()

            if (normalizedPhaseName && normalizedPhaseName !== 'screening') {
                return <span />
            }

            // Display the screener handle from the Screening phase review
            // (Review phase data is filtered out in TabContentScreening)
            return data.screener?.memberHandle ? (
                <a
                    href={getHandleUrl(data.screener)}
                    target='_blank'
                    rel='noreferrer'
                    style={{
                        color: data.screener?.handleColor,
                    }}
                    onClick={function onClick() {
                        window.open(
                            getHandleUrl(data.screener),
                            '_blank',
                        )
                    }}
                >
                    {data.screener?.memberHandle ?? ''}
                </a>
            ) : (
                <span
                    style={{
                        color: data.screener?.handleColor,
                    }}
                >
                    {data.screener?.memberHandle ?? ''}
                </span>
            )
        },
        type: 'element',
    },
    {
        label: 'Screening Score',
        propertyName: 'score',
        renderer: (data: Screening) => {
            const normalizedPhaseName = data.phaseName
                ?.toLowerCase()
                .trim()
            // Link to the Screening phase scorecard
            // (Review phase scorecards are filtered out upstream)
            const maskScore = shouldMaskScore(data)
            const scoreValue = maskScore ? '--' : (data.score ?? '-')

            if (normalizedPhaseName && normalizedPhaseName !== 'screening') {
                return <span>{scoreValue}</span>
            }

            if (!data.reviewId || maskScore) {
                return <span>{scoreValue}</span>
            }

            const canAccessScorecard = canViewScorecard(data)

            if (!canAccessScorecard) {
                return (
                    <Tooltip content={VIEW_OWN_SCORECARD_TOOLTIP} triggerOn='click-hover'>
                        <span className={styles.tooltipTrigger}>
                            <span className={styles.textBlue}>{scoreValue}</span>
                        </span>
                    </Tooltip>
                )
            }

            return (
                <Link
                    to={`./../reviews/${data.submissionId}?reviewId=${data.reviewId}`}
                    className={styles.textBlue}
                >
                    {scoreValue}
                </Link>
            )
        },
        type: 'element',
    },
    {
        label: 'Screening Result',
        propertyName: 'result',
        renderer: (data: Screening) => {
            if (isScreeningReviewInProgress(data)) {
                return <span>-</span>
            }

            const val = (data.result || '').toUpperCase()
            if (val === 'PASS') {
                return (
                    <span className={styles.resultPass}>Pass</span>
                )
            }

            if (val === 'NO PASS' || val === 'FAIL') {
                return (
                    <span className={styles.resultFail}>Fail</span>
                )
            }

            return <span>-</span>
        },
        type: 'element',
    },
]

const createActionColumn = ({
    allowCompleteScreeningAction,
    hasAnyScreeningAssignment,
    historyByMember,
    onHistoryClick,
    shouldShowHistoryActions,
    canShowReopenActions,
    onRequestReopen,
    isReopening,
    pendingReviewId,
    canReopenGlobally,
    myResourceIds,
    challengeInfo,
}: ActionColumnConfig): TableColumn<Screening> | undefined => {
    if (!shouldShowHistoryActions && !hasAnyScreeningAssignment && !canShowReopenActions) {
        return undefined
    }

    return {
        className: styles.textBlue,
        label: 'Actions',
        propertyName: 'actions',
        renderer: (data: Screening) => {
            const actionRenderers: ActionRenderer[] = []

            actionRenderers.push(...createMyReviewActions(
                data,
                { allowCompleteScreeningAction },
            ))

            const reopenAction = createReopenAction({
                canReopenGlobally,
                canShowReopenActions,
                challengeInfo,
                data,
                isReopening,
                myResourceIds,
                onRequestReopen,
                pendingReviewId,
            })
            if (reopenAction) {
                actionRenderers.push(reopenAction)
            }

            const historyAction = createHistoryAction({
                data,
                historyByMember,
                onHistoryClick,
                shouldShowHistoryActions,
            })
            if (historyAction) {
                actionRenderers.push(historyAction)
            }

            if (actionRenderers.length === 0) {
                return <span>--</span>
            }

            if (actionRenderers.length === 1) {
                return actionRenderers[0].render(true)
            }

            return (
                <div className={styles.actionsContainer}>
                    {actionRenderers.map((action, index) => (
                        <div key={action.key}>
                            {action.render(index === actionRenderers.length - 1)}
                        </div>
                    ))}
                </div>
            )
        },
        type: 'element',
    }
}

const appendActionColumn = (
    columns: TableColumn<Screening>[],
    actionColumn?: TableColumn<Screening>,
): TableColumn<Screening>[] => (actionColumn ? [...columns, actionColumn] : columns)

const normalizeCreatedAt = (
    value: Date | string | undefined,
): Date | undefined => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value
    }

    if (typeof value === 'string' && value) {
        const parsed = new Date(value)
        if (!Number.isNaN(parsed.getTime())) {
            return parsed
        }
    }

    return undefined
}

export const TableSubmissionScreening: FC<Props> = (props: Props) => {
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 984, [screenWidth])
    const { challengeInfo, myRoles, myResources }: ChallengeDetailContextModel = useContext(
        ChallengeDetailContext,
    )
    const { loginUserInfo }: ReviewAppContextModel = useContext(ReviewAppContext)
    const {
        restrictionMessage,
        isSubmissionDownloadRestrictedForMember,
        getRestrictionMessageForMember,
        currentMemberId,
    }: UseSubmissionDownloadAccessResult = useSubmissionDownloadAccess()
    const { hasReviewerRole }: useRoleProps = useRole()

    const normalisedRoles = useMemo(
        () => (myRoles ?? []).map(role => role.toLowerCase()),
        [myRoles],
    )

    const hasCopilotRole = useMemo(
        () => normalisedRoles.some(role => role.includes('copilot')),
        [normalisedRoles],
    )

    const hasSubmitterRole = useMemo(
        () => normalisedRoles.some(role => role.includes('submitter')),
        [normalisedRoles],
    )

    const isAdminUser = useMemo(
        () => loginUserInfo?.roles?.some(
            role => typeof role === 'string'
                && role.toLowerCase() === UserRole.administrator,
        ) ?? false,
        [loginUserInfo?.roles],
    )

    const canViewAllScorecards = useMemo(
        () => isAdminUser || hasCopilotRole,
        [isAdminUser, hasCopilotRole],
    )

    const myResourceIds = useMemo(
        () => new Set(
            (myResources ?? [])
                .map(resource => resource.id)
                .filter((id): id is string => Boolean(id)),
        ),
        [myResources],
    )

    const canReopenGlobally = canViewAllScorecards
    const challengeId = challengeInfo?.id
    const challengeStatus = (challengeInfo?.status ?? '').toUpperCase()
    const isChallengeClosedForReopen = challengeStatus === 'COMPLETED'
        || challengeStatus.startsWith('CANCELLED')
    const showScreeningColumns = props.showScreeningColumns ?? true
    const submissionTypes = useMemo(
        () => new Set(
            props.screenings
                .map(screening => screening.type)
                .filter((type): type is string => Boolean(type)),
        ),
        [props.screenings],
    )

    const fallbackSubmissionIds = useMemo(
        () => new Set(
            props.screenings
                .map(screening => screening.submissionId)
                .filter((id): id is string => Boolean(id)),
        ),
        [props.screenings],
    )

    const filteredChallengeSubmissions = useMemo(
        () => {
            const challengeSubmissions = challengeInfo?.submissions ?? []
            if (submissionTypes.size > 0) {
                return challengeSubmissions.filter(
                    submission => submission.type && submissionTypes.has(submission.type),
                )
            }

            return challengeSubmissions.filter(
                submission => submission.id && fallbackSubmissionIds.has(submission.id),
            )
        },
        [challengeInfo?.submissions, fallbackSubmissionIds, submissionTypes],
    )

    const submissionMetaById = useMemo(() => {
        const map = new Map<string, SubmissionInfo>()

        filteredChallengeSubmissions.forEach(submission => {
            if (!submission?.id) {
                return
            }

            map.set(submission.id, submission)
        })

        props.screenings.forEach(screening => {
            const submissionId = screening.submissionId
            if (!submissionId) {
                return
            }

            const existing = map.get(submissionId)
            const createdAt = normalizeCreatedAt(screening.createdAt) ?? existing?.submittedDate

            map.set(submissionId, {
                ...existing,
                id: existing?.id ?? submissionId,
                isFileSubmission: screening.isFileSubmission ?? existing?.isFileSubmission,
                isLatest: screening.isLatest ?? existing?.isLatest,
                memberId: screening.memberId ?? existing?.memberId ?? '',
                submittedDate: createdAt,
                submittedDateString: screening.createdAtString ?? existing?.submittedDateString,
                type: screening.type ?? existing?.type,
                virusScan: screening.virusScan ?? existing?.virusScan,
            })
        })

        return map
    }, [filteredChallengeSubmissions, props.screenings])

    const aiReviewersColumn = useMemo<TableColumn<Screening> | undefined>(
        () => {
            if (!props.aiReviewers?.length) {
                return undefined
            }

            return {
                columnId: 'ai-reviews-table',
                isExpand: true,
                label: '',
                renderer: (
                    data: Screening,
                    allRows: Screening[],
                ) => {
                    const submissionPayload = submissionMetaById.get(data.submissionId) ?? {
                        id: data.submissionId ?? '',
                        virusScan: data.virusScan,
                    }

                    if (!submissionPayload?.id) {
                        return <></>
                    }

                    return (
                        <CollapsibleAiReviewsRow
                            className={styles.aiReviews}
                            aiReviewers={props.aiReviewers!}
                            submission={submissionPayload as Pick<BackendSubmission, 'id'|'virusScan'>}
                            defaultOpen={allRows ? !allRows.indexOf(data) : false}
                        />
                    )
                },
                type: 'element',
            } as TableColumn<Screening>
        },
        [props.aiReviewers, submissionMetaById],
    )

    const primarySubmissionInfos = useMemo<SubmissionInfo[]>(
        () => props.screenings
            .map(screening => submissionMetaById.get(screening.submissionId))
            .filter((submission): submission is SubmissionInfo => Boolean(submission)),
        [props.screenings, submissionMetaById],
    )

    const historySourceSubmissions = useMemo<SubmissionInfo[]>(
        () => Array.from(submissionMetaById.values()),
        [submissionMetaById],
    )

    const submissionHistory = useMemo(
        () => partitionSubmissionHistory(primarySubmissionInfos, historySourceSubmissions),
        [historySourceSubmissions, primarySubmissionInfos],
    )

    const { historyByMember, latestSubmissionIds }: SubmissionHistoryPartition = submissionHistory

    const shouldShowHistoryActions = useMemo(
        () => hasIsLatestFlag(primarySubmissionInfos),
        [primarySubmissionInfos],
    )

    const filteredScreenings = useMemo(() => (
        props.screenings
            .filter(screening => latestSubmissionIds.has(screening.submissionId))
    ), [props.screenings, latestSubmissionIds])

    const hasAnyScreeningAssignment = useMemo(
        () => props.screenings.some(screening => Boolean(screening.myReviewResourceId)),
        [props.screenings],
    )

    const canShowReopenActions = useMemo(
        () => {
            if (!showScreeningColumns) {
                return false
            }

            if (isChallengeClosedForReopen) {
                return false
            }

            return props.screenings.some(screening => {
                if (!screening.reviewId) {
                    return false
                }

                const status = (screening.reviewStatus ?? screening.myReviewStatus ?? '').toUpperCase()
                if (status !== 'COMPLETED') {
                    return false
                }

                const candidateIds = [
                    screening.myReviewResourceId,
                    screening.screenerId,
                ].filter((id): id is string => Boolean(id))

                const isOwn = candidateIds.some(id => myResourceIds.has(id))
                return canReopenGlobally || isOwn
            })
        },
        [
            isChallengeClosedForReopen,
            showScreeningColumns,
            props.screenings,
            myResourceIds,
            canReopenGlobally,
        ],
    )

    const [pendingReopen, setPendingReopen] = useState<{
        reviewId: string
        isOwnReview: boolean
    } | undefined>(undefined)
    const [isReopening, setIsReopening] = useState(false)

    const [historyKey, setHistoryKey] = useState<string | undefined>(undefined)

    const historyEntriesForModal = useMemo<SubmissionInfo[]>(
        () => (historyKey ? historyByMember.get(historyKey) ?? [] : []),
        [historyByMember, historyKey],
    )

    const closeHistoryModal = useCallback((): void => {
        setHistoryKey(undefined)
    }, [])

    const openHistoryModal = useCallback(
        (memberId: string | undefined, submissionId: string): void => {
            const key = getSubmissionHistoryKey(memberId, submissionId)
            const historyEntries = historyByMember.get(key)
            if (!historyEntries || historyEntries.length === 0) {
                return
            }

            setHistoryKey(key)
        },
        [historyByMember],
    )

    const openReopenDialog = useCallback(
        (entry: Screening, isOwnReview: boolean): void => {
            if (!entry.reviewId) {
                return
            }

            setPendingReopen({
                isOwnReview,
                reviewId: entry.reviewId,
            })
        },
        [],
    )

    const closeReopenDialog = useCallback((): void => {
        setPendingReopen(undefined)
    }, [])

    const handleConfirmReopen = useCallback(async (): Promise<void> => {
        const reviewId = pendingReopen?.reviewId

        if (!reviewId) {
            closeReopenDialog()
            return
        }

        setIsReopening(true)

        try {
            await updateReview(reviewId, { committed: false, status: 'PENDING' })
            toast.success('Scorecard reopened.')
            closeReopenDialog()
            await refreshChallengeReviewData(challengeId)
        } catch (error) {
            handleError(error)
        } finally {
            setIsReopening(false)
        }
    }, [
        pendingReopen?.reviewId,
        closeReopenDialog,
        challengeId,
    ])

    const getHistoryRestriction = useCallback(
        (submission: SubmissionInfo): { message?: string; restricted: boolean } => {
            const restrictedForMember = isSubmissionDownloadRestrictedForMember(submission.memberId)
            const message = restrictedForMember
                ? getRestrictionMessageForMember(submission.memberId) ?? restrictionMessage
                : undefined

            return {
                message,
                restricted: restrictedForMember,
            }
        },
        [
            getRestrictionMessageForMember,
            isSubmissionDownloadRestrictedForMember,
            restrictionMessage,
        ],
    )

    const handleHistoryButtonClick = useCallback((event: MouseEvent<HTMLButtonElement>): void => {
        const submissionId = event.currentTarget.dataset.submissionId
        if (!submissionId) {
            return
        }

        const memberIdValue = event.currentTarget.dataset.memberId
        const normalizedMemberId = memberIdValue && memberIdValue.length ? memberIdValue : undefined
        openHistoryModal(normalizedMemberId, submissionId)
    }, [openHistoryModal])

    const resolveSubmissionMeta = useCallback(
        (submissionId: string): SubmissionInfo | undefined => submissionMetaById.get(submissionId),
        [submissionMetaById],
    )
    const submissionColumn = useMemo(
        () => createSubmissionColumn({
            downloadSubmission: props.downloadSubmission,
            getRestrictionMessageForMember,
            isDownloading: props.isDownloading,
            isSubmissionDownloadRestrictedForMember,
            restrictionMessage,
        }),
        [
            props.downloadSubmission,
            props.isDownloading,
            getRestrictionMessageForMember,
            isSubmissionDownloadRestrictedForMember,
            restrictionMessage,
        ],
    )

    const handleColumn = useMemo(
        () => createHandleColumn(props.hideHandleColumn),
        [props.hideHandleColumn],
    )

    const submissionDateColumn = useMemo<TableColumn<Screening>>(
        () => ({
            label: 'Submission Date',
            propertyName: 'createdAt',
            renderer: (data: Screening) => (
                <span>{data.createdAtString}</span>
            ),
            type: 'element',
        }),
        [],
    )

    const virusScanColumn = useMemo<TableColumn<Screening>>(createVirusScanColumn, [])

    const baseColumns = useMemo(
        () => createBaseColumns({
            handleColumn,
            submissionColumn,
            submissionDateColumn,
            virusScanColumn,
        }),
        [handleColumn, submissionColumn, submissionDateColumn, virusScanColumn],
    )

    const canViewScorecardForRow = useCallback(
        (entry: Screening): boolean => {
            if (!entry.reviewId) {
                return false
            }

            if (canViewAllScorecards || hasReviewerRole) {
                return true
            }

            if (
                currentMemberId
                && entry.memberId
                && currentMemberId === entry.memberId
            ) {
                return true
            }

            if (entry.myReviewId && entry.reviewId === entry.myReviewId) {
                return true
            }

            const reviewerResourceIds = [
                entry.myReviewResourceId,
                entry.screenerId,
            ].filter((id): id is string => Boolean(id))

            return reviewerResourceIds.some(id => myResourceIds.has(id))
        },
        [
            canViewAllScorecards,
            hasReviewerRole,
            currentMemberId,
            myResourceIds,
        ],
    )

    const shouldMaskScoreForRow = useCallback(
        (entry: Screening): boolean => {
            if (!hasSubmitterRole) {
                return false
            }

            if (canViewAllScorecards) {
                return false
            }

            if (!currentMemberId) {
                return false
            }

            if (entry.memberId && entry.memberId === currentMemberId) {
                return false
            }

            if (canViewScorecardForRow(entry)) {
                return false
            }

            const submissionType = (entry.type || '').toUpperCase()
            if (!submissionType.includes('CHECKPOINT')) {
                return false
            }

            return true
        },
        [
            canViewAllScorecards,
            canViewScorecardForRow,
            currentMemberId,
            hasSubmitterRole,
        ],
    )

    const screeningColumns = useMemo<TableColumn<Screening>[]>(
        () => createScreeningColumns({
            canViewScorecard: canViewScorecardForRow,
            shouldMaskScore: shouldMaskScoreForRow,
        }),
        [
            canViewScorecardForRow,
            shouldMaskScoreForRow,
        ],
    )

    const actionColumn = useMemo(
        () => createActionColumn({
            allowCompleteScreeningAction: showScreeningColumns,
            canReopenGlobally,
            canShowReopenActions,
            challengeInfo,
            hasAnyScreeningAssignment,
            historyByMember,
            isReopening,
            myResourceIds,
            onHistoryClick: handleHistoryButtonClick,
            onRequestReopen: openReopenDialog,
            pendingReviewId: pendingReopen?.reviewId,
            shouldShowHistoryActions,
        }),
        [
            challengeInfo,
            canReopenGlobally,
            canShowReopenActions,
            hasAnyScreeningAssignment,
            historyByMember,
            myResourceIds,
            handleHistoryButtonClick,
            openReopenDialog,
            pendingReopen?.reviewId,
            isReopening,
            shouldShowHistoryActions,
        ],
    )

    const columns = useMemo<TableColumn<Screening>[]>(
        () => {
            const base = [...baseColumns]
            const columnsWithoutAction = showScreeningColumns
                ? [...base, ...screeningColumns]
                : base
            const columnsWithAi = aiReviewersColumn
                ? [...columnsWithoutAction, aiReviewersColumn]
                : columnsWithoutAction

            return appendActionColumn(columnsWithAi, actionColumn)
        },
        [
            actionColumn,
            aiReviewersColumn,
            baseColumns,
            screeningColumns,
            showScreeningColumns,
        ],
    )

    const columnsMobile = useMemo<MobileTableColumn<Screening>[][]>(
        () => columns.map(
            column => [
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
            ] as MobileTableColumn<Screening>[],
        ),
        [columns],
    )

    return (
        <TableWrapper
            className={classNames(
                styles.container,
                props.className,
                'enhanced-table',
            )}
        >
            {isTablet ? (
                <TableMobile columns={columnsMobile} data={props.screenings} />
            ) : (
                <Table
                    columns={columns}
                    data={filteredScreenings}
                    showExpand
                    expandMode='always'
                    disableSorting
                    onToggleSort={_.noop}
                    removeDefaultSort
                />
            )}

            <SubmissionHistoryModal
                open={Boolean(historyKey)}
                onClose={closeHistoryModal}
                submissions={historyEntriesForModal}
                downloadSubmission={props.downloadSubmission}
                isDownloading={props.isDownloading}
                getRestriction={getHistoryRestriction}
                getSubmissionMeta={resolveSubmissionMeta}
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

export default TableSubmissionScreening
