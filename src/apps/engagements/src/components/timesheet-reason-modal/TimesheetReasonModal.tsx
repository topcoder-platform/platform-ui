import { FC, FocusEvent, useEffect, useState } from 'react'

import { BaseModal, Button } from '~/libs/ui'

import styles from './TimesheetReasonModal.module.scss'

interface TimesheetReasonModalProps {
    open: boolean
    title: string
    /** What the administrator is about to do, stated plainly. */
    description: string
    confirmLabel: string
    isSubmitting?: boolean
    onCancel: () => void
    onConfirm: (overrideReason: string) => void
}

/**
 * Collects the override reason before an administrator acts on someone else's behalf.
 *
 * Every administrator override records a reason, so the dialog is the gate rather than a courtesy: the
 * confirm button stays disabled until there is one, which keeps the API from having to refuse the call.
 */
const TimesheetReasonModal: FC<TimesheetReasonModalProps> = (props: TimesheetReasonModalProps) => {
    const [overrideReason, setOverrideReason] = useState<string>('')

    useEffect(() => {
        if (props.open) {
            setOverrideReason('')
        }
    }, [props.open])

    return (
        <BaseModal
            buttons={(
                <>
                    <Button
                        disabled={props.isSubmitting}
                        label='Cancel'
                        onClick={props.onCancel}
                        secondary
                    />
                    <Button
                        disabled={props.isSubmitting || !overrideReason.trim()}
                        label={props.isSubmitting ? 'Working...' : props.confirmLabel}
                        onClick={function onConfirm() {
                            props.onConfirm(overrideReason.trim())
                        }}
                        primary
                    />
                </>
            )}
            onClose={props.onCancel}
            open={props.open}
            size='md'
            title={props.title}
        >
            <div className={styles.body}>
                <p className={styles.description}>{props.description}</p>
                <label className={styles.field} htmlFor='timesheet-override-reason'>
                    Override reason
                    <textarea
                        id='timesheet-override-reason'
                        onChange={function onReasonChange(
                            event: FocusEvent<HTMLTextAreaElement>,
                        ) {
                            setOverrideReason(event.target.value)
                        }}
                        rows={3}
                        value={overrideReason}
                    />
                </label>
            </div>
        </BaseModal>
    )
}

export default TimesheetReasonModal
