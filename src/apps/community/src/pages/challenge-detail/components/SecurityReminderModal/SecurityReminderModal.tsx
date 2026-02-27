import { FC } from 'react'

import { BaseModal, Button } from '~/libs/ui'

import styles from './SecurityReminderModal.module.scss'

interface SecurityReminderModalProps {
    onCancel: () => void
    onOk: () => void
}

/**
 * Displays a registration security reminder before continuing.
 *
 * @param props Modal callbacks.
 * @returns Security reminder modal.
 */
const SecurityReminderModal: FC<SecurityReminderModalProps> = (
    props: SecurityReminderModalProps,
) => (
    <BaseModal
        allowBodyScroll
        onClose={props.onCancel}
        open
        title='Important Reminder'
    >
        <div className={styles.body}>
            <p>
                In accordance with the Terms & Conditions and Code of Conduct, you agree to keep private
                any downloaded data and delete it after challenge completion.
            </p>

            <div className={styles.actions}>
                <Button onClick={props.onCancel} secondary>
                    Cancel
                </Button>
                <Button onClick={props.onOk} primary>
                    I Agree
                </Button>
            </div>
        </div>
    </BaseModal>
)

export default SecurityReminderModal
