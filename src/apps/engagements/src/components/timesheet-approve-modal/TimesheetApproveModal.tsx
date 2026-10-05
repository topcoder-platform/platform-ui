import { FC, FocusEvent, useEffect, useState } from 'react'

import { BaseModal, Button } from '~/libs/ui'

import { formatHoursLabel } from '../../lib/utils'

import styles from './TimesheetApproveModal.module.scss'

interface TimesheetApproveModalProps {
    open: boolean
    entryCount: number
    /** Exact decimal total, e.g. `42.50`. */
    totalHours: string
    isApproving?: boolean
    /**
     * True when an administrator is approving on a manager's behalf: the API then requires an override
     * reason, and the dialog says so rather than failing the request.
     */
    requiresOverrideReason?: boolean
    onCancel: () => void
    onConfirm: (approvalComment: string, overrideReason?: string) => void
}

/**
 * Approval confirmation.
 *
 * The comment is required by the API and gates the button here, because an approval with no comment is
 * a decision nobody can later explain.
 */
const TimesheetApproveModal: FC<TimesheetApproveModalProps> = (props: TimesheetApproveModalProps) => {
    const [approvalComment, setApprovalComment] = useState<string>('')
    const [overrideReason, setOverrideReason] = useState<string>('')

    useEffect(() => {
        if (props.open) {
            setApprovalComment('')
            setOverrideReason('')
        }
    }, [props.open])

    const missingOverrideReason = Boolean(props.requiresOverrideReason) && !overrideReason.trim()
    const canApprove = Boolean(approvalComment.trim()) && !missingOverrideReason

    return (
        <BaseModal
            buttons={(
                <>
                    <Button
                        disabled={props.isApproving}
                        label='Cancel'
                        onClick={props.onCancel}
                        secondary
                    />
                    <Button
                        disabled={props.isApproving || !canApprove}
                        label={props.isApproving ? 'Approving...' : 'Approve'}
                        onClick={function onConfirm() {
                            props.onConfirm(
                                approvalComment.trim(),
                                props.requiresOverrideReason ? overrideReason.trim() : undefined,
                            )
                        }}
                        primary
                    />
                </>
            )}
            onClose={props.onCancel}
            open={props.open}
            size='md'
            title='Approve timesheet entries'
        >
            <div className={styles.body}>
                <p className={styles.summary}>
                    {`You are about to approve ${props.entryCount} timesheet `}
                    {props.entryCount === 1 ? 'entry' : 'entries'}
                    {` totaling ${formatHoursLabel(props.totalHours)} hours. `}
                    Please enter an approval comment and confirm the action.
                </p>

                <label className={styles.field} htmlFor='timesheet-approval-comment'>
                    Approval comment
                    <textarea
                        id='timesheet-approval-comment'
                        onChange={function onCommentChange(
                            event: FocusEvent<HTMLTextAreaElement>,
                        ) {
                            setApprovalComment(event.target.value)
                        }}
                        rows={3}
                        value={approvalComment}
                    />
                </label>

                {props.requiresOverrideReason && (
                    <label className={styles.field} htmlFor='timesheet-approval-override'>
                        Override reason (approving on a manager&apos;s behalf)
                        <textarea
                            id='timesheet-approval-override'
                            onChange={function onReasonChange(
                                event: FocusEvent<HTMLTextAreaElement>,
                            ) {
                                setOverrideReason(event.target.value)
                            }}
                            rows={2}
                            value={overrideReason}
                        />
                    </label>
                )}
            </div>
        </BaseModal>
    )
}

export default TimesheetApproveModal
