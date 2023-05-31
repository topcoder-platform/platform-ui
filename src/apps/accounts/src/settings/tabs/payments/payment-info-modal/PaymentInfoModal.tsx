import { FC } from 'react'

import { BaseModal, Button, InputText } from '~/libs/ui'

import styles from './PaymentInfoModal.module.scss'

interface PaymentInfoModalProps {
    hasEmailedSupport: boolean
    selectedPaymentProvider: string
    handlePaymentSelection: () => void
    handleModalClose: () => void
    handleCheckboxChange: () => void
    handleVisitProviderClick: () => void
}

const PaymentInfoModal: FC<PaymentInfoModalProps> = (props: PaymentInfoModalProps) => (
    <BaseModal
        buttons={(
            <Button
                primary
                size='lg'
                label='Confirm'
                disabled={!props.hasEmailedSupport}
                onClick={props.handlePaymentSelection}
            />
        )}
        onClose={props.handleModalClose}
        open
        size='body'
        title={`CONNECT YOUR ${props.selectedPaymentProvider} ACCOUNT`}
        classNames={{ modal: styles.infoModal }}
    >
        <div className={styles.modalContent}>
            <div className={styles.modalContentLeft}>
                <div className={styles.infoSection}>
                    <h4>
                        DO YOU HAVE YOUR
                        {' '}
                        {props.selectedPaymentProvider}
                        {' '}
                        ACCOUNT DETAILS? GREAT!
                    </h4>
                    <ul className={styles.infoItemsList}>
                        <li>
                            Email
                            {' '}
                            <a href='mailto:support@topcoder.com'>support@topcoder.com</a>
                        </li>
                        <li>Subject Line: Topcoder Payment Provider</li>
                        <li>In the email include:</li>
                        <ul className={styles.infoItemsList}>
                            <li>Topcoder handle (your username when registering)</li>
                            {
                                props.selectedPaymentProvider === 'Payoneer' && (
                                    <>
                                        <li>Payoneer Customer ID</li>
                                        <li>Payoneer Email Address</li>
                                    </>
                                )
                            }
                            {
                                props.selectedPaymentProvider === 'PayPal' && (
                                    <>
                                        <li>PayPal Email Address</li>
                                        <li>
                                            Please DO NOT provide a link to your PayPal account.
                                            We only need your PayPal email address.
                                        </li>
                                    </>
                                )
                            }
                            {
                                props.selectedPaymentProvider === 'Western Union' && (
                                    <>
                                        <li>
                                            Topcoder Email Address (the email address you used to register)
                                        </li>
                                    </>
                                )
                            }
                        </ul>
                    </ul>
                </div>
                <div className={styles.checkboxWrap}>
                    <InputText
                        label=' '
                        checked={props.hasEmailedSupport}
                        type='checkbox'
                        name='hasEmailedSupport'
                        onChange={props.handleCheckboxChange}
                        tabIndex={0}
                        value={props.hasEmailedSupport}
                    />
                    <p>
                        Yes, I have emailed my details to
                        {' '}
                        <a href='mailto:support@topcoder.com'>support@topcoder.com</a>
                    </p>
                </div>
            </div>
            <div className={styles.modalContentRight}>
                <h4>
                    Create
                    {' '}
                    {props.selectedPaymentProvider}
                    {' '}
                    Account
                </h4>

                <p className={styles.warnText}>
                    Important: After you create an account, please email support@topcoder.com
                    with the information outlined
                </p>

                {
                    props.selectedPaymentProvider === 'Payoneer' && (
                        <p>
                            You can elect to receive payments through Payoneer either to your Payoneer
                            prepaid MasterCard or by using their Global Bank Transfer service.
                            The Payoneer Bank Transfer Service offers a local bank transfer option
                            (where available) and a wire transfer option. Certain fees may apply.
                        </p>
                    )
                }

                {
                    props.selectedPaymentProvider === 'PayPal' && (
                        <p>
                            You can elect to receive payments deposited directly to your PayPal account.
                            Certain fees may apply.
                        </p>
                    )
                }

                {
                    props.selectedPaymentProvider === 'Western Union' && (
                        <>
                            <p>
                                You can elect to be paid via wire transfer through Western Union.
                                There is a US $8 charge for each payment processed by Western Union,
                                which will be deducted from the amount owed to you. You can elect
                                to be paid in either USD or your local currency. However, Western Union
                                does not disclose it’s fees to convert to your local currency so we
                                recommend you choose to receive USD. You may then be subject to
                                conversion fees by your local bank.
                            </p>
                            <p>
                                <strong className='body-main-bold'>Important: </strong>
                                Use your Topcoder handle as the Payee ID during registration.
                                Use the Preferred Form of Payment as “Fastest,” rather than “Least Cost.”
                                “Least Cost” uses ACH as a form of payment, which is not
                                supported in all countries.
                            </p>
                            <p>
                                If you elect to be paid by Western Union, your payment request will
                                be queued and processed semi-monthly, on the 15th and last business
                                day of the month. If the 15th or last day of the month falls on a
                                weekend or holiday, Western Union payments will be processed
                                the next business day.
                            </p>
                            <p>
                                In order to be included in the semi-monthly payments,
                                you need to select which payments you would like to be paid
                                for by 10:00 AM EST on the day of the scheduled payment.
                            </p>
                        </>
                    )
                }

                <Button
                    primary
                    size='lg'
                    label={`Visit ${props.selectedPaymentProvider} to create an account`}
                    onClick={props.handleVisitProviderClick}
                    disabled={props.hasEmailedSupport}
                />
            </div>
        </div>
    </BaseModal>
)

export default PaymentInfoModal
