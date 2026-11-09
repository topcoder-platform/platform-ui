import {
    ChangeEvent,
    FC,
    useCallback,
    useState,
} from 'react'

import { ConfirmationModal } from '../ConfirmationModal'

import styles from './RejectEngagementLeadModal.module.scss'

const REASON_MAX_LENGTH = 2000

export interface RejectEngagementLeadModalProps {
    leadId: string
    /** Disables the modal while the rejection is being saved. */
    saving?: boolean
    onCancel: () => void
    onConfirm: (reason: string) => void
}

/**
 * Asks for the mandatory reason before a lead is rejected; Reject stays disabled until one is entered.
 */
export const RejectEngagementLeadModal: FC<RejectEngagementLeadModalProps> = (
    props: RejectEngagementLeadModalProps,
) => {
    const onConfirm = props.onConfirm
    const [reason, setReason] = useState<string>('')
    const trimmedReason = reason.trim()

    const handleReasonChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>): void => {
        setReason(event.target.value)
    }, [])

    const handleConfirm = useCallback((): void => {
        if (trimmedReason) {
            onConfirm(trimmedReason)
        }
    }, [onConfirm, trimmedReason])

    return (
        <ConfirmationModal
            confirmButtonDanger
            confirmDisabled={props.saving || !trimmedReason}
            confirmText='Reject'
            message={`Enter the reason for rejecting lead ${props.leadId}.`}
            onCancel={props.onCancel}
            onConfirm={handleConfirm}
            title='Reject Lead'
        >
            <textarea
                aria-label='Rejection reason'
                className={styles.textarea}
                disabled={props.saving}
                maxLength={REASON_MAX_LENGTH}
                placeholder='Reason for rejecting (required)'
                value={reason}
                onChange={handleReasonChange}
            />
        </ConfirmationModal>
    )
}

export default RejectEngagementLeadModal
