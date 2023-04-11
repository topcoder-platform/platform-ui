import { FC } from 'react'
import { ModalProps } from 'react-responsive-modal'

import { Button } from '../../button'
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
            <Button
                buttonStyle='secondary'
                label='Cancel'
                onClick={props.onClose}
                size='lg'
                tabIndex={1}
            />
            <Button
                buttonStyle='primary'
                label={props.action || 'Confirm'}
                onClick={props.onConfirm}
                size='lg'
                tabIndex={2}
            />
        </div>
    </BaseModal>
)

export default ConfirmModal
