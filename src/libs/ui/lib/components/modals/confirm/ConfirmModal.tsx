import { FC } from 'react'
import { ModalProps } from 'react-responsive-modal'

import { Button } from '../../button'
import { BaseModal } from '../base-modal'

export interface ConfirmModalProps extends ModalProps {
    action?: string
    onConfirm: () => void
    title: string
    canSave?: boolean
    showButtons?: boolean
}

const ConfirmModal: FC<ConfirmModalProps> = (props: ConfirmModalProps) => (
    <BaseModal
        {...props}
        styles={{ modal: { maxWidth: '450px' } }}
        buttons={(
            props.showButtons !== false && (
                <>
                    <Button
                        secondary
                        label='Cancel'
                        onClick={props.onClose}
                        size='lg'
                        tabIndex={1}
                    />
                    <Button
                        disabled={props.canSave === false}
                        primary
                        label={props.action || 'Confirm'}
                        onClick={props.onConfirm}
                        size='lg'
                        tabIndex={2}
                    />
                </>
            )
        )}
    >
        {props.children}
    </BaseModal>
)

export default ConfirmModal
