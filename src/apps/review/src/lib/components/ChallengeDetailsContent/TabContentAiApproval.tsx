/* eslint-disable complexity */
/**
 * Approval tab content for AI Only challenges.
 * Renders submissions in a table format consistent with other tabs.
 * Allows admins/copilots/PMs/TMs to edit decision scores via the AiReviewsTable.
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
import { mutate } from 'swr'
import classNames from 'classnames'
import moment from 'moment'

import { TableLoading } from '~/apps/admin/src/lib'
import { IsRemovingType } from '~/apps/admin/src/lib/models'
import {
    BaseModal,
    Button,
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
import {
    getAiReviewDecisionsCacheKey,
    patchAiReviewDecision,
    WorkflowManagerOverride,
} from '../../services/aiReview.service'
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

interface EditableScores {
    workflows: Record<string, string>
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

function getInitialScores(decision: AiReviewDecision | undefined): EditableScores {
    const workflows = decision?.breakdown?.workflows ?? []

    return {
        workflows: workflows.reduce<Record<string, string>>((acc, wf) => {
            acc[wf.workflowId] = wf.managerScore !== undefined && wf.managerScore !== null
                ? String(wf.managerScore)
                : ''

            return acc
        }, {}),
    }
}

function hasScoreChanges(
    original: AiReviewDecision | undefined,
    edited: EditableScores,
): boolean {
    if (!original) {
        return false
    }

    const workflows = original.breakdown?.workflows ?? []

    for (const wf of workflows) {
        const editedScore = edited.workflows[wf.workflowId] ?? ''
        const originalScore = wf.managerScore !== undefined && wf.managerScore !== null
            ? String(wf.managerScore)
            : ''

        if (editedScore.trim() !== originalScore) {
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

    const [localDecisionOverrides, setLocalDecisionOverrides] = useState<Record<string, AiReviewDecision>>({})
    const [editScores, setEditScores] = useState<Record<string, EditableScores>>({})
    const [editingRows, setEditingRows] = useState<Set<string>>(new Set())
    const [savingSubmissionId, setSavingSubmissionId] = useState<string | undefined>(undefined)
    const [confirmModal, setConfirmModal] = useState<{
        submissionId: string
        decision: AiReviewDecision
        managerComment: string
    } | undefined>(undefined)

    const workflowNameById = useMemo<Record<string, string>>(() => {
        const configWorkflows = aiReviewConfig?.workflows ?? []

        return configWorkflows.reduce<Record<string, string>>((acc, cw) => {
            if (cw.workflowId && cw.workflow?.name) {
                acc[cw.workflowId] = cw.workflow.name
            }

            return acc
        }, {})
    }, [aiReviewConfig?.workflows])

    const getDecision = useCallback((submissionId: string): AiReviewDecision | undefined => (
        localDecisionOverrides[submissionId] ?? aiReviewDecisionsBySubmissionId[submissionId]
    ), [aiReviewDecisionsBySubmissionId, localDecisionOverrides])

    const getScores = useCallback((submissionId: string): EditableScores => {
        if (editScores[submissionId]) {
            return editScores[submissionId]
        }

        return getInitialScores(getDecision(submissionId))
    }, [editScores, getDecision])

    const updateScores = useCallback((
        submissionId: string,
        workflowId: string,
        value: string,
    ): void => {
        setEditScores(prev => {
            const current = prev[submissionId] ?? getInitialScores(getDecision(submissionId))

            return {
                ...prev,
                [submissionId]: {
                    ...current,
                    workflows: {
                        ...current.workflows,
                        [workflowId]: value,
                    },
                },
            }
        })
    }, [getDecision])

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

    const toggleEditMode = useCallback((submissionId: string): void => {
        setEditingRows(prev => {
            const next = new Set(prev)

            if (next.has(submissionId)) {
                next.delete(submissionId)
                // Clear edit state when exiting edit mode
                setEditScores(prevScores => {
                    const nextScores = { ...prevScores }
                    delete nextScores[submissionId]

                    return nextScores
                })
            } else {
                next.add(submissionId)
            }

            return next
        })
    }, [])

    const handleSaveClick = useCallback((submissionId: string, decision: AiReviewDecision): void => {
        setConfirmModal({ decision, managerComment: '', submissionId })
    }, [])

    const handleConfirmSave = useCallback(async (): Promise<void> => {
        if (!confirmModal) {
            return
        }

        const decision: AiReviewDecision = confirmModal.decision
        const submissionId: string = confirmModal.submissionId
        const managerComment: string = confirmModal.managerComment.trim()

        if (!managerComment) {
            toast.error('Manager comment is required.')
            return
        }

        const scores: EditableScores = getScores(submissionId)
        const workflows = decision.breakdown?.workflows ?? []

        const payloadOverrides: WorkflowManagerOverride[] = []

        for (const workflow of workflows) {
            const scoreInput = scores.workflows[workflow.workflowId]?.trim() ?? ''
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
                workflowId: workflow.workflowId,
            })
        }

        setSavingSubmissionId(submissionId)
        setConfirmModal(undefined)

        try {
            const updated = await patchAiReviewDecision(decision.id, {
                managerComment: managerComment.trim() || undefined,
                workflowOverrides: payloadOverrides,
            })

            setLocalDecisionOverrides(prev => ({
                ...prev,
                [updated.submissionId]: updated,
            }))
            setEditScores(prev => {
                const next = { ...prev }
                delete next[submissionId]

                return next
            })
            setEditingRows(prev => {
                const next = new Set(prev)
                next.delete(submissionId)

                return next
            })
            toast.success('Changes saved successfully.')

            if (aiReviewConfig?.id) {
                await mutate(getAiReviewDecisionsCacheKey(aiReviewConfig.id))
            }
        } catch {
            toast.error('Failed to save changes.')
        } finally {
            setSavingSubmissionId(undefined)
        }
    }, [confirmModal, getScores, workflowNameById, aiReviewConfig?.id])

    const handleCancelSave = useCallback((): void => {
        setConfirmModal(undefined)
    }, [])

    const handleToggleClick = useCallback((submissionId: string) => (): void => {
        toggleEditMode(submissionId)
    }, [toggleEditMode])

    const handleSaveButtonClick = useCallback(
        (submissionId: string, decision: AiReviewDecision) => (): void => {
            handleSaveClick(submissionId, decision)
        },
        [handleSaveClick],
    )

    const handleScoreChange = useCallback(
        (submissionId: string) => (workflowId: string, value: string): void => {
            updateScores(submissionId, workflowId, value)
        },
        [updateScores],
    )

    const handleCommentChange = useCallback(
        (e: ChangeEvent<HTMLTextAreaElement>): void => {
            if (!confirmModal) {
                return
            }

            setConfirmModal(prev => {
                if (!prev) {
                    return undefined
                }

                return { ...prev, managerComment: e.target.value }
            })
        },
        [confirmModal],
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

                    const scores = getScores(row.submission.id)
                    const hasUnsavedChanges = hasScoreChanges(row.decision, scores)
                    const isSaving = savingSubmissionId === row.submission.id
                    const isEditing = editingRows.has(row.submission.id)

                    return (
                        <div className={styles.actionsCell}>
                            <button
                                type='button'
                                className={classNames(
                                    styles.editButton,
                                    isEditing && styles.editButtonActive,
                                )}
                                onClick={handleToggleClick(row.submission.id)}
                                title={isEditing ? 'Cancel editing' : 'Edit scores'}
                            >
                                {isEditing ? 'Cancel' : 'Edit'}
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
                const isEditing = editingRows.has(row.submission.id)
                const scores = getScores(row.submission.id)

                return (
                    <div className={styles.expandContent}>
                        {/* Manager comment display */}
                        {row.decision?.managerComment && (
                            <div className={styles.managerCommentDisplay}>
                                <span className={styles.managerCommentLabel}>Manager Comment:</span>
                                <span className={styles.managerCommentText}>{row.decision.managerComment}</span>
                            </div>
                        )}

                        {/* AI Reviews table with editing support */}
                        <CollapsibleAiReviewsRow
                            className={styles.aiReviews}
                            aiReviewers={aiReviewers}
                            submission={row.submission as any}
                            defaultOpen
                            editMode={canEdit && isEditing}
                            editedScores={scores.workflows}
                            onScoreChange={handleScoreChange(row.submission.id)}
                        />
                    </div>
                )
            },
            type: 'element',
        })

        return cols
    }, [
        aiReviewers,
        canEdit,
        editingRows,
        getScores,
        handleSaveButtonClick,
        handleScoreChange,
        handleToggleClick,
        savingSubmissionId,
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
                        Click Edit to modify workflow scores.
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
                                disabled={!confirmModal.managerComment.trim()}
                            >
                                Save Changes
                            </Button>
                        </>
                    )}
                >
                    <div className={styles.confirmContent}>
                        <p>Are you sure you want to save these score changes?</p>
                        <div className={styles.confirmComment}>
                            <label className={styles.inputLabel}>
                                Manager Comment:
                                <textarea
                                    className={styles.commentInput}
                                    rows={3}
                                    value={confirmModal.managerComment}
                                    onChange={handleCommentChange}
                                    placeholder='Add a comment explaining the changes...'
                                />
                            </label>
                            {!confirmModal.managerComment.trim() && (
                                <p className={styles.confirmError}>
                                    Manager comment is required.
                                </p>
                            )}
                        </div>
                    </div>
                </BaseModal>
            )}
        </TableWrapper>
    )
}

export default TabContentAiApproval
