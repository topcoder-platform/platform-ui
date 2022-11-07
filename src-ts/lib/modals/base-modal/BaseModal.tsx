import classNames from 'classnames'
import { FC } from 'react'
import Modal, { ModalProps } from 'react-responsive-modal'

import { IconOutline } from '../../svgs'

import styles from './BaseModal.module.scss'

export interface BaseModalProps extends ModalProps {
    size?: 'lg' | 'md'
    title: string
}

const BaseModal: FC<BaseModalProps> = ({
    children,
    title,
    ...props
}: BaseModalProps) => (
    <Modal
        {...props}
        classNames={{ modal: `modal-${props.size || 'md'}` }}
        closeIcon={<IconOutline.XIcon width={28} height={28} />}
    >
        <div className={styles['modal-header']}>
            <h3>{title}</h3>
        </div>

        <hr className={styles.spacer} />

        <div className={classNames(styles['modal-body'], 'modal-body')}>
            {children}
        </div>
    </Modal>
)

export default BaseModal
