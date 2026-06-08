/* eslint-disable complexity */
/**
 * Approval tab content for AI Only challenges.
 * Renders submissions in a table format consistent with other tabs.
 * Allows admins/copilots/PMs/TMs to edit decision scores via the AiReviewsTable.
 */
import {
    FC,
    useCallback,
    useContext,
    useMemo,
} from 'react'
import { useNavigate } from 'react-router-dom'
import classNames from 'classnames'
import moment from 'moment'

import { TableLoading } from '~/apps/admin/src/lib'
import { IsRemovingType } from '~/apps/admin/src/lib/models'
import {
    Table,
    TableColumn,
} from '~/libs/ui'

import { TABLE_DATE_FORMAT } from '../../../config/index.config'
import { ChallengeDetailContext } from '../../contexts'
import { useRole, useRoleProps } from '../../hooks'
import {
    useSubmissionDownloadAccess,
    UseSubmissionDownloadAccessResult,
} from '../../hooks/useSubmissionDownloadAccess'
import { useRolePermissions } from '../../hooks/useRolePermissions'
import type { UseRolePermissionsResult } from '../../hooks/useRolePermissions'
import {
    AiReviewDecision,
    BackendSubmission,
    ChallengeDetailContextModel,
} from '../../models'
import { CollapsibleAiReviewsRow } from '../CollapsibleAiReviewsRow'
import { TableNoRecord } from '../TableNoRecord'
import { TableWrapper } from '../TableWrapper'
import { renderSubmissionIdCell } from '../common'
import type { DownloadButtonConfig, SubmissionRow } from '../common/types'

import styles from './TabContentAiApproval.module.scss'

interface Props {
    submissions: BackendSubmission[]
    isLoading: boolean
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
}

interface SubmissionRowData {
    submission: BackendSubmission
    decision: AiReviewDecision | undefined
}

function formatScore(score: number | null | undefined): string {
    if (score === null || score === undefined) {
        return '-'
    }

    return Number.isInteger(score) ? `${score}` : score.toFixed(2)
}

export const TabContentAiApproval: FC<Props> = (props: Props) => {
    const {
        aiReviewDecisionsBySubmissionId,
        challengeInfo,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const { isPrivilegedRole }: useRoleProps = useRole()

    const aiReviewers = useMemo<{ aiWorkflowId: string }[]>(
        () => (challengeInfo?.reviewers?.filter(r => !!r.aiWorkflowId) as { aiWorkflowId: string }[]) ?? [],
        [challengeInfo?.reviewers],
    )

    const isApprovalPhaseOpen = useMemo<boolean>(
        () => (challengeInfo?.phases ?? []).some(
            p => (p.name || '').toLowerCase() === 'approval' && Boolean(p.isOpen),
        ),
        [challengeInfo?.phases],
    )

    const canEdit = isPrivilegedRole && isApprovalPhaseOpen

    const {
        getRestrictionMessageForMember,
        isSubmissionDownloadRestricted,
        isSubmissionDownloadRestrictedForMember,
        restrictionMessage,
        shouldRestrictSubmitterToOwnSubmission,
    }: UseSubmissionDownloadAccessResult = useSubmissionDownloadAccess()

    const {
        ownedMemberIds,
    }: UseRolePermissionsResult = useRolePermissions()

    const downloadButtonConfig = useMemo<DownloadButtonConfig>(
        () => ({
            downloadSubmission: props.downloadSubmission,
            getRestrictionMessageForMember,
            isDownloading: props.isDownloading,
            isSubmissionDownloadRestricted,
            isSubmissionDownloadRestrictedForMember,
            ownedMemberIds,
            restrictionMessage,
            shouldRestrictSubmitterToOwnSubmission,
        }),
        [
            props.downloadSubmission,
            props.isDownloading,
            getRestrictionMessageForMember,
            isSubmissionDownloadRestricted,
            isSubmissionDownloadRestrictedForMember,
            ownedMemberIds,
            restrictionMessage,
            shouldRestrictSubmitterToOwnSubmission,
        ],
    )

    const navigate = useNavigate()

    const contestSubmissions = useMemo<BackendSubmission[]>(
        () => props.submissions.filter(s => (s.type || '').toUpperCase() === 'CONTEST_SUBMISSION' && s.isLatest),
        [props.submissions],
    )

    const tableData = useMemo<SubmissionRowData[]>(
        () => contestSubmissions.map(submission => ({
            decision: aiReviewDecisionsBySubmissionId[submission.id],
            submission,
        })),
        [contestSubmissions, aiReviewDecisionsBySubmissionId],
    )

    const handleViewScorecard = useCallback(
        (submissionId: string, workflowId?: string) => (): void => {
            const path = workflowId
                ? `../reviews/${submissionId}?workflowId=${workflowId}`
                : `../reviews/${submissionId}`
            navigate(path)
        },
        [navigate],
    )

    const columns = useMemo<TableColumn<SubmissionRowData>[]>(() => {
        const cols: TableColumn<SubmissionRowData>[] = [
            {
                columnId: 'submission-id',
                label: 'Submission ID',
                renderer: (row: SubmissionRowData) => (
                    renderSubmissionIdCell(
                        row.submission as unknown as SubmissionRow,
                        downloadButtonConfig,
                    )
                ),
                type: 'element',
            },
            {
                columnId: 'submitted-date',
                label: 'Submitted',
                renderer: (row: SubmissionRowData) => {
                    const date = row.submission.createdAt
                        ? moment(row.submission.createdAt)
                            .format(TABLE_DATE_FORMAT)
                        : '-'

                    return <span>{date}</span>
                },
                type: 'element',
            },
            {
                columnId: 'status',
                label: 'Status',
                renderer: (row: SubmissionRowData) => {
                    const status = row.decision?.status ?? 'PENDING'
                    const statusMap: Record<string, { label: string; className: string }> = {
                        ERROR: { className: styles.statusError, label: 'Error' },
                        FAILED: { className: styles.statusFailed, label: 'Failed' },
                        HUMAN_OVERRIDE: { className: styles.statusOverride, label: 'Override' },
                        PASSED: { className: styles.statusPassed, label: 'Passed' },
                        PENDING: { className: styles.statusPending, label: 'Pending' },
                    }
                    const config = statusMap[status] ?? statusMap.PENDING

                    return (
                        <span className={classNames(styles.statusBadge, config.className)}>
                            {config.label}
                        </span>
                    )
                },
                type: 'element',
            },
            {
                columnId: 'ai-score',
                label: 'AI Score',
                renderer: (row: SubmissionRowData) => (
                    <span className={styles.scoreValue}>
                        {formatScore(row.decision?.totalScore)}
                    </span>
                ),
                type: 'element',
            },
        ]

        if (canEdit) {
            cols.push({
                columnId: 'actions',
                label: 'Actions',
                renderer: (row: SubmissionRowData) => {
                    if (!row.decision) {
                        return <span>-</span>
                    }

                    const workflowId = row.decision.breakdown?.workflows?.[0]?.workflowId

                    return (
                        <div className={styles.actionsCell}>
                            <button
                                type='button'
                                className={styles.editButton}
                                onClick={handleViewScorecard(row.submission.id, workflowId)}
                                title='View scorecard'
                            >
                                View scorecard
                            </button>
                        </div>
                    )
                },
                type: 'element',
            })
        }

        cols.push({
            columnId: 'ai-reviews-expand',
            isExpand: true,
            label: '',
            renderer: (row: SubmissionRowData) => (
                <div className={styles.expandContent}>
                    {row.decision?.managerComment && (
                        <div className={styles.managerCommentDisplay}>
                            <span className={styles.managerCommentLabel}>Manager Comment:</span>
                            <span className={styles.managerCommentText}>{row.decision.managerComment}</span>
                        </div>
                    )}

                    <CollapsibleAiReviewsRow
                        className={styles.aiReviews}
                        aiReviewers={aiReviewers}
                        submission={row.submission as any}
                        defaultOpen
                    />
                </div>
            ),
            type: 'element',
        })

        return cols
    }, [
        aiReviewers,
        canEdit,
        handleViewScorecard,
    ])

    if (props.isLoading) {
        return <TableLoading />
    }

    if (contestSubmissions.length === 0) {
        return <TableNoRecord message='No submissions found.' />
    }

    return (
        <TableWrapper className={classNames(styles.container, 'enhanced-table')}>
            <p className={styles.approvalHint}>
                Review the AI scorecards below.
                {canEdit && (
                    <>
                        {' '}
                        Click View scorecard to inspect workflow scores.
                    </>
                )}
            </p>

            <Table
                columns={columns}
                data={tableData}
                showExpand
                expandMode='always'
                disableSorting
                removeDefaultSort
            />

        </TableWrapper>
    )
}

export default TabContentAiApproval
