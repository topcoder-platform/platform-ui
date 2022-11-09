import { FC } from 'react'

import { BaseModal } from '../base-modal'

import contentUrl from './terms.content.txt'
import styles from './TermsModal.module.scss'

interface TermsModalProps {
    isOpen: boolean
    onClose: () => void
}

const TermsModal: FC<TermsModalProps> = ({ isOpen, onClose }: TermsModalProps) => (
    <BaseModal
        onClose={onClose}
        open={isOpen}
        size='lg'
        title='TOPCODER ONLINE CUSTOMER TERMS OF USE AGREEMENT'
        contentClassName={styles.container}
        contentUrl={contentUrl}
    />
)

export default TermsModal
