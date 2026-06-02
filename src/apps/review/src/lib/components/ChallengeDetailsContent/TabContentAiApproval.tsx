/**
 * Approval tab content for AI Only challenges.
 * Allows copilots/admins to review AI scorecards and add manager comments
 * or score overrides before the challenge is finalized.
 */
import { FC, useCallback, useContext, useMemo, useState } from 'react'
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
    isActiveChallenge: boolean
}

interface SubmissionApprovalRowProps {
    submission: BackendSubmission
    decision: AiReviewDecision | undefined
    aiReviewers: { aiWorkflowId: string }[]
    isPrivilegedRole: boolean
    isApprovalPhaseOpen: boolean
    onSaved: (updated: AiReviewDecision) => void
}

const SubmissionApprovalRow: FC<SubmissionApprovalRowProps> = ({
    submission,
    decision,
    aiReviewers,
    isPrivilegedRole,
    isApprovalPhaseOpen,
    onSaved,
}) => {
    const [managerComment, setManagerComment] = useState<string>(decision?.managerComment ?? '')
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const canEdit = isPrivilegedRole && isApprovalPhaseOpen

    const handleSave = useCallback(async () => {
        if (!decision?.id) return
        setIsSaving(true)
        try {
            const updated = await patchAiReviewDecision(decision.id, {
                managerComment: managerComment.trim() || null,
            })
            onSaved(updated)
            toast.success('Manager comment saved.')
        } catch (err) {
            toast.error('Failed to save manager comment.')
        } finally {
            setIsSaving(false)
        }
    }, [decision?.id, managerComment, onSaved])

    const submittedDate = submission.created
        ? moment(submission.created).format(TABLE_DATE_FORMAT)
        : '-'

    return (
        <div className={styles.submissionRow}>
            <div className={styles.submissionHeader}>
                <span className={styles.submissionId}>
                    {submission.id}
                </span>
                <span className={styles.submissionDate}>{submittedDate}</span>
                {decision && (
                    <span className={styles.submissionScore}>
                        <strong>AI Score:</strong>{' '}
                        {decision.totalScore != null
                            ? decision.totalScore.toFixed(2)
                            : '-'}
                        {decision.status === 'HUMAN_OVERRIDE' && (
                            <span className={styles.overrideBadge}> (Override)</span>
                        )}
                    </span>
                )}
            </div>

            <CollapsibleAiReviewsRow
                defaultOpen
                aiReviewers={aiReviewers}
                submission={submission}
            />

            {decision && canEdit && (
                <div className={styles.managerCommentSection}>
                    <label className={styles.managerCommentLabel} htmlFor={`mc-${submission.id}`}>
                        Manager Comment
                    </label>
                    <textarea
                        id={`mc-${submission.id}`}
                        className={styles.managerCommentInput}
                        rows={3}
                        value={managerComment}
                        onChange={e => setManagerComment(e.target.value)}
                        placeholder='Enter a manager comment (optional)...'
                    />
                    <button
                        type='button'
                        className={styles.saveButton}
                        disabled={isSaving}
                        onClick={handleSave}
                    >
                        {isSaving ? 'Saving…' : 'Save Comment'}
                    </button>
                </div>
            )}

            {decision?.managerComment && !canEdit && (
                <div className={styles.managerCommentReadOnly}>
                    <strong>Manager Comment:</strong>
                    <p>{decision.managerComment}</p>
                </div>
            )}
        </div>
    )
}

export const TabContentAiApproval: FC<Props> = ({
    submissions,
    isLoading,
    isActiveChallenge,
}) => {
    const {
        challengeInfo,
        aiReviewConfig,
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

    const getDecision = useCallback(
        (submissionId: string): AiReviewDecision | undefined =>
            localDecisionOverrides[submissionId] ?? aiReviewDecisionsBySubmissionId[submissionId],
        [aiReviewDecisionsBySubmissionId, localDecisionOverrides],
    )

    const handleDecisionSaved = useCallback((updated: AiReviewDecision) => {
        setLocalDecisionOverrides(prev => ({
            ...prev,
            [updated.submissionId]: updated,
        }))
    }, [])

    const contestSubmissions = useMemo<BackendSubmission[]>(
        () => submissions.filter(s => (s.type || '').toLowerCase() === 'contestsubmission'),
        [submissions],
    )

    if (isLoading) {
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
                    <> You may add a manager comment to any submission before the Approval phase closes.</>
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
