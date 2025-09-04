import { ReactNode, useCallback, useState } from 'react'

import ConfirmModal, { ConfirmModalProps } from './ConfirmModal'

export interface ConfirmationProps extends Omit<ConfirmModalProps, 'open'|'onClose'|'onConfirm'> {
    content: ConfirmModalProps['children']
}

/**
 * Shows a confirmation modal and returns a promise that resolves to confirmed or canceled (true or false)
 * Ex usage:
 * ```
 *    const confirmModal = useConfirmationModal()
 *    ...
 *    const confirmed: boolean = await confirmModal.confirm({
 *        content: 'Are you sure you want to delete this entry?',
 *        title: 'Confirm Delete',
 *    })
 *    ...
 *    // render the modal
 *    {confirmModal.modal}
 * ```
 * @returns
 */
export const useConfirmationModal = (): {
    confirm: (prosp: ConfirmationProps) => Promise<boolean>
    modal: ReactNode
} => {
    const [modal, setModal] = useState<ReactNode>()

    const renderModal = useCallback((props: ConfirmationProps, onClose: () => void, onConfirm: () => void) => (
        <ConfirmModal
            {...props}
            onClose={onClose}
            onConfirm={onConfirm}
            open
        >
            {props.content}
        </ConfirmModal>
    ), [])

    const confirm = useCallback((props: ConfirmationProps) => (
        new Promise<boolean>(resolve => {

            const onClose = (): void => {
                setModal(undefined)
                resolve(false)
            }

            const onConfirm = (): void => {
                setModal(undefined)
                resolve(true)
            }

            setModal(renderModal(props, onClose, onConfirm))
        })
    ), [renderModal])

    return {
        confirm,
        modal,
    }
}
