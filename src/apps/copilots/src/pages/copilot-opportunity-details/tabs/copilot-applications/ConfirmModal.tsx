/* eslint-disable react/jsx-no-bind */
import { FC } from 'react'

import { BaseModal, Button } from '~/libs/ui'

import styles from './styles.module.scss'

interface ConfirmModalProps {
    onClose: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
    onApply: () => void
}

const ConfirmModal: FC<ConfirmModalProps> = props => (
    <BaseModal
        onClose={props.onClose as () => void}
        open
        size='lg'
        title='Confirm to accept as copilot'
        buttons={(
            <>
                <Button primary onClick={props.onApply} label='Confirm' />
                <Button secondary onClick={props.onClose} label='Cancel' />
            </>
        )}
    >
        <div className={styles.applyCopilotModal}>
            <div className={styles.info}>
                Click &apos;Confirm&apos; to accept by updating project role to &apos;Copilot&apos;
                and complete this opportunity
            </div>
        </div>
    </BaseModal>
)

export default ConfirmModal
