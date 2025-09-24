import { FC, useCallback } from 'react'
import { ModalProps } from 'react-responsive-modal'

import { Button } from '../../button'
import { BaseModal } from '../base-modal'
import { LoadingSpinner } from '../../loading-spinner'

import styles from './ConfirmModal.module.scss'

export interface ConfirmModalProps extends ModalProps {
    action?: string
    onConfirm: () => void
    title: string
    canSave?: boolean
    showButtons?: boolean
    maxWidth?: string
    size?: 'sm' | 'md' | 'lg'
    allowBodyScroll?: boolean
    isLoading?: boolean
    isProcessing?: boolean
}

const ConfirmModal: FC<ConfirmModalProps> = (props: ConfirmModalProps) => {
    const isLoading = props.isLoading
    const handleConfirm = useCallback((): void => props.onConfirm(), [props.onConfirm])
    const handleClose = useCallback(() => {
        if (!isLoading) {
            props.onClose?.()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading])

    return (
        <BaseModal
            {...props}
            onClose={handleClose}
            styles={{ modal: { maxWidth: props.maxWidth ?? '450px' } }}
            buttons={(
                props.showButtons !== false && (
                    <>

                        {props.isLoading && (
                            <div className={styles.dialogLoadingSpinnerContainer}>
                                <LoadingSpinner className={styles.spinner} />
                            </div>
                        )}
                        <Button
                            secondary
                            label='Cancel'
                            onClick={handleClose}
                            size='lg'
                            // eslint-disable-next-line jsx-a11y/tabindex-no-positive
                            tabIndex={1}
                            disabled={props.isLoading}
                        />
                        <Button
                            disabled={props.canSave === false || props.isLoading || props.isProcessing}
                            primary
                            label={props.action || 'Confirm'}
                            onClick={handleConfirm}
                            size='lg'
                            // eslint-disable-next-line jsx-a11y/tabindex-no-positive
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
