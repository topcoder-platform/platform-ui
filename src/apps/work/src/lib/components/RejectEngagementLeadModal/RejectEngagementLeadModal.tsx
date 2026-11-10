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
 * Asks for the mandatory reason before a lead is marked Lost; Mark Lost stays disabled until one is entered.
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
            confirmText='Mark Lost'
            message={`Enter the reason lead ${props.leadId} was lost.`}
            onCancel={props.onCancel}
            onConfirm={handleConfirm}
            title='Mark Lead as Lost'
        >
            <textarea
                aria-label='Rejection reason'
                className={styles.textarea}
                disabled={props.saving}
                maxLength={REASON_MAX_LENGTH}
                placeholder='Reason the lead was lost (required)'
                value={reason}
                onChange={handleReasonChange}
            />
        </ConfirmationModal>
    )
}

export default RejectEngagementLeadModal
