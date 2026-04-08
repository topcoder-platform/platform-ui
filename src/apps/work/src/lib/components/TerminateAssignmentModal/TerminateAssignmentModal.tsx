/* eslint-disable react/jsx-no-bind */

import {
    FC,
    useCallback,
    useState,
} from 'react'

import {
    BaseModal,
    Button,
} from '~/libs/ui'

import styles from './TerminateAssignmentModal.module.scss'

interface TerminateAssignmentModalProps {
    isProcessing?: boolean
    memberHandle?: string
    onCancel: () => void
    onConfirm: (reason: string) => Promise<void> | void
    open: boolean
}

const TerminateAssignmentModal: FC<TerminateAssignmentModalProps> = (
    props: TerminateAssignmentModalProps,
) => {
    const [reason, setReason] = useState<string>('')
    const [reasonError, setReasonError] = useState<string>('')

    const isProcessing = props.isProcessing === true

    const handleCancel = useCallback((): void => {
        setReason('')
        setReasonError('')
        props.onCancel()
    }, [props])

    const handleConfirm = useCallback(async (): Promise<void> => {
        const trimmedReason = reason.trim()

        if (!trimmedReason) {
            setReasonError('Termination reason is required.')
            return
        }

        await props.onConfirm(trimmedReason)

        setReason('')
        setReasonError('')
    }, [props, reason])

    return (
        <BaseModal
            open={props.open}
            onClose={handleCancel}
            title='Terminate Assignment'
            size='md'
            buttons={(
                <div className={styles.actions}>
                    <Button
                        label='Cancel'
                        onClick={handleCancel}
                        secondary
                    />
                    <Button
                        label={isProcessing ? 'Terminating...' : 'Terminate'}
                        onClick={handleConfirm}
                        primary
                        disabled={isProcessing}
                    />
                </div>
            )}
        >
            <div className={styles.content}>
                <p className={styles.message}>
                    {`Are you sure you want to terminate the assignment for ${props.memberHandle || 'this member'}?`}
                </p>

                <label className={styles.label} htmlFor='terminate-assignment-reason'>
                    Termination reason *
                </label>
                <textarea
                    id='terminate-assignment-reason'
                    className={styles.textarea}
                    onChange={event => {
                        setReason(event.target.value)
                        setReasonError('')
                    }}
                    placeholder='Add a reason for termination'
                    rows={4}
                    value={reason}
                />
                {reasonError
                    ? <p className={styles.error}>{reasonError}</p>
                    : undefined}
            </div>
        </BaseModal>
    )
}

export default TerminateAssignmentModal
