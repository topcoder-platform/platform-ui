import { FC, useCallback } from 'react'
import { ModalProps } from 'react-responsive-modal'

import { Button } from '../../button'
import { BaseModal } from '../base-modal'

export interface ConfirmModalProps extends ModalProps {
    action?: string
    onConfirm: () => void
    title: string
    canSave?: boolean
    showButtons?: boolean
    maxWidth?: string
    size?: 'sm' | 'md' | 'lg'
    isProcessing?: boolean
}

const ConfirmModal: FC<ConfirmModalProps> = (props: ConfirmModalProps) => {
    const handleConfirm = useCallback((): void => props.onConfirm(), [props.onConfirm])

    return (
        <BaseModal
            {...props}
            styles={{ modal: { maxWidth: props.maxWidth ?? '450px' } }}
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
                            disabled={props.isProcessing || props.canSave === false}
                            primary
                            label={props.action || 'Confirm'}
                            onClick={handleConfirm}
                            size='lg'
                            tabIndex={2}
                            loading={props.isProcessing}
                        />
                    </>
                )
            )}
        >
            {props.children}
        </BaseModal>
    )
}

export default ConfirmModal
