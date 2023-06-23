import { FC, ReactNode } from 'react'

import { BaseModal, BaseModalProps } from '~/libs/ui'

import styles from './CertificateModal.module.scss'

interface CertificateModalProps extends BaseModalProps {
    children?: ReactNode
}

const CertificateModal: FC<CertificateModalProps> = (props: CertificateModalProps) => (
    <BaseModal
        size='body'
        classNames={{ modal: styles.certificateModal }}
        {...props}
    >
        <div className={styles.wrap}>
            {props.children}
        </div>
    </BaseModal>
)

export default CertificateModal
