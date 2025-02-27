import { FC } from 'react'

import { BaseModal, Button } from '~/libs/ui'

import { useEventCallback } from '../../hooks'

import styles from './RejectPendingConfirmDialog.module.scss'

interface RejectPendingConfirmDialogProps {
    open: boolean
    reject: () => void
    setOpen: (isOpen: boolean) => void
}

const RejectPendingConfirmDialog: FC<RejectPendingConfirmDialogProps> = props => {
    const handleClose = useEventCallback(() => props.setOpen(false))
    const handleRemove = useEventCallback(() => {
        props.setOpen(false)
        props.reject()
    })
    return (
        <BaseModal title='Reject Pending' onClose={handleClose} open={props.open}>
            <div className={styles.rejectPendingConfirmDialog}>
                <p>
                    Are you sure? You want to reject pending?
                </p>
                <div className={styles.actionButtons}>
                    <Button secondary size='lg' onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button primary size='lg' onClick={handleRemove}>
                        OK
                    </Button>
                </div>
            </div>
        </BaseModal>
    )
}

export default RejectPendingConfirmDialog
