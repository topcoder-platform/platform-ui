import React, { useCallback, useState } from 'react'
import { toast } from 'react-toastify'

import { BaseModal } from '~/libs/ui'
import { handleError } from '~/libs/shared'

import {
    AiReviewDecisionEscalation,
    AiReviewEscalationDecision,
    createAiReviewEscalation,
    updateAiReviewEscalation,
} from '../../services'
import { refreshChallengeReviewData } from '../../utils'
import styles from './TableReview.module.scss'
import type { SubmissionReviewerRow } from '../common/types'
import { getProfileUrl } from '../common'

interface Props {
    challengeId?: string
    escalateTarget?: SubmissionReviewerRow | undefined
    setEscalateTarget: (val?: SubmissionReviewerRow) => void
    unlockTarget?: SubmissionReviewerRow | undefined
    setUnlockTarget: (val?: SubmissionReviewerRow) => void
    verifyTarget?: {
        submission: SubmissionReviewerRow
        decision: AiReviewEscalationDecision
        escalation: AiReviewDecisionEscalation
    } | undefined
    setVerifyTarget: (val?: any) => void
    escalationDecisionBySubmissionId: Map<string, AiReviewEscalationDecision>
    revalidateEscalationData: () => Promise<void>
    handleByMemberId: Map<string, { handle?: string; color?: string }>
}

export default function EscalationModals({
    challengeId,
    escalateTarget,
    setEscalateTarget,
    unlockTarget,
    setUnlockTarget,
    verifyTarget,
    setVerifyTarget,
    escalationDecisionBySubmissionId,
    revalidateEscalationData,
    handleByMemberId,
}: Props): JSX.Element {
    const [escalationNotes, setEscalationNotes] = useState('')
    const [unlockNotes, setUnlockNotes] = useState('')
    const [verifyNotes, setVerifyNotes] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    function closeEscalateDialog(): void {
        if (isSubmitting) return
        setEscalateTarget(undefined)
        setEscalationNotes('')
    }

    function closeUnlockDialog(): void {
        if (isSubmitting) return
        setUnlockTarget(undefined)
        setUnlockNotes('')
    }

    function closeVerifyDialog(): void {
        if (isSubmitting) return
        setVerifyTarget(undefined)
        setVerifyNotes('')
    }

    const renderEscalationReviewer = useCallback((createdBy?: string | number | null) => {
        const memberId = String(createdBy ?? '')
        const info = handleByMemberId.get(memberId)
        const handle = info?.handle ?? (createdBy ? String(createdBy) : '--')
        const color = info?.color ?? '#2a2a2a'
        const profileUrl = info?.handle ? getProfileUrl(info.handle) : undefined

        return profileUrl ? (
            <a href={profileUrl} style={{ color }} target='_blank' rel='noreferrer'>
                {handle}
            </a>
        ) : (
            <span style={{ color }}>{handle}</span>
        )
    }, [handleByMemberId])

    async function handleSubmitEscalation(): Promise<void> {
        if (!escalateTarget?.id) return

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

        setIsSubmitting(true)

        try {
            await createAiReviewEscalation(decision.aiReviewDecisionId, {
                escalationNotes: notes,
            })
            toast.success('Escalation request submitted.')
            closeEscalateDialog()
            if (challengeId) {
                await refreshChallengeReviewData(challengeId)
            }
            await revalidateEscalationData()
        } catch (error) {
            handleError(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleSubmitUnlock(): Promise<void> {
        if (!unlockTarget?.id) return

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

        setIsSubmitting(true)

        try {
            await createAiReviewEscalation(decision.aiReviewDecisionId, {
                approverNotes: notes,
            })
            toast.success('Submission unlocked successfully.')
            closeUnlockDialog()
            if (challengeId) {
                await refreshChallengeReviewData(challengeId)
            }
            await revalidateEscalationData()
        } catch (error) {
            handleError(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleVerifyEscalation(status: 'APPROVED' | 'REJECTED'): Promise<void> {
        if (!verifyTarget?.decision.aiReviewDecisionId || !verifyTarget.escalation.id) return

        const notes = verifyNotes.trim()
        if (!notes) {
            toast.error('Reason is required to approve or reject this request.')
            return
        }

        setIsSubmitting(true)

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
            if (challengeId) {
                await refreshChallengeReviewData(challengeId)
            }
            await revalidateEscalationData()
        } catch (error) {
            handleError(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <BaseModal
                open={Boolean(escalateTarget)}
                onClose={closeEscalateDialog}
                title={`Escalate Submission #${escalateTarget?.id ?? ''}`}
                size='body'
                classNames={{ modal: styles.escalationModal }}
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
                    disabled={isSubmitting}
                />
                <div className={styles.escalationActions}>
                    <button type='button' className='borderButton' onClick={closeEscalateDialog} disabled={isSubmitting}>Cancel</button>
                    <button type='button' className='filledButton' onClick={handleSubmitEscalation} disabled={isSubmitting}>Send to Copilot</button>
                </div>
            </BaseModal>

            <BaseModal
                open={Boolean(verifyTarget)}
                onClose={closeVerifyDialog}
                title='Verify Escalation Request'
                size='body'
                classNames={{ modal: styles.escalationModal }}
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
                        {renderEscalationReviewer ? renderEscalationReviewer(verifyTarget?.escalation.createdBy) : (verifyTarget?.escalation.createdBy ?? '--')}
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
                    disabled={isSubmitting}
                />
                <div className={styles.escalationActions}>
                    <button type='button' className='borderButton' onClick={() => handleVerifyEscalation('REJECTED')} disabled={isSubmitting}>Reject Request</button>
                    <button type='button' className='filledButton' onClick={() => handleVerifyEscalation('APPROVED')} disabled={isSubmitting}>Approve Override</button>
                </div>
            </BaseModal>

            <BaseModal
                open={Boolean(unlockTarget)}
                onClose={closeUnlockDialog}
                title='Unlock Submission'
                size='body'
                classNames={{ modal: styles.escalationModal }}
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
                    disabled={isSubmitting}
                />
                <div className={styles.escalationActions}>
                    <button type='button' className='borderButton' onClick={closeUnlockDialog} disabled={isSubmitting}>Cancel</button>
                    <button type='button' className='filledButton' onClick={handleSubmitUnlock} disabled={isSubmitting}>Unlock Submission</button>
                </div>
            </BaseModal>
        </>
    )
}
