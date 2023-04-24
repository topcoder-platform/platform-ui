import { FC } from 'react'

import { BaseModal } from '~/libs/ui'

import contentUrl from './order-contract.content.txt'
import styles from './OrderContractModal.module.scss'

interface OrderContractModalProps {
    isOpen: boolean
    onClose: () => void
}

const OrderContractModal: FC<OrderContractModalProps>
    = (props: OrderContractModalProps) => (
        <BaseModal
            onClose={props.onClose}
            open={props.isOpen}
            size='lg'
            title='TOPCODER ONLINE ORDER USER AGREEMENT'
            contentClassName={styles.container}
            contentUrl={contentUrl}
        />
    )

export default OrderContractModal
