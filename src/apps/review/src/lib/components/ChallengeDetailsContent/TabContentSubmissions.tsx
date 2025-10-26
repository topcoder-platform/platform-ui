/**
 * Tab content for submissions during the submission phase.
 */
import { FC, MouseEvent, useContext, useMemo } from 'react'
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
import { useSubmissionDownloadAccess } from '../../hooks/useSubmissionDownloadAccess'
import type { UseSubmissionDownloadAccessResult } from '../../hooks/useSubmissionDownloadAccess'
import { ChallengeDetailContext } from '../../contexts'
import {
    challengeHasSubmissionLimit,
    hasIsLatestFlag,
    partitionSubmissionHistory,
} from '../../utils'
import type { SubmissionHistoryPartition } from '../../utils'
import { TABLE_DATE_FORMAT } from '../../../config/index.config'

import styles from './TabContentSubmissions.module.scss'

interface Props {
    submissions: BackendSubmission[]
    isLoading: boolean
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
}

const VIRUS_SCAN_FAILED_MESSAGE = 'Submission failed virus scan'

export const TabContentSubmissions: FC<Props> = props => {
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

    const submissionHistory = useMemo(
        () => partitionSubmissionHistory(submissionInfos, submissionInfos),
        [submissionInfos],
    )
    const { latestSubmissions }: SubmissionHistoryPartition = submissionHistory

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
                        const failedScan = submission.virusScan === false
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
                    label: 'Virus Scan',
                    propertyName: 'virusScan',
                    renderer: (submission: BackendSubmission) => {
                        if (submission.virusScan === true) {
                            return (
                                <span className={styles.virusOkIcon} title='Scan passed' aria-label='Scan passed'>
                                    <IconOutline.CheckCircleIcon />
                                </span>
                            )
                        }

                        if (submission.virusScan === false) {
                            return (
                                <span className={styles.virusWarnIcon} title='Scan failed' aria-label='Scan failed'>
                                    <IconOutline.ExclamationIcon />
                                </span>
                            )
                        }

                        return <span>-</span>
                    },
                    type: 'element',
                },
            ]

            return baseColumns
        },
        [
            getRestrictionMessageForMember,
            isSubmissionDownloadRestrictedForMember,
            restrictionMessage,
            props.downloadSubmission,
            props.isDownloading,
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
        </TableWrapper>
    )
}

export default TabContentSubmissions
