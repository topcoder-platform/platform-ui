/* eslint-disable complexity */
/**
 * Approval tab content for AI Only challenges.
 * Allows copilots/admins to review AI scorecards and add manager comments
 * or score overrides before the challenge is finalized.
 */
import {
    ChangeEvent,
    FC,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { toast } from 'react-toastify'
import moment from 'moment'

import { TableLoading } from '~/apps/admin/src/lib'

import {
    AiReviewDecision,
    BackendSubmission,
    ChallengeDetailContextModel,
} from '../../models'
import { ChallengeDetailContext } from '../../contexts'
import { CollapsibleAiReviewsRow } from '../CollapsibleAiReviewsRow'
import { TableNoRecord } from '../TableNoRecord'
import { useRole, useRoleProps } from '../../hooks'
import { TABLE_DATE_FORMAT } from '../../../config/index.config'
import { patchAiReviewDecision } from '../../services/aiReview.service'

import styles from './TabContentAiApproval.module.scss'

interface Props {
    submissions: BackendSubmission[]
    isLoading: boolean
}

interface SubmissionApprovalRowProps {
    submission: BackendSubmission
    decision: AiReviewDecision | undefined
    aiReviewers: { aiWorkflowId: string }[]
    isPrivilegedRole: boolean
    isApprovalPhaseOpen: boolean
    onSaved: (updated: AiReviewDecision) => void
}

interface WorkflowOverrideState {
    managerScoreInput: string
    workflowComment: string
}

const getWorkflowOverrideState = (
    decision: AiReviewDecision | undefined,
): Record<string, WorkflowOverrideState> => {
    const workflows = decision?.breakdown?.workflows ?? []

    return workflows.reduce<Record<string, WorkflowOverrideState>>((acc, workflow) => {
        acc[workflow.workflowId] = {
            managerScoreInput:
                workflow.managerScore === null || workflow.managerScore === undefined
                    ? ''
                    : String(workflow.managerScore),
            workflowComment: workflow.managerComment ?? '',
        }
        return acc
    }, {})
}

const SubmissionApprovalRow: FC<SubmissionApprovalRowProps> = (props: SubmissionApprovalRowProps) => {
    const [managerComment, setManagerComment] = useState<string>(props.decision?.managerComment ?? '')
    const [workflowOverrides, setWorkflowOverrides] = useState<Record<string, WorkflowOverrideState>>(
        () => getWorkflowOverrideState(props.decision),
    )
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const canEdit = props.isPrivilegedRole && props.isApprovalPhaseOpen
    const workflows = props.decision?.breakdown?.workflows ?? []

    useEffect(() => {
        setManagerComment(props.decision?.managerComment ?? '')
        setWorkflowOverrides(getWorkflowOverrideState(props.decision))
    }, [props.decision?.id, props.decision?.updatedAt, props.decision?.managerComment])

    const handleSave = useCallback(async () => {
        if (!props.decision?.id) return

        const payloadOverrides = [] as {
            workflowId: string
            managerScore?: number | undefined
            workflowComment?: string | undefined
        }[]

        for (const workflow of workflows) {
            const override = workflowOverrides[workflow.workflowId]
            const scoreInput = override?.managerScoreInput?.trim() ?? ''
            let parsedScore: number | undefined

            if (!scoreInput) {
                parsedScore = undefined
            } else {
                parsedScore = Number(scoreInput)
                if (!Number.isFinite(parsedScore)) {
                    toast.error(`Invalid manager score for workflow ${workflow.workflowId}.`)
                    return
                }
            }

            payloadOverrides.push({
                managerScore: parsedScore,
                workflowComment: override?.workflowComment?.trim() || undefined,
                workflowId: workflow.workflowId,
            })
        }

        setIsSaving(true)
        try {
            const updated = await patchAiReviewDecision(props.decision.id, {
                managerComment: managerComment.trim() || undefined,
                workflowOverrides: payloadOverrides,
            })
            props.onSaved(updated)
            toast.success('Manager comment and score overrides saved.')
        } catch (err) {
            toast.error('Failed to save manager comment and score overrides.')
        } finally {
            setIsSaving(false)
        }
    }, [props.decision?.id, managerComment, props.onSaved, workflowOverrides, workflows])

    const submittedDate = props.submission.createdAt
        ? moment(props.submission.createdAt)
            .format(TABLE_DATE_FORMAT)
        : '-'

    return (
        <div className={styles.submissionRow}>
            <div className={styles.submissionHeader}>
                <span className={styles.submissionId}>
                    {props.submission.id}
                </span>
                <span className={styles.submissionDate}>{submittedDate}</span>
                {props.decision && (
                    <span className={styles.submissionScore}>
                        <strong>AI Score:</strong>
                        {' '}
                        {props.decision.totalScore !== undefined && props.decision.totalScore !== null
                            ? props.decision.totalScore.toFixed(2)
                            : '-'}
                        {props.decision.status === 'HUMAN_OVERRIDE' && (
                            <span className={styles.overrideBadge}> (Override)</span>
                        )}
                    </span>
                )}
            </div>

            <CollapsibleAiReviewsRow
                defaultOpen
                aiReviewers={props.aiReviewers}
                submission={props.submission}
            />

            {props.decision && canEdit && (
                <div className={styles.managerCommentSection}>
                    {workflows.length > 0 && (
                        <div className={styles.workflowOverridesSection}>
                            <div className={styles.workflowOverridesTitle}>Workflow Score Overrides</div>
                            {workflows.map(workflow => {
                                const override = workflowOverrides[workflow.workflowId]

                                return (
                                    <div key={workflow.workflowId} className={styles.workflowOverrideRow}>
                                        <div className={styles.workflowMeta}>
                                            <span className={styles.workflowId}>{workflow.workflowId}</span>
                                            <span className={styles.workflowRunScore}>
                                                Run Score:
                                                {' '}
                                                {workflow.runScore ?? '-'}
                                            </span>
                                        </div>
                                        <label
                                            className={styles.workflowInputLabel}
                                            htmlFor={`ms-${props.submission.id}-${workflow.workflowId}`}
                                        >
                                            Manager Score
                                        </label>
                                        <input
                                            id={`ms-${props.submission.id}-${workflow.workflowId}`}
                                            type='number'
                                            step='0.01'
                                            className={styles.workflowScoreInput}
                                            value={override?.managerScoreInput ?? ''}
                                            onChange={function onScoreChange(e: ChangeEvent<HTMLInputElement>): void {
                                                const value = e.target.value
                                                setWorkflowOverrides(prev => ({
                                                    ...prev,
                                                    [workflow.workflowId]: {
                                                        managerScoreInput: value,
                                                        workflowComment: (
                                                            prev[workflow.workflowId]?.workflowComment ?? ''
                                                        ),
                                                    },
                                                }))
                                            }}
                                            placeholder='Leave empty to clear override'
                                        />
                                        <label
                                            className={styles.workflowInputLabel}
                                            htmlFor={`wc-${props.submission.id}-${workflow.workflowId}`}
                                        >
                                            Workflow Comment
                                        </label>
                                        <textarea
                                            id={`wc-${props.submission.id}-${workflow.workflowId}`}
                                            className={styles.workflowCommentInput}
                                            rows={2}
                                            value={override?.workflowComment ?? ''}
                                            onChange={function onWorkflowCommentChange(
                                                e: ChangeEvent<HTMLTextAreaElement>,
                                            ): void {
                                                const value = e.target.value
                                                setWorkflowOverrides(prev => ({
                                                    ...prev,
                                                    [workflow.workflowId]: {
                                                        managerScoreInput:
                                                            prev[workflow.workflowId]?.managerScoreInput ?? '',
                                                        workflowComment: value,
                                                    },
                                                }))
                                            }}
                                            placeholder='Optional workflow-level comment'
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    <label className={styles.managerCommentLabel} htmlFor={`mc-${props.submission.id}`}>
                        Manager Comment
                    </label>
                    <textarea
                        id={`mc-${props.submission.id}`}
                        className={styles.managerCommentInput}
                        rows={3}
                        value={managerComment}
                        onChange={function onChange(e: ChangeEvent<HTMLTextAreaElement>): void {
                            setManagerComment(e.target.value)
                        }}
                        placeholder='Enter a manager comment (optional)...'
                    />
                    <button
                        type='button'
                        className={styles.saveButton}
                        disabled={isSaving}
                        onClick={handleSave}
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            )}

            {!canEdit
                && workflows.some(workflow => workflow.managerScore !== undefined && workflow.managerScore !== null)
                && (
                    <div className={styles.workflowOverridesReadOnly}>
                        <strong>Manager Score Overrides:</strong>
                        {workflows
                            .filter(workflow => workflow.managerScore !== undefined && workflow.managerScore !== null)
                            .map(workflow => (
                                <p key={workflow.workflowId}>
                                    {workflow.workflowId}
                                    :
                                    {' '}
                                    {workflow.managerScore}
                                </p>
                            ))}
                    </div>
                )}

            {props.decision?.managerComment && !canEdit && (
                <div className={styles.managerCommentReadOnly}>
                    <strong>Manager Comment:</strong>
                    <p>{props.decision.managerComment}</p>
                </div>
            )}
        </div>
    )
}

export const TabContentAiApproval: FC<Props> = props => {
    const {
        challengeInfo,
        aiReviewDecisionsBySubmissionId,
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

    // Local copy of decisions to allow optimistic updates after PATCH
    const [localDecisionOverrides, setLocalDecisionOverrides] = useState<
        Record<string, AiReviewDecision>
    >({})

    const getDecision = useCallback((submissionId: string): AiReviewDecision | undefined => (
        localDecisionOverrides[submissionId] ?? aiReviewDecisionsBySubmissionId[submissionId]
    ), [aiReviewDecisionsBySubmissionId, localDecisionOverrides])

    const handleDecisionSaved = useCallback((updated: AiReviewDecision) => {
        setLocalDecisionOverrides(prev => ({
            ...prev,
            [updated.submissionId]: updated,
        }))
    }, [])

    const contestSubmissions = useMemo<BackendSubmission[]>(
        () => props.submissions.filter(s => (s.type || '').toUpperCase() === 'CONTEST_SUBMISSION'),
        [props.submissions],
    )

    if (props.isLoading) {
        return <TableLoading />
    }

    if (contestSubmissions.length === 0) {
        return <TableNoRecord message='No submissions found.' />
    }

    return (
        <div className={styles.container}>
            <p className={styles.approvalHint}>
                Review the AI scorecards below.
                {isPrivilegedRole && isApprovalPhaseOpen && (
                    <> You may add a manager comment and workflow score overrides before the Approval phase closes.</>
                )}
            </p>
            {contestSubmissions.map(submission => (
                <SubmissionApprovalRow
                    key={submission.id}
                    submission={submission}
                    decision={getDecision(submission.id)}
                    aiReviewers={aiReviewers}
                    isPrivilegedRole={isPrivilegedRole}
                    isApprovalPhaseOpen={isApprovalPhaseOpen}
                    onSaved={handleDecisionSaved}
                />
            ))}
        </div>
    )
}

export default TabContentAiApproval
