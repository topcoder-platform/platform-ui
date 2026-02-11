import {
    FC,
    MouseEvent,
    useCallback,
} from 'react'

import { Button } from '~/libs/ui'

import styles from './ConfirmationModal.module.scss'

export interface ConfirmationModalProps {
    cancelText?: string
    confirmText?: string
    message: string
    onCancel: () => void
    onConfirm: () => void
    title: string
}

export const ConfirmationModal: FC<ConfirmationModalProps> = (
    props: ConfirmationModalProps,
) => {
    const handleContainerClick = useCallback(
        (event: MouseEvent<HTMLDivElement>): void => {
            event.stopPropagation()
        },
        [],
    )

    return (
        <div
            className={styles.overlay}
            onClick={props.onCancel}
            role='presentation'
        >
            <div
                aria-modal='true'
                className={styles.container}
                onClick={handleContainerClick}
                role='dialog'
            >
                <header className={styles.header}>
                    <h4 className={styles.title}>{props.title}</h4>
                </header>

                <div className={styles.body}>
                    <p className={styles.message}>{props.message}</p>
                </div>

                <footer className={styles.footer}>
                    <Button
                        label={props.cancelText || 'Cancel'}
                        onClick={props.onCancel}
                        secondary
                        size='lg'
                    />
                    <Button
                        label={props.confirmText || 'Confirm'}
                        onClick={props.onConfirm}
                        primary
                        size='lg'
                    />
                </footer>
            </div>
        </div>
    )
}

export default ConfirmationModal
