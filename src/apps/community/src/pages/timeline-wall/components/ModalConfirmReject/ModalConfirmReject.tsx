/* eslint-disable no-void */
/* eslint-disable react/jsx-no-bind */
import {
    ChangeEvent,
    FC,
    useMemo,
    useState,
} from 'react'

import {
    BaseModal,
    Button,
} from '~/libs/ui'

import { type RejectTimelineEventBody } from '../../../../lib/services'

import styles from './ModalConfirmReject.module.scss'

interface ModalConfirmRejectProps {
    onClose: () => void
    onReject: (body: RejectTimelineEventBody) => Promise<void> | void
    open: boolean
}

const rejectionReasons: string[] = [
    'Not related to Topcoder community timeline',
    'Contains inappropriate content',
    'Insufficient event details',
    'Duplicate submission',
]

/**
 * Modal used by admins to reject pending timeline events.
 *
 * @param props Modal state and reject callback.
 * @returns Reject confirmation modal.
 */
const ModalConfirmReject: FC<ModalConfirmRejectProps> = (
    props: ModalConfirmRejectProps,
) => {
    const [reason, setReason] = useState<string>('')
    const [note, setNote] = useState<string>('')

    const canSubmit = useMemo(
        () => Boolean(reason) && Boolean(note.trim()),
        [note, reason],
    )

    return (
        <BaseModal
            allowBodyScroll
            onClose={props.onClose}
            open={props.open}
            title='Confirm Reject Event'
        >
            <p className={styles.description}>
                Please provide a reason for rejecting this event.
                {' '}
                This action cannot be undone.
            </p>

            <label className={styles.label} htmlFor='reject-reason'>
                Rejection Reason
            </label>
            <select
                className={styles.input}
                id='reject-reason'
                onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                    setReason(event.target.value)
                }}
                value={reason}
            >
                <option value=''>Select a reason</option>
                {rejectionReasons.map(option => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>

            <label className={styles.label} htmlFor='reject-note'>
                Note
            </label>
            <textarea
                className={styles.textArea}
                id='reject-note'
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                    setNote(event.target.value)
                }}
                rows={4}
                value={note}
            />

            <div className={styles.actions}>
                <Button
                    label='Cancel'
                    onClick={props.onClose}
                    secondary
                />
                <Button
                    disabled={!canSubmit}
                    label='Reject'
                    onClick={() => {
                        void props.onReject({
                            note,
                            reason,
                        })
                        props.onClose()
                    }}
                    primary
                />
            </div>
        </BaseModal>
    )
}

export default ModalConfirmReject
