/* eslint-disable react/jsx-wrap-multilines */
/* eslint-disable react/jsx-no-bind */
import { FC } from 'react'

import { BaseModal, Button, IconOutline, LinkButton } from '~/libs/ui'

import { PayoneerLogo, PayPalLogo } from '../../../../lib'

import styles from './PaymentInfoModal.module.scss'

interface PaymentInfoModalProps {
    selectedPaymentProvider: string
    handlePaymentSelection: (provider: string) => void
    handleModalClose: () => void
}

function renderPayoneer(): JSX.Element {
    return (
        <>
            <PayoneerLogo />
            <p>
                You can elect to receive payments through Payoneer either to your Payoneer prepaid MasterCard or by
                using their Global Bank Transfer service. The Payoneer Bank Transfer Service offers a local bank
                transfer option (where available) and a wire transfer option. Certain fees may apply.
            </p>
            <p>
                You will be directed to Payoneer&apos;s website in a new tab to complete your connection. Please make
                sure your account is fully verified to ensure withdrawal success.
                <strong className='body-main-bold'>
                    You can return here after finishing up on Payoneer&apos;s site.
                </strong>
            </p>
        </>
    )
}

function renderPaypal(): JSX.Element {
    return (
        <>
            <PayPalLogo />
            <p>You can elect to receive payments deposited directly to your PayPal account. Certain fees may apply.</p>
            <p>
                You will be directed to PayPal&apos;s website in a new tab to complete your connection. Please make
                sure your account is fully verified to ensure withdrawal success.
                {' '}
                <strong className='body-main-bold'>
                    You can return here after finishing up
                    on PayPal&apos;s site.
                </strong>
            </p>
        </>
    )
}

const PaymentInfoModal: FC<PaymentInfoModalProps> = (props: PaymentInfoModalProps) => (
    <BaseModal
        buttons={
            <div>
                <LinkButton size='lg' label='Cancel' onClick={props.handleModalClose} />
                <Button
                    primary
                    size='lg'
                    label='Confirm'
                    icon={IconOutline.ExternalLinkIcon}
                    iconToRight
                    disabled={false}
                    onClick={() => {
                        props.handlePaymentSelection(props.selectedPaymentProvider)
                    }}
                />
            </div>
        }
        onClose={props.handleModalClose}
        open
        size='body'
        title='CONNECT PAYMENT PROVIDER ACCOUNT'
        classNames={{ modal: styles.infoModal }}
    >
        <div className={styles.modalContent}>
            {props.selectedPaymentProvider === 'Payoneer' ? renderPayoneer() : renderPaypal()}
        </div>
    </BaseModal>
)

export default PaymentInfoModal
