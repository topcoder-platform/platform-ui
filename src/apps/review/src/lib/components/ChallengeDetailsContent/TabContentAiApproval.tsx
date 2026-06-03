/* eslint-disable complexity */
/**
 * Approval tab content for AI Only challenges.
 * Renders submissions in a table format consistent with other tabs.
 * Allows admins/copilots/PMs/TMs to edit decision scores and workflow scores.
 */
import {
    ChangeEvent,
    FC,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react'
import { toast } from 'react-toastify'
import classNames from 'classnames'
import moment from 'moment'

import { TableLoading } from '~/apps/admin/src/lib'
import {
    BaseModal,
    Button,
    IconOutline,
    Table,
    TableColumn,
} from '~/libs/ui'

import { TABLE_DATE_FORMAT } from '../../../config/index.config'
import { ChallengeDetailContext } from '../../contexts'
import { useRole, useRoleProps } from '../../hooks'
import {
    AiReviewDecision,
    AiReviewDecisionBreakdownWorkflow,
    BackendSubmission,
    ChallengeDetailContextModel,
} from '../../models'
import { patchAiReviewDecision, WorkflowManagerOverride } from '../../services/aiReview.service'
import { CollapsibleAiReviewsRow } from '../CollapsibleAiReviewsRow'
import { TableNoRecord } from '../TableNoRecord'
import { TableWrapper } from '../TableWrapper'

import styles from './TabContentAiApproval.module.scss'

interface Props {
    submissions: BackendSubmission[]
    isLoading: boolean
}

interface EditableDecisionState {
    managerComment: string
    workflows: Record<string, {
        managerScore: string
        managerComment: string
    }>
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

function getInitialEditState(decision: AiReviewDecision | undefined): EditableDecisionState {
    const workflows = decision?.breakdown?.workflows ?? []

    return {
        managerComment: decision?.managerComment ?? '',
        workflows: workflows.reduce<Record<string, { managerScore: string; managerComment: string }>>((acc, wf) => {
            acc[wf.workflowId] = {
                managerComment: wf.managerComment ?? '',
                managerScore: wf.managerScore !== undefined && wf.managerScore !== null
                    ? String(wf.managerScore)
                    : '',
            }

            return acc
        }, {}),
    }
}

function hasChanges(
    original: AiReviewDecision | undefined,
    edited: EditableDecisionState,
): boolean {
    if (!original) {
        return false
    }

    const originalComment = original.managerComment ?? ''

    if (edited.managerComment.trim() !== originalComment) {
        return true
    }

    const workflows = original.breakdown?.workflows ?? []

    for (const wf of workflows) {
        const editedWf = edited.workflows[wf.workflowId]

        if (!editedWf) {
            // eslint-disable-next-line no-continue
            continue
        }

        const originalScore = wf.managerScore !== undefined && wf.managerScore !== null
            ? String(wf.managerScore)
            : ''
        const originalWfComment = wf.managerComment ?? ''

        if (editedWf.managerScore.trim() !== originalScore) {
            return true
        }

        if (editedWf.managerComment.trim() !== originalWfComment) {
            return true
        }
    }

    return false
}

export const TabContentAiApproval: FC<Props> = (props: Props) => {
    const {
        aiReviewConfig,
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

    const [localDecisionOverrides, setLocalDecisionOverrides] = useState<Record<string, AiReviewDecision>>({})
    const [editStates, setEditStates] = useState<Record<string, EditableDecisionState>>({})
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
    const [savingSubmissionId, setSavingSubmissionId] = useState<string | undefined>(undefined)
    const [confirmModal, setConfirmModal] = useState<{
        submissionId: string
        decision: AiReviewDecision
    } | undefined>(undefined)

    const getDecision = useCallback((submissionId: string): AiReviewDecision | undefined => (
        localDecisionOverrides[submissionId] ?? aiReviewDecisionsBySubmissionId[submissionId]
    ), [aiReviewDecisionsBySubmissionId, localDecisionOverrides])

    const getEditState = useCallback((submissionId: string): EditableDecisionState => {
        if (editStates[submissionId]) {
            return editStates[submissionId]
        }

        return getInitialEditState(getDecision(submissionId))
    }, [editStates, getDecision])

    const updateEditState = useCallback((
        submissionId: string,
        updater: (prev: EditableDecisionState) => EditableDecisionState,
    ): void => {
        setEditStates(prev => ({
            ...prev,
            [submissionId]: updater(prev[submissionId] ?? getInitialEditState(getDecision(submissionId))),
        }))
    }, [getDecision])

    const workflowNameById = useMemo<Record<string, string>>(() => {
        const configWorkflows = aiReviewConfig?.workflows ?? []

        return configWorkflows.reduce<Record<string, string>>((acc, cw) => {
            if (cw.workflowId && cw.workflow?.name) {
                acc[cw.workflowId] = cw.workflow.name
            }

            return acc
        }, {})
    }, [aiReviewConfig?.workflows])

    const contestSubmissions = useMemo<BackendSubmission[]>(
        () => props.submissions.filter(s => (s.type || '').toUpperCase() === 'CONTEST_SUBMISSION' && s.isLatest),
        [props.submissions],
    )

    const tableData = useMemo<SubmissionRowData[]>(
        () => contestSubmissions.map(submission => ({
            decision: getDecision(submission.id),
            submission,
        })),
        [contestSubmissions, getDecision],
    )

    const toggleRowExpansion = useCallback((submissionId: string): void => {
        setExpandedRows(prev => {
            const next = new Set(prev)

            if (next.has(submissionId)) {
                next.delete(submissionId)
            } else {
                next.add(submissionId)
            }

            return next
        })
    }, [])

    const handleSaveClick = useCallback((submissionId: string, decision: AiReviewDecision): void => {
        setConfirmModal({ decision, submissionId })
    }, [])

    const handleConfirmSave = useCallback(async (): Promise<void> => {
        if (!confirmModal) {
            return
        }

        const decision: AiReviewDecision = confirmModal.decision
        const submissionId: string = confirmModal.submissionId
        const editState: EditableDecisionState = getEditState(submissionId)
        const workflows = decision.breakdown?.workflows ?? []

        const payloadOverrides: WorkflowManagerOverride[] = []

        for (const workflow of workflows) {
            const override = editState.workflows[workflow.workflowId]
            const scoreInput = override?.managerScore?.trim() ?? ''
            let parsedScore: number | undefined

            if (!scoreInput) {
                parsedScore = undefined
            } else {
                parsedScore = Number(scoreInput)

                if (!Number.isFinite(parsedScore)) {
                    const wfName = workflowNameById[workflow.workflowId] || workflow.workflowId
                    toast.error(`Invalid manager score for workflow ${wfName}.`)

                    return
                }
            }

            payloadOverrides.push({
                managerScore: parsedScore,
                workflowComment: override?.managerComment?.trim() || undefined,
                workflowId: workflow.workflowId,
            })
        }

        setSavingSubmissionId(submissionId)
        setConfirmModal(undefined)

        try {
            const updated = await patchAiReviewDecision(decision.id, {
                managerComment: editState.managerComment.trim() || undefined,
                workflowOverrides: payloadOverrides,
            })

            setLocalDecisionOverrides(prev => ({
                ...prev,
                [updated.submissionId]: updated,
            }))
            setEditStates(prev => {
                const next = { ...prev }
                delete next[submissionId]

                return next
            })
            toast.success('Changes saved successfully.')
        } catch {
            toast.error('Failed to save changes.')
        } finally {
            setSavingSubmissionId(undefined)
        }
    }, [confirmModal, getEditState, workflowNameById])

    const handleCancelSave = useCallback((): void => {
        setConfirmModal(undefined)
    }, [])

    const handleToggleClick = useCallback((submissionId: string) => (): void => {
        toggleRowExpansion(submissionId)
    }, [toggleRowExpansion])

    const handleSaveButtonClick = useCallback(
        (submissionId: string, decision: AiReviewDecision) => (): void => {
            handleSaveClick(submissionId, decision)
        },
        [handleSaveClick],
    )

    const handleScoreChange = useCallback(
        (submissionId: string, workflowId: string) => (e: ChangeEvent<HTMLInputElement>): void => {
            const val = e.target.value
            updateEditState(submissionId, prev => ({
                ...prev,
                workflows: {
                    ...prev.workflows,
                    [workflowId]: {
                        ...prev.workflows[workflowId],
                        managerScore: val,
                    },
                },
            }))
        },
        [updateEditState],
    )

    const handleWorkflowCommentChange = useCallback(
        (submissionId: string, workflowId: string) => (e: ChangeEvent<HTMLTextAreaElement>): void => {
            const val = e.target.value
            updateEditState(submissionId, prev => ({
                ...prev,
                workflows: {
                    ...prev.workflows,
                    [workflowId]: {
                        ...prev.workflows[workflowId],
                        managerComment: val,
                    },
                },
            }))
        },
        [updateEditState],
    )

    const handleManagerCommentChange = useCallback(
        (submissionId: string) => (e: ChangeEvent<HTMLTextAreaElement>): void => {
            const val = e.target.value
            updateEditState(submissionId, prev => ({
                ...prev,
                managerComment: val,
            }))
        },
        [updateEditState],
    )

    const handleConfirmCommentChange = useCallback(
        (e: ChangeEvent<HTMLTextAreaElement>): void => {
            if (!confirmModal) {
                return
            }

            const val = e.target.value
            updateEditState(confirmModal.submissionId, prev => ({
                ...prev,
                managerComment: val,
            }))
        },
        [confirmModal, updateEditState],
    )

    const columns = useMemo<TableColumn<SubmissionRowData>[]>(() => {
        const cols: TableColumn<SubmissionRowData>[] = [
            {
                columnId: 'submission-id',
                label: 'Submission ID',
                renderer: (row: SubmissionRowData) => (
                    <span className={styles.submissionId}>
                        {row.submission.id}
                    </span>
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

                    const editState = getEditState(row.submission.id)
                    const hasUnsavedChanges = hasChanges(row.decision, editState)
                    const isSaving = savingSubmissionId === row.submission.id
                    const isExpanded = expandedRows.has(row.submission.id)

                    return (
                        <div className={styles.actionsCell}>
                            <button
                                type='button'
                                className={styles.expandButton}
                                onClick={handleToggleClick(row.submission.id)}
                                title={isExpanded ? 'Collapse' : 'Edit scores'}
                            >
                                {isExpanded ? (
                                    <IconOutline.ChevronUpIcon />
                                ) : (
                                    <IconOutline.PencilIcon />
                                )}
                            </button>
                            {hasUnsavedChanges && (
                                <button
                                    type='button'
                                    className={styles.saveButton}
                                    onClick={handleSaveButtonClick(row.submission.id, row.decision)}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                            )}
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
            renderer: (row: SubmissionRowData) => {
                const isExpanded = expandedRows.has(row.submission.id)
                const editState = getEditState(row.submission.id)
                const workflows = row.decision?.breakdown?.workflows ?? []

                return (
                    <div className={styles.expandContent}>
                        <CollapsibleAiReviewsRow
                            className={styles.aiReviews}
                            aiReviewers={aiReviewers}
                            submission={row.submission as any}
                            defaultOpen={false}
                        />

                        {canEdit && isExpanded && row.decision && (
                            <div className={styles.editSection}>
                                <div className={styles.editSectionTitle}>
                                    Edit Scores & Comments
                                </div>

                                {workflows.length > 0 && (
                                    <div className={styles.workflowsGrid}>
                                        {workflows.map((wf: AiReviewDecisionBreakdownWorkflow) => {
                                            const wfEdit = editState.workflows[wf.workflowId]
                                                ?? { managerComment: '', managerScore: '' }
                                            const workflowName = workflowNameById[wf.workflowId] || wf.workflowId

                                            return (
                                                <div key={wf.workflowId} className={styles.workflowCard}>
                                                    <div className={styles.workflowHeader}>
                                                        <span className={styles.workflowName}>{workflowName}</span>
                                                        <span className={styles.workflowRunScore}>
                                                            Run Score:
                                                            {' '}
                                                            {formatScore(wf.runScore)}
                                                        </span>
                                                    </div>
                                                    <div className={styles.workflowInputs}>
                                                        <label className={styles.inputLabel}>
                                                            Manager Score Override
                                                            <input
                                                                type='number'
                                                                step='0.01'
                                                                className={styles.scoreInput}
                                                                value={wfEdit.managerScore}
                                                                onChange={handleScoreChange(
                                                                    row.submission.id,
                                                                    wf.workflowId,
                                                                )}
                                                                placeholder='Leave empty to clear'
                                                            />
                                                        </label>
                                                        <label className={styles.inputLabel}>
                                                            Workflow Comment
                                                            <textarea
                                                                className={styles.commentInput}
                                                                rows={2}
                                                                value={wfEdit.managerComment}
                                                                onChange={handleWorkflowCommentChange(
                                                                    row.submission.id,
                                                                    wf.workflowId,
                                                                )}
                                                                placeholder='Optional comment'
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                <div className={styles.managerCommentSection}>
                                    <label className={styles.inputLabel}>
                                        Manager Comment
                                        <textarea
                                            className={styles.commentInput}
                                            rows={3}
                                            value={editState.managerComment}
                                            onChange={handleManagerCommentChange(row.submission.id)}
                                            placeholder='Enter a manager comment (optional)...'
                                        />
                                    </label>
                                </div>
                            </div>
                        )}

                        {!canEdit && row.decision?.managerComment && (
                            <div className={styles.readOnlySection}>
                                <div className={styles.readOnlyTitle}>Manager Comment</div>
                                <div className={styles.readOnlyContent}>{row.decision.managerComment}</div>
                            </div>
                        )}

                        {!canEdit && workflows.some(wf => wf.managerScore !== undefined) && (
                            <div className={styles.readOnlySection}>
                                <div className={styles.readOnlyTitle}>Manager Score Overrides</div>
                                <div className={styles.overridesList}>
                                    {workflows
                                        .filter(wf => wf.managerScore !== undefined)
                                        .map(wf => (
                                            <p key={wf.workflowId}>
                                                {workflowNameById[wf.workflowId] || wf.workflowId}
                                                :
                                                {' '}
                                                {wf.managerScore}
                                            </p>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                )
            },
            type: 'element',
        })

        return cols
    }, [
        aiReviewers,
        canEdit,
        expandedRows,
        getEditState,
        handleManagerCommentChange,
        handleSaveButtonClick,
        handleScoreChange,
        handleToggleClick,
        handleWorkflowCommentChange,
        savingSubmissionId,
        workflowNameById,
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
                        Click the edit icon to modify scores and add manager comments.
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

            {confirmModal && (
                <BaseModal
                    open
                    onClose={handleCancelSave}
                    title='Confirm Save'
                    size='md'
                    buttons={(
                        <>
                            <Button
                                secondary
                                onClick={handleCancelSave}
                            >
                                Cancel
                            </Button>
                            <Button
                                primary
                                onClick={handleConfirmSave}
                            >
                                Save Changes
                            </Button>
                        </>
                    )}
                >
                    <div className={styles.confirmContent}>
                        <p>Are you sure you want to save these changes?</p>
                        <div className={styles.confirmComment}>
                            <label className={styles.inputLabel}>
                                Manager Comment (for this save):
                                <textarea
                                    className={styles.commentInput}
                                    rows={3}
                                    value={getEditState(confirmModal.submissionId).managerComment}
                                    onChange={handleConfirmCommentChange}
                                    placeholder='Add a comment explaining the changes...'
                                />
                            </label>
                        </div>
                    </div>
                </BaseModal>
            )}
        </TableWrapper>
    )
}

export default TabContentAiApproval
