/**
 * Confirm Modal.
 */
import { FC } from 'react'

import { ConfirmModalProps } from '~/libs/ui/lib/components/modals/confirm/ConfirmModal'
import { ConfirmModal as ConfirmModalOriginal } from '~/libs/ui'

import styles from './ConfirmModal.module.scss'

export const ConfirmModal: FC<ConfirmModalProps> = (
    props: ConfirmModalProps,
) => (
    <ConfirmModalOriginal
        {...props}
        allowBodyScroll
        blockScroll
        {...{ bodyClassName: styles.bodyClassName }}
    />
)

export default ConfirmModal
