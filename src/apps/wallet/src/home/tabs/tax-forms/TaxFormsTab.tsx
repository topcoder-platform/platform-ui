import { FC, useEffect, useState } from 'react'
import { toast } from 'react-toastify'

import { Collapsible, LoadingCircles } from '~/libs/ui'
import { UserProfile } from '~/libs/core'
import { downloadBlob } from '~/libs/shared'

import { Chip } from '../../../lib'
import { OtpModal } from '../../../lib/components/otp-modal'
import { TaxFormCard } from '../../../lib/components/tax-form-card'
import { IconUS, IconWorld } from '../../../lib/assets/tax-forms'
import {
    getRecipientViewURL, getUserTaxFormDetails, removeTaxForm, resendOtp, setupTaxForm,
} from '../../../lib/services/wallet'
import { TaxForm } from '../../../lib/models/TaxForm'
import { TaxFormDetail } from '../../../lib/components/tax-form-detail'
import { TransactionResponse } from '../../../lib/models/TransactionId'

import styles from './TaxFormsTab.module.scss'

const TAX_FORM_DETAILS = [
    {
        completionLabel: 'Complete Form W-9',
        completionLink: 'https://www.irs.gov/pub/irs-pdf/fw9.pdf',
        formDescription: 'For individuals who are a US citizen or other US person (such as a resident alien).',
        formTitle: 'TAX FORM W-9',
        icon: <IconUS />,
        id: 'W-9',
        instructionsLabel: 'Instructions',
        instructionsLink: 'https://www.irs.gov/pub/irs-pdf/iw9.pdf',
        reasonDescription:
            // eslint-disable-next-line max-len
            'Topcoder must receive your correctly completed W-9 to report to the IRS income paid to you. Topcoder’s policy is not to issue payments to US members until a properly completed Form W-9 is received from the member.',
        reasonTitle: 'Why do I need to complete Form W-9?',
    },
    {
        additionalInfo: {
            // eslint-disable-next-line max-len
            note: 'Topcoder’s policy is not to issue payments to foreign members until a properly completed Form W-8BEN is received from the member.',
            purpose: {
                points: [
                    'Establish that you are not a U.S. person',
                    'Claim that you are the beneficial owner of the income for which Form W-8BEN is being provided',
                ],
                title: 'The W-8BEN is required to',
            },
        },
        completionLabel: 'Complete Form W-8BEN',
        completionLink: 'https://www.irs.gov/pub/irs-pdf/fw8ben.pdf',
        formDescription:
            // eslint-disable-next-line max-len
            'For individuals who are NOT a US citizen or other US person (such as a foreign person, non-resident alien or foreign national).',
        formTitle: 'TAX FORM W-8BEN',
        icon: <IconWorld />,
        id: 'W-8BEN',
        instructionsLabel: 'Instructions',
        instructionsLink: 'https://www.irs.gov/pub/irs-pdf/iw8ben.pdf',
        reasonDescription:
            // eslint-disable-next-line max-len
            'Under current IRS guidance, foreign persons performing services outside of the U.S. are not subject to income tax withholding. However, Topcoder requires all such members to provide a properly filled out W-8BEN prior to issuing payment. In addition, prize money paid to foreign persons who are not performing services (such as winning an SRM competition) is subject to withholding taxes.',
        reasonTitle: 'Why do I need to complete Form W-8BEN?',
    },
    {
        additionalInfo: {
            // eslint-disable-next-line max-len
            note: 'Topcoder’s policy is not to issue payments to foreign businesses until a properly completed Form W-8BEN-E is received from the member.',
            purpose: {
                points: [
                    'Establish that you are not a U.S. business',
                    'Claim that you are the beneficial owner of the income for which Form W-8BEN-E is being provided',
                ],
                title: 'The W-8BEN-E is required to',
            },
        },
        completionLabel: 'Complete Form W-8BEN-E',
        completionLink: 'https://www.irs.gov/pub/irs-pdf/fw8ben.pdf',
        formDescription:
            // eslint-disable-next-line max-len
            'For businesses who are NOT a US business or other US person (such as a foreign business, non-resident alien or foreign national).',
        formTitle: 'TAX FORM W-8BEN-E',
        icon: <IconWorld />,
        id: 'W-8BEN-E',
        instructionsLabel: 'Instructions',
        instructionsLink: 'https://www.irs.gov/pub/irs-pdf/iw8ben.pdf',
        reasonDescription:
            // eslint-disable-next-line max-len
            'Under current IRS guidance, foreign persons performing services outside of the U.S. are not subject to income tax withholding. However, Topcoder requires all such members to provide a properly filled out W-8BEN prior to issuing payment. In addition, prize money paid to foreign persons who are not performing services (such as winning an SRM competition) is subject to withholding taxes.',
        reasonTitle: 'Why do I need to complete Form W-8BEN-E?',
    },
]

interface TaxFormsTabProps {
    profile: UserProfile
}

const PaymentsTab: FC<TaxFormsTabProps> = (props: TaxFormsTabProps) => {
    const [setupRequired, setSetupRequired] = useState<boolean | undefined>(undefined)
    const [taxForm, setTaxForm] = useState<TaxForm | undefined>(undefined)
    const [isLoading, setIsLoading] = useState(false)
    const [otpFlow, setOtpFlow] = useState<TransactionResponse | undefined>(undefined)

    async function fetchUserTaxForms(refresh: boolean = true): Promise<void> {
        setIsLoading(refresh)

        try {
            const taxForms = await getUserTaxFormDetails()

            if (taxForms.length === 0) {
                setSetupRequired(true)
            } else {
                setSetupRequired(false)
                setTaxForm(taxForms[0])
            }
        } catch (apiError) {
            // setUserPaymentProvider(undefined)
        }

        setIsLoading(false)
    }

    useEffect(() => {
        fetchUserTaxForms()
    }, [])

    function renderAllTaxForms(): JSX.Element {
        return (
            <div className={styles.stacked}>
                {TAX_FORM_DETAILS.map(form => (
                    <TaxFormCard
                        key={form.id}
                        formTitle={form.formTitle}
                        formDescription={form.formDescription}
                        reasonTitle={form.reasonTitle}
                        reasonDescription={form.reasonDescription}
                        completionLabel={form.completionLabel}
                        instructionsLabel={form.instructionsLabel}
                        instructionsLink={form.instructionsLink}
                        additionalInfo={form.additionalInfo}
                        icon={form.icon}
                        onSetupClick={async function onSetupTaxFormClick() {
                            try {
                                const transaction = await setupTaxForm(`${props.profile.userId}`, form.id)

                                setOtpFlow({
                                    ...transaction,
                                    type: 'SETUP_TAX_FORM',
                                })
                                fetchUserTaxForms(false)
                            } catch (err) {
                                toast.error(
                                    (err as Error).message ?? 'Something went wrong. Please try again.',
                                    { position: toast.POSITION.BOTTOM_RIGHT },
                                )
                            }

                        }}
                    />
                ))}
            </div>
        )
    }

    function renderSubmittedTaxForm(): JSX.Element | undefined {
        if (taxForm === undefined) {
            return undefined
        }

        const key = taxForm.taxForm.name

        const date = new Date(taxForm.dateFiled)
        date.setFullYear(date.getFullYear() + 3)
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }

        const formattedDate = date.toLocaleDateString('en-US', options)

        return (
            <TaxFormDetail
                title={taxForm.status === 'ACTIVE' ? 'Tax Form Submitted' : 'Tax Form Submitted - Pending Signature'}
                // eslint-disable-next-line max-len
                description={`You have submitted a ${key} Tax Form via DocuSign. Resubmission of forms required on ${formattedDate}`}
                status={taxForm.status}
                onDeleteClick={async function onDeleteClick() {
                    removeTaxForm(taxForm.id)
                        .then((transaction: TransactionResponse) => {
                            setOtpFlow({ ...transaction, type: 'REMOVE_TAX_FORM' })
                        })
                        .catch((err: unknown) => {
                            toast.error(
                                (err as Error).message ?? 'Something went wrong. Please try again.',
                                { position: toast.POSITION.BOTTOM_RIGHT },
                            )
                        })
                }}
                onResendOtpClick={async function onResendOtpClick() {
                    try {
                        const response: TransactionResponse = await resendOtp(taxForm.transactionId)
                        setOtpFlow({
                            ...response,
                            type: 'SETUP_TAX_FORM',
                        })
                    } catch (err: unknown) {
                        toast.error(
                            (err as Error).message ?? 'Something went wrong. Please try again.',
                            { position: toast.POSITION.BOTTOM_RIGHT },
                        )
                    }
                }}
                onGetRecipientURL={async function onGetRecipientURL() {
                    try {
                        const response: TransactionResponse = await getRecipientViewURL()
                        setOtpFlow({
                            ...response,
                            type: 'VIEW_TAX_FORM',
                        })
                    } catch (err: unknown) {
                        toast.error(
                            (err as Error).message ?? 'Something went wrong. Please try again.',
                            { position: toast.POSITION.BOTTOM_RIGHT },
                        )
                    }
                }}
                onDownloadClick={async function onDownloadSignedDocumentClick() {
                    try {
                        const response: TransactionResponse = await getRecipientViewURL()
                        setOtpFlow({
                            ...response,
                            type: 'DOWNLOAD_TAX_FORM',
                        })
                    } catch (err: unknown) {
                        toast.error(
                            (err as Error).message ?? 'Something went wrong. Please try again.',
                            { position: toast.POSITION.BOTTOM_RIGHT },
                        )
                    }
                }}
            />
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>TAX FORM SUBMISSION</h3>
                {!isLoading && setupRequired === true && <Chip text='Setup Required' />}
            </div>

            <div className={styles.content}>
                <Collapsible header={<h3>TAX FORM REQUIREMENTS</h3>}>
                    <p className={`${styles.contentTitle} body-main`}>
                        All members must have a tax form on file before they can be paid.
                        There are three options: a W-9, W-8BEN, or W-8BENE
                    </p>

                    {isLoading && <LoadingCircles />}

                    {!isLoading && setupRequired === true && renderAllTaxForms()}
                    {!isLoading && setupRequired === false && renderSubmittedTaxForm()}
                </Collapsible>
            </div>

            {otpFlow !== undefined && (
                <OtpModal
                    transactionId={otpFlow.transactionId}
                    key={otpFlow.transactionId}
                    userEmail={otpFlow.email}
                    isOpen={otpFlow !== undefined}
                    isBlob={otpFlow.type === 'DOWNLOAD_TAX_FORM'}
                    onClose={function onOtpModalClose() {
                        setOtpFlow(undefined)
                    }}
                    onResendClick={function onResendClick() {
                        resendOtp(otpFlow.transactionId)
                    }}
                    onOtpVerified={function onOtpVerified(data: unknown) {
                        switch (otpFlow.type) {
                            case 'REMOVE_TAX_FORM':
                                fetchUserTaxForms(false)
                                break
                            case 'SETUP_TAX_FORM':
                            case 'VIEW_TAX_FORM':
                                fetchUserTaxForms(false)
                                if ((data instanceof Blob)
                                    || (data as { eSignLink: string })?.eSignLink === undefined
                                    || (data as { eSignLink: string })?.eSignLink?.length === 0) {
                                    toast.success(
                                        'You have already signed this document.',
                                        { position: toast.POSITION.BOTTOM_RIGHT },
                                    )
                                } else {
                                    window.open((data as { eSignLink: string })?.eSignLink, '_blank')
                                }

                                break
                            case 'DOWNLOAD_TAX_FORM':
                                downloadBlob(data as Blob, `tax-form-${props.profile.userId}-${new Date()
                                    .getTime()}.pdf`)
                                break
                            default:
                                break
                        }

                        setOtpFlow(undefined)
                    }}
                />
            )}
        </div>
    )
}

export default PaymentsTab
