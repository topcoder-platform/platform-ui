/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/jsx-no-bind */
import { FC, useEffect, useState } from 'react'

import { Collapsible, LoadingCircles } from '~/libs/ui'
import { UserProfile } from '~/libs/core'

import { Chip } from '../../../lib'
import { OtpModal } from '../../../lib/components/otp-modal'
import { TaxFormCard } from '../../../lib/components/tax-form-card'
import { IconUS, IconWorld } from '../../../lib/assets/tax-forms'
import { getUserTaxFormDetails, setupTaxForm } from '../../../lib/services/wallet'
import { SetupTaxFormResponse, TaxForm } from '../../../lib/models/TaxForm'
import { TaxFormDetail } from '../../../lib/components/tax-form-detail'

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
    // Add more tax forms if needed
]

interface TaxFormsTabProps {
    profile: UserProfile
}

const PaymentsTab: FC<TaxFormsTabProps> = (props: TaxFormsTabProps) => {
    const [setupRequired, setSetupRequired] = useState<boolean | undefined>(undefined)
    const [taxForm, setTaxForm] = useState<TaxForm | undefined>(undefined)
    const [isLoading, setIsLoading] = useState(false)
    const [taxFormToSetup, setTaxFormToSetup] = useState<string | undefined>(undefined)
    const [taxFormSetupData, setTaxFormSetupData] = useState<SetupTaxFormResponse | undefined>(undefined)

    const fetchUserTaxForms = async () => {
        setIsLoading(true)

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
                {TAX_FORM_DETAILS.map((taxForm) => (
                    <TaxFormCard
                        key={taxForm.id}
                        formTitle={taxForm.formTitle}
                        formDescription={taxForm.formDescription}
                        reasonTitle={taxForm.reasonTitle}
                        reasonDescription={taxForm.reasonDescription}
                        completionLabel={taxForm.completionLabel}
                        instructionsLabel={taxForm.instructionsLabel}
                        instructionsLink={taxForm.instructionsLink}
                        additionalInfo={taxForm.additionalInfo}
                        icon={taxForm.icon}
                        onSetupClick={async () => {
                            try {
                                const setupTaxFormResponse = await setupTaxForm(`${props.profile.userId}`, taxForm.id)
                                setTaxFormSetupData(setupTaxFormResponse)

                                fetchUserTaxForms()
                            } catch (err) {
                                console.log('Error setting up tax form', err)
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
                        All members must have a tax form on file before they can be paid. There are two options: a W-9
                        or a W-8BEN. We will walk you through completing your tax form.
                    </p>

                    {isLoading && <LoadingCircles />}

                    {!isLoading && setupRequired === true && renderAllTaxForms()}
                    {!isLoading && setupRequired === false && renderSubmittedTaxForm()}
                </Collapsible>
            </div>

            {taxFormSetupData !== undefined && (
                <OtpModal
                    transactionId={taxFormSetupData.transactionId}
                    isOpen={setupRequired !== undefined}
                    key={taxFormSetupData.eSignLink}
                    onClose={() => {
                        setTaxFormToSetup(undefined)
                    }}
                    onResendClick={() => {
                        // TODO: Call resend OTP API
                    }}
                    onOtpVerified={(eSignLink: string) => {
                        console.log('eSignLink', eSignLink)
                        window.open(taxFormSetupData.eSignLink, '_blank')
                        setTaxFormSetupData(undefined)
                    }}
                />
            )}
        </div>
    )
}

export default PaymentsTab
