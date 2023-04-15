import { FC } from 'react'
import { ModalProps } from 'react-responsive-modal'

import { UiButton } from '../../ui-button'
import { BaseModal } from '../base-modal'

export interface ConfirmModalProps extends ModalProps {
    action?: string
    onConfirm: () => void
    title: string
}

const ConfirmModal: FC<ConfirmModalProps> = (props: ConfirmModalProps) => (
    <BaseModal
        {...props}
        styles={{ modal: { maxWidth: '450px' } }}
    >
        {props.children}
        <div className='button-container'>
            <UiButton
                secondary
                label='Cancel'
                onClick={props.onClose}
                size='xl'
                tabIndex={1}
            />
            <UiButton
                primary
                label={props.action || 'Confirm'}
                onClick={props.onConfirm}
                size='xl'
                tabIndex={2}
            />
        </div>
    </BaseModal>
)

export default ConfirmModal
