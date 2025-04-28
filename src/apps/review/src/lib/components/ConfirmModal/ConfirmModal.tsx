/**
 * Confirm Modal.
 */
import { FC, useCallback } from 'react'
import Modal, { ModalProps } from 'react-responsive-modal'
import classNames from 'classnames'

import styles from './ConfirmModal.module.scss'

export interface ConfirmModalProps extends ModalProps {
    action?: string
    onConfirm: () => void
    title: string
    canSave?: boolean
    maxWidth?: string
    isLoading?: boolean
    withoutCancel?: boolean
    cancelText?: string
}

export const ConfirmModal: FC<ConfirmModalProps> = (
    props: ConfirmModalProps,
) => {
    const isLoading = props.isLoading
    const closeHandle = props.onClose
    const handleClose = useCallback(() => {
        if (!isLoading) {
            closeHandle()
        }
    }, [isLoading, closeHandle])
    return (
        <Modal
            classNames={{ root: styles.enhancedModal }}
            styles={{ modal: { width: props.maxWidth } }}
            {...props}
            blockScroll
        >
            <div className={styles['modal-header']}>
                {typeof props.title === 'string' ? (
                    <h3>{props.title}</h3>
                ) : (
                    props.title
                )}
            </div>
            <div className={classNames(styles['modal-body'], 'modal-body')}>
                {props.children}
            </div>
            <div className={styles.buttons}>
                {!props.withoutCancel && (
                    <button
                        type='button'
                        onClick={handleClose}
                        disabled={props.isLoading}
                        className='borderButton'
                    >
                        {props.cancelText || 'Cancel'}
                    </button>
                )}
                <button
                    type='button'
                    disabled={props.canSave === false || props.isLoading}
                    onClick={props.onConfirm}
                    className='filledButton'
                >
                    {props.action || 'Confirm'}
                </button>
            </div>
        </Modal>
    )
}

export default ConfirmModal
