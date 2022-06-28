import { FC } from 'react'
import { ModalProps } from 'react-responsive-modal'

import { Button } from '../../button'
import { BaseModal } from '../base-modal'

export interface ConfirmModalProps extends ModalProps {
    action?: string
    onConfirm: () => void
    title: string
}

const ConfirmModal: FC<ConfirmModalProps> = ({
    children,
    onConfirm,
    action = 'Confirm',
    ...props
}: ConfirmModalProps) => {
    return (
        <BaseModal
            {...props}
            styles={{ modal: { maxWidth: '450px' } }}
        >
            {children}
            <div className='button-container'>
                <Button
                    label='Cancel'
                    onClick={props.onClose}
                    tabIndex={1}
                    buttonStyle='secondary'
                    size='lg'
                />
                <Button
                    buttonStyle='primary'
                    label={action}
                    onClick={onConfirm}
                    tabIndex={2}
                    size='lg'
                />
            </div>
        </BaseModal>
    )
}

export default ConfirmModal
