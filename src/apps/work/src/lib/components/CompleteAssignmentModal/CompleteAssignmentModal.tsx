import {
    FC,
    useCallback,
} from 'react'

import {
    BaseModal,
    Button,
} from '~/libs/ui'

import styles from './CompleteAssignmentModal.module.scss'

interface CompleteAssignmentModalProps {
    isProcessing?: boolean
    memberHandle?: string
    onCancel: () => void
    onConfirm: () => Promise<void> | void
    open: boolean
}

const CompleteAssignmentModal: FC<CompleteAssignmentModalProps> = (
    props: CompleteAssignmentModalProps,
) => {
    const isProcessing = props.isProcessing === true
    const memberHandle = props.memberHandle || 'this member'
    const message = `Are you sure you want to mark the assignment for ${memberHandle} `
        + 'as completed on this engagement?'

    const handleConfirm = useCallback(async (): Promise<void> => {
        await props.onConfirm()
    }, [props])

    return (
        <BaseModal
            open={props.open}
            onClose={props.onCancel}
            title='Complete Assignment'
            size='md'
            buttons={(
                <div className={styles.actions}>
                    <Button
                        label='Cancel'
                        onClick={props.onCancel}
                        secondary
                    />
                    <Button
                        label={isProcessing ? 'Completing...' : 'Complete'}
                        onClick={handleConfirm}
                        className={styles.confirmButton}
                        primary
                        disabled={isProcessing}
                    />
                </div>
            )}
        >
            <div className={styles.content}>
                <p className={styles.message}>
                    {message}
                </p>
            </div>
        </BaseModal>
    )
}

export default CompleteAssignmentModal
