import { FC } from 'react'
import { BaseModal, Button } from '~/libs/ui'
import { ChallengeResource } from '../../models'
import styles from './RemoveUsersConfirmDialog.module.scss'

interface RemoveUsersConfirmDialogProps {
  users: ChallengeResource[]
  open: boolean
  setOpen: (isOpen: boolean) => void
  remove: () => void
}

const RemoveUsersConfirmDialog: FC<RemoveUsersConfirmDialogProps> = ({ users, open, setOpen, remove }) => (
    <BaseModal title='Add User' onClose={() => setOpen(false)} open={open}>
        <div className={styles.removeUsersConfirmDialog}>
            <p>
                {users.length > 1 ? (
                    <>
                        <strong>{users.length}</strong>
                        {' '}
                        users will be removed, are you sure?
                    </>
                ) : (
                    <>
                        Are you sure? You want to remove user
                        {' '}
                        <strong>{users[0].memberHandle}</strong>
                        {' '}
                        ?
                    </>
                )}
            </p>
            <div className={styles.actionButtons}>
                <Button secondary size='lg' onClick={() => setOpen(false)}>
                    Cancel
                </Button>
                <Button
                    primary
                    size='lg'
                    onClick={() => {
                        setOpen(false)
                        remove()
                    }}
                >
                    OK
                </Button>
            </div>
        </div>
    </BaseModal>
)

export default RemoveUsersConfirmDialog
