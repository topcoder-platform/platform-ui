import { FC } from 'react'

import { BaseModal } from '../base-modal'

import contentUrl from './order-contract.content.txt'
import styles from './OrderContractModal.module.scss'

interface OrderContractModalProps {
    isOpen: boolean
    onClose: () => void
}

const OrderContractModal: FC<OrderContractModalProps> = ({ isOpen, onClose }: OrderContractModalProps) => (
    <BaseModal
        onClose={onClose}
        open={isOpen}
        size='lg'
        title='TOPCODER ONLINE ORDER USER AGREEMENT'
        contentClassName={styles.container}
        contentUrl={contentUrl}
    />
)

export default OrderContractModal
