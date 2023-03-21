import { FC, ReactNode } from 'react'

import { BaseModal, BaseModalProps } from '../../../../../lib'

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
        {props.children}
    </BaseModal>
)

export default CertificateModal
