/**
 * Tab content for submissions during the submission phase.
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
import _ from 'lodash'
import classNames from 'classnames'
import moment from 'moment'

import { TableLoading } from '~/apps/admin/src/lib'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { IsRemovingType } from '~/apps/admin/src/lib/models'
import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { copyTextToClipboard, useWindowSize, WindowSize } from '~/libs/shared'
import { IconOutline, Table, TableColumn, Tooltip } from '~/libs/ui'

import {
    BackendSubmission,
    ChallengeDetailContextModel,
    convertBackendSubmissionToSubmissionInfo,
    SubmissionInfo,
} from '../../models'
import { TableNoRecord } from '../TableNoRecord'
import { TableWrapper } from '../TableWrapper'
import { SubmissionHistoryModal } from '../SubmissionHistoryModal'
import { useSubmissionDownloadAccess } from '../../hooks/useSubmissionDownloadAccess'
import type { UseSubmissionDownloadAccessResult } from '../../hooks/useSubmissionDownloadAccess'
import { ChallengeDetailContext } from '../../contexts'
import {
    challengeHasSubmissionLimit,
    getSubmissionHistoryKey,
    hasIsLatestFlag,
    partitionSubmissionHistory,
} from '../../utils'
import type { SubmissionHistoryPartition } from '../../utils'
import { TABLE_DATE_FORMAT } from '../../../config/index.config'
import { CollapsibleAiReviewsRow } from '../CollapsibleAiReviewsRow'

import styles from './TabContentSubmissions.module.scss'

interface Props {
    aiReviewers?: { aiWorkflowId: string }[]
    submissions: BackendSubmission[]
    isLoading: boolean
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
}

const VIRUS_SCAN_FAILED_MESSAGE = 'Submission failed virus scan'

export const TabContentSubmissions: FC<Props> = props => {
    console.log('here', props.submissions);

    const windowSize: WindowSize = useWindowSize()
    const isTablet = useMemo(
        () => (windowSize.width ?? 0) <= 984,
        [windowSize.width],
    )

    const {
        restrictionMessage,
        isSubmissionDownloadRestrictedForMember,
        getRestrictionMessageForMember,
    }: UseSubmissionDownloadAccessResult = useSubmissionDownloadAccess()

    const { challengeInfo }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)

    const submissionMetaById = useMemo(
        () => {
            const map = new Map<string, BackendSubmission>()
            props.submissions.forEach(submission => {
                if (submission?.id) {
                    map.set(submission.id, submission)
                }
            })
            return map
        },
        [props.submissions],
    )

    const submissionInfos = useMemo<SubmissionInfo[]>(
        () => props.submissions.map(convertBackendSubmissionToSubmissionInfo),
        [props.submissions],
    )

    const submissionInfoById = useMemo(
        () => {
            const map = new Map<string, SubmissionInfo>()
            submissionInfos.forEach(submission => {
                if (!submission?.id) {
                    return
                }

                map.set(submission.id, submission)
            })
            return map
        },
        [submissionInfos],
    )

    const submissionHistory = useMemo(
        () => partitionSubmissionHistory(submissionInfos, submissionInfos),
        [submissionInfos],
    )
    const {
        latestSubmissions,
        historyByMember,
    }: SubmissionHistoryPartition = submissionHistory

    const latestBackendSubmissions = useMemo<BackendSubmission[]>(
        () => latestSubmissions
            .map(submission => (submission?.id ? submissionMetaById.get(submission.id) : undefined))
            .filter((submission): submission is BackendSubmission => Boolean(submission)),
        [latestSubmissions, submissionMetaById],
    )

    const restrictToLatest = useMemo(
        () => challengeHasSubmissionLimit(challengeInfo),
        [challengeInfo],
    )

    const hasLatestFlag = useMemo(
        () => hasIsLatestFlag(props.submissions),
        [props.submissions],
    )

    const shouldShowHistoryActions = useMemo(
        () => historyByMember.size > 0,
        [historyByMember],
    )

    const [historyKey, setHistoryKey] = useState<string | undefined>(undefined)

    const historyEntriesForModal = useMemo<SubmissionInfo[]>(
        () => (historyKey ? historyByMember.get(historyKey) ?? [] : []),
        [historyByMember, historyKey],
    )

    const closeHistoryModal = useCallback((): void => {
        setHistoryKey(undefined)
    }, [])

    const openHistoryModalForKey = useCallback(
        (memberId: string | undefined, submissionId: string): void => {
            if (!submissionId) {
                return
            }

            const key = getSubmissionHistoryKey(memberId, submissionId)
            const entries = historyByMember.get(key) ?? []
            if (!entries.length) {
                return
            }

            setHistoryKey(key)
        },
        [historyByMember],
    )

    const handleHistoryButtonClick = useCallback(
        (event: MouseEvent<HTMLButtonElement>): void => {
            const submissionId = event.currentTarget.dataset.submissionId
            if (!submissionId) {
                return
            }

            const memberId = event.currentTarget.dataset.memberId
            openHistoryModalForKey(memberId || undefined, submissionId)
        },
        [openHistoryModalForKey],
    )

    const resolveSubmissionMeta = useCallback(
        (submissionId: string): SubmissionInfo | undefined => submissionInfoById.get(submissionId),
        [submissionInfoById],
    )

    const getHistoryRestriction = useCallback(
        (submission: SubmissionInfo) => {
            if (!submission.memberId) {
                return { restricted: false }
            }

            const isRestricted = isSubmissionDownloadRestrictedForMember(submission.memberId)
            if (!isRestricted) {
                return { restricted: false }
            }

            return {
                message: getRestrictionMessageForMember(submission.memberId) ?? restrictionMessage,
                restricted: true,
            }
        },
        [
            getRestrictionMessageForMember,
            isSubmissionDownloadRestrictedForMember,
            restrictionMessage,
        ],
    )

    const filteredSubmissions = useMemo<BackendSubmission[]>(
        () => {
            if (restrictToLatest && hasLatestFlag) {
                return latestBackendSubmissions.length
                    ? latestBackendSubmissions
                    : props.submissions
            }

            return props.submissions
        },
        [
            latestBackendSubmissions,
            props.submissions,
            restrictToLatest,
            hasLatestFlag,
        ],
    )

    const columns = useMemo<TableColumn<BackendSubmission>[]>(
        () => {
            const baseColumns: TableColumn<BackendSubmission>[] = [
                {
                    className: styles.submissionColumn,
                    label: 'Submission ID',
                    propertyName: 'id',
                    renderer: (submission: BackendSubmission) => {
                        if (!submission.id) {
                            return <span>-</span>
                        }

                        const isRestrictedBase = isSubmissionDownloadRestrictedForMember(submission.memberId)
                        const normalizedVirusScan = submission.isFileSubmission === false
                            ? undefined
                            : submission.virusScan
                        const failedScan = normalizedVirusScan === false
                        const isRestricted = isRestrictedBase || failedScan
                        const tooltipMessage = failedScan
                            ? VIRUS_SCAN_FAILED_MESSAGE
                            : (
                                getRestrictionMessageForMember(submission.memberId)
                                ?? restrictionMessage
                            )
                        const isButtonDisabled = Boolean(
                            props.isDownloading[submission.id]
                            || isRestricted,
                        )

                        const downloadButton = (
                            <button
                                onClick={function onClick() {
                                    if (isRestricted) {
                                        return
                                    }

                                    props.downloadSubmission(submission.id)
                                }}
                                className={styles.textBlue}
                                disabled={isButtonDisabled}
                                type='button'
                            >
                                {submission.id}
                            </button>
                        )

                        async function handleCopySubmissionId(
                            event: MouseEvent<HTMLButtonElement>,
                        ): Promise<void> {
                            event.stopPropagation()
                            event.preventDefault()

                            await copyTextToClipboard(submission.id)
                            toast.success('Submission ID copied to clipboard', {
                                toastId: `challenge-submission-id-copy-${submission.id}`,
                            })
                        }

                        const renderedDownloadButton = isRestricted ? (
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
                                    disabled={!submission.id}
                                >
                                    <IconOutline.DocumentDuplicateIcon />
                                </button>
                            </span>
                        )
                    },
                    type: 'element',
                },
                {
                    label: 'Submitted Date',
                    propertyName: 'submittedDate',
                    renderer: (submission: BackendSubmission) => (
                        <span>
                            {submission.submittedDate
                                ? moment(submission.submittedDate)
                                    .local()
                                    .format(TABLE_DATE_FORMAT)
                                : '-'}
                        </span>
                    ),
                    type: 'element',
                },
                {
                    className: styles.aiReviewerRow,
                    label: 'Reviewer',
                    mobileColSpan: 2,
                    propertyName: 'virusScan',
                    renderer: (submission: BackendSubmission, allRows: BackendSubmission[]) => (
                        submission.isFileSubmission === false ? (
                            <span>N/A</span>
                        ) : (
                            <CollapsibleAiReviewsRow
                                aiReviewers={props.aiReviewers!}
                                submission={submission}
                                defaultOpen={allRows ? !allRows.indexOf(submission) : false}
                            />
                        )
                    ),
                    type: 'element',
                },
            ]

            if (shouldShowHistoryActions) {
                baseColumns.push({
                    label: 'Actions',
                    propertyName: 'actions',
                    renderer: (submission: BackendSubmission) => {
                        if (!submission.id) {
                            return <span>-</span>
                        }

                        const key = getSubmissionHistoryKey(submission.memberId, submission.id)
                        const historyEntries = historyByMember.get(key) ?? []
                        if (!historyEntries.length) {
                            return <span>-</span>
                        }

                        return (
                            <button
                                type='button'
                                className={styles.historyButton}
                                data-submission-id={submission.id}
                                data-member-id={submission.memberId ?? ''}
                                onClick={handleHistoryButtonClick}
                            >
                                View Submission History
                            </button>
                        )
                    },
                    type: 'element',
                })
            }

            return baseColumns
        },
        [
            getRestrictionMessageForMember,
            isSubmissionDownloadRestrictedForMember,
            restrictionMessage,
            props.downloadSubmission,
            props.isDownloading,
            historyByMember,
            handleHistoryButtonClick,
            shouldShowHistoryActions,
        ],
    )

    const columnsMobile = useMemo<MobileTableColumn<BackendSubmission>[][]>(
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
                    colSpan: column.mobileColSpan,
                    mobileType: 'last-value',
                },
            ] as MobileTableColumn<BackendSubmission>[],
        ),
        [columns],
    )

    if (props.isLoading) {
        return <TableLoading />
    }

    if (!props.submissions.length) {
        return <TableNoRecord message='No submissions' />
    }

    return (
        <TableWrapper className={classNames(styles.container, 'enhanced-table')}>
            {isTablet ? (
                <TableMobile columns={columnsMobile} data={filteredSubmissions} />
            ) : (
                <Table
                    columns={columns}
                    data={filteredSubmissions}
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
                aiReviewers={props.aiReviewers}
            />
        </TableWrapper>
    )
}

export default TabContentSubmissions
