import { FC, ReactNode } from 'react'

import { Button } from '~/libs/ui'

import styles from './DeleteConfirmationModal.module.scss'

interface DeleteConfirmationModalProps {
    open: boolean
    title: string
    content: ReactNode
    confirmLabel: string
    cancelLabel?: string
    confirmButtonClassName?: string
    isProcessing?: boolean
    onCancel: () => void
    onConfirm: () => void
}

export const DeleteConfirmationModal: FC<DeleteConfirmationModalProps> = (
    props: DeleteConfirmationModalProps,
) => {
    if (!props.open) {
        return null
    }

    return (
        <div
            className={styles.modalOverlay}
            onClick={() => !props.isProcessing && props.onCancel()}
            role='dialog'
            aria-modal='true'
            aria-label={props.title}
        >
            <div
                className={styles.modal}
                onClick={event => event.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <h4 className={styles.modalTitle}>{props.title}</h4>
                    <button
                        className={styles.modalClose}
                        onClick={props.onCancel}
                        disabled={props.isProcessing}
                        aria-label='Close'
                    >
                        ✕
                    </button>
                </div>
                <div className={styles.confirmBody}>
                    <div className={styles.confirmText}>{props.content}</div>
                    <div className={styles.confirmActions}>
                        <Button
                            size='sm'
                            secondary
                            noCaps
                            onClick={props.onCancel}
                            disabled={props.isProcessing}
                        >
                            {props.cancelLabel || 'Cancel'}
                        </Button>
                        <Button
                            size='sm'
                            noCaps
                            onClick={props.onConfirm}
                            disabled={props.isProcessing}
                            className={props.confirmButtonClassName}
                        >
                            {props.confirmLabel}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DeleteConfirmationModal
