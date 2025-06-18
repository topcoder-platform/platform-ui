import { FC } from 'react'

import { BaseModal, Button } from '~/libs/ui'

import { useEventCallback } from '../../hooks'
import { ChallengeResource } from '../../models'

import styles from './RemoveUsersConfirmDialog.module.scss'

interface RemoveUsersConfirmDialogProps {
    users: ChallengeResource[]
    open: boolean
    remove: () => void
    setOpen: (isOpen: boolean) => void
}

const RemoveUsersConfirmDialog: FC<RemoveUsersConfirmDialogProps> = props => {
    const handleClose = useEventCallback(() => props.setOpen(false))
    const handleRemove = useEventCallback(() => {
        props.setOpen(false)
        props.remove()
    })
    return (
        <BaseModal title='Remove User' onClose={handleClose} open={props.open}>
            <div className={styles.removeUsersConfirmDialog}>
                <p>
                    {props.users.length > 1 ? (
                        <>
                            <strong>{props.users.length}</strong>
                            {' '}
                            users will be
                            removed, are you sure?
                        </>
                    ) : (
                        <>
                            Are you sure? You want to remove user
                            {' '}
                            <strong>{props.users[0].memberHandle}</strong>
                            {' '}
                            ?
                        </>
                    )}
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

export default RemoveUsersConfirmDialog
