/* eslint-disable no-void */
/* eslint-disable react/jsx-no-bind */
import { FC } from 'react'

import { ConfirmModal } from '~/libs/ui'

import styles from './ModalDeleteConfirmation.module.scss'

interface ModalDeleteConfirmationProps {
    handle: string
    id: string
    onClose: () => void
    onDelete: (id: string) => Promise<void> | void
    open: boolean
    title: string
}

/**
 * Confirmation modal used before deleting a timeline event.
 *
 * @param props Delete target and callbacks.
 * @returns Delete confirmation dialog.
 */
const ModalDeleteConfirmation: FC<ModalDeleteConfirmationProps> = (
    props: ModalDeleteConfirmationProps,
) => (
    <ConfirmModal
        action='Yes, Delete'
        onClose={props.onClose}
        onConfirm={() => {
            void props.onDelete(props.id)
            props.onClose()
        }}
        open={props.open}
        title='Delete Confirmation'
    >
        <p className={styles.description}>
            Are you sure you want to delete the event
            {' '}
            <strong>
                “
                {props.title}
                ”
            </strong>
            {' '}
            from
            {' '}
            <strong>{props.handle}</strong>
            ?
        </p>
    </ConfirmModal>
)

export default ModalDeleteConfirmation
