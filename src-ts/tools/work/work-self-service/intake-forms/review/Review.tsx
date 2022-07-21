import { CardNumberElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe, PaymentMethodResult, Stripe, StripeCardNumberElement, StripeElements } from '@stripe/stripe-js'
import moment from 'moment'
import React, { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react'
import { toastr } from 'react-redux-toastr'
import { NavigateFunction, useNavigate, useParams } from 'react-router-dom'

import { ReactComponent as BackIcon } from '../../../../../../src/assets/images/icon-back-arrow.svg'
import { EnvironmentConfig } from '../../../../../config'
import { Button, IconOutline, LoadingSpinner, PageDivider, PaymentForm, profileContext, ProfileContextData } from '../../../../../lib'
import { WorkDetailDetailsPane } from '../../../work-detail-details'
import {
    Challenge,
    ChallengeMetadataName,
    workBugHuntConfig,
    WorkType,
} from '../../../work-lib'
import { ChallengeMetadata, workStoreConfirmCustomerPaymentAsync, workStoreCreateCustomerPaymentAsync, workStoreGetChallengeByWorkId, workStoreUpdateAsync } from '../../../work-lib/work-provider/work-functions/work-store'
import { WorkIntakeFormRoutes } from '../../../work-lib/work-provider/work-functions/work-store/work-intake-form-routes.config'
import { bugHuntConfig } from '../../../work-lib/work-provider/work-functions/work-store/work-type.config'
import { WorkServicePrice } from '../../../work-service-price'
import { WorkTypeBanner } from '../../../work-type-banner'

import styles from './Review.module.scss'

interface FormFieldValues {
    cardComplete: boolean
    country: string
    cvvComplete: boolean
    email: string
    expiryComplete: boolean
    name: string
    orderContract: boolean
    price: string
    zipCode: string
}

const Review: React.FC = () => {
    const workId: string | undefined = useParams().workId
    const redirectUrl: string = WorkIntakeFormRoutes[WorkType.bugHunt]['basicInfo']

    const [challenge, setChallenge]: [Challenge | undefined, Dispatch<SetStateAction<Challenge | undefined>>] = useState()
    const [formData, setFormData]: [any, Dispatch<any>] = useState<any>({})
    const { profile }: ProfileContextData = useContext<ProfileContextData>(profileContext)
    const [formFieldValues, setFormValues]: [FormFieldValues, Dispatch<SetStateAction<FormFieldValues>>] = useState<FormFieldValues>({
        cardComplete: false,
        country: '',
        cvvComplete: false,
        email: '',
        expiryComplete: false,
        name: '',
        orderContract: false,
        price: '',
        zipCode: '',
    })
    const [isLoading, setLoading]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)
    const [isPaymentFailed, setPaymentFailed]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)
    const navigate: NavigateFunction = useNavigate()

    const stripe: Stripe | null = useStripe()
    const elements: StripeElements | null = useElements()

    function findMetadata(metadataName: ChallengeMetadataName): ChallengeMetadata | undefined {
        return challenge?.metadata?.find((item: ChallengeMetadata) => item.name === metadataName)
    }

    useEffect(() => {
        const useEffectAsync: () => Promise<void> = async () => {
            // fetch challenge using workId
            const response: any = await workStoreGetChallengeByWorkId(workId)
            setChallenge(response)
        }

        useEffectAsync()
    }, [workId])

    useEffect(() => {
        setFormValues({
            ...formFieldValues,
            email: profile?.email || '',
            name: `${profile?.firstName} ${profile?.lastName}`,
        })
    }, [profile])

    useEffect(() => {
        if (challenge) {
            const intakeFormBH: any = findMetadata(ChallengeMetadataName.intakeForm)
            const form: any = JSON.parse(intakeFormBH.value).form
            setFormData(form)
            setFormValues({
                ...formFieldValues,
                price: `$${getPrice(form.basicInfo.packageType)}`,
            })
        }

    }, [challenge])

    const onUpdateField: (fieldName: string, value: string | boolean) => void = (fieldName, value) => {
        setFormValues({
            ...formFieldValues,
            [fieldName]: value,
        })
    }

    function getPrice(packageType: string): any {
        return workBugHuntConfig.priceConfig.getPrice(workBugHuntConfig.priceConfig, packageType)
    }

    function renderWorkServicePrice(): JSX.Element {
        return formData.basicInfo && (
            <WorkServicePrice
                duration={workBugHuntConfig.duration}
                hideTitle
                icon={<IconOutline.BadgeCheckIcon width={48} height={48} />}
                price={getPrice(formData.basicInfo.packageType)}
                serviceType={workBugHuntConfig.type}
                showIcon
            />
        )
    }

    function isFormValid(): boolean {
        return formFieldValues.cardComplete
        && formFieldValues.cvvComplete
        && formFieldValues.expiryComplete
        && formFieldValues.orderContract
        && !!formFieldValues.name
        && !!formFieldValues.email
        && !!formFieldValues.zipCode
    }

    function getStartDate(): string {
        let daysToAdd: number = 1
        switch (moment(new Date()).weekday()) {
            case moment().day('Friday').weekday():
                daysToAdd = 3
                break
            case moment().day('Saturday').weekday():
                daysToAdd = 2
                break
            case moment().day('Sunday').weekday():
                daysToAdd = 1
                break
            default:
                daysToAdd = 1
        }

        return moment().add(daysToAdd, 'days').format()
    }

    function activateChallenge(): void {
        if (!challenge) {
            return
        }

        const newDiscussions: Array<{ [key: string]: string }> = [...(challenge.discussions || [])]

        if (newDiscussions.length > 0) {
          newDiscussions[0].name = challenge.name
        } else {
          newDiscussions.push({
            name: challenge.name,
            provider: 'vanilla',
            type: 'challenge',
          })
        }

        const body: any = {
            discussions: [...newDiscussions],
            id: challenge.id,
            startDate: getStartDate(),
            status: 'Draft',
        }

        workStoreUpdateAsync(body)
        .then(() => {
            navigate('/self-service/work/new/bug-hunt/thank-you')
        })

    }

    async function onPay(): Promise<any> {
        if (!stripe || !elements || !challenge) {
            return
        }

        setLoading(true)
        const description: string = `Work Item #${workId}\n${formData.basicInfo.projectTitle.slice(0, 355)}}\n${formData.workType.selectedWorkType}`

        const payload: PaymentMethodResult = await stripe.createPaymentMethod({
            card: elements.getElement(CardNumberElement) as StripeCardNumberElement,
            type: 'card',
        })

        if (!payload) {
            return
        }

        const body: string = JSON.stringify({
            amount: workBugHuntConfig.priceConfig.getPrice(workBugHuntConfig.priceConfig, formData.basicInfo.packageType),
            currency: 'USD',
            description,
            paymentMethodId: payload.paymentMethod && payload.paymentMethod.id,
            receiptEmail: formFieldValues.email,
            reference: 'project',
            referenceId: challenge.projectId?.toString(),
          })

        workStoreCreateCustomerPaymentAsync(body)
        .then(async (response) => {

            if (response.status === 'requires_action') {
                await stripe.handleCardAction(response.clientSecret)
                return workStoreConfirmCustomerPaymentAsync(response.id)
                .then(() => {
                    activateChallenge()
                })
            } else {
                activateChallenge()
            }

        })
        .catch(() => {
            setPaymentFailed(true)
            toastr.error('Error', 'There was an error processing the payment')
        })
        .finally(() => {
            setLoading(false)
        })
    }

    function navigateToBasicInfo(): void {
        navigate(redirectUrl)
    }

    return (
        <div className={styles['review-container']}>
            {
                isLoading && <LoadingSpinner />
            }
            <WorkTypeBanner
                title={bugHuntConfig.review.title}
                subTitle={bugHuntConfig.review.subtitle}
                workType={bugHuntConfig.review.type}
            />

            {renderWorkServicePrice()}

            <div className={styles['content']}>
                <div className={styles['left']}>
                    <WorkDetailDetailsPane formData={formData} isReviewPage={true} redirectUrl={redirectUrl} collapsible={true} defaultOpen={true} />
                </div>
                <div className={styles['right']}>
                    <div className={styles['payment-form-wrapper']}>
                        <div className={styles['form-header']}>
                            <h3 className={styles['price']}>{formFieldValues.price}</h3>
                            <div className={styles['label']}>Total Payment</div>
                        </div>
                        <PaymentForm
                            formData={formFieldValues}
                            onUpdateField={onUpdateField}
                            onPay={onPay}
                            isFormValid={isFormValid()}
                            error={isPaymentFailed}
                        />
                    </div>
                </div>
            </div>

            <div className={styles['button-wrapper']}>
                <PageDivider />
                <Button type='button' buttonStyle='icon-bordered' icon={BackIcon} onClick={navigateToBasicInfo} />
            </div>
        </div>
    )
}

const stripePromise: Promise<Stripe | null> = loadStripe(EnvironmentConfig.STRIPE.API_KEY, {
    apiVersion: EnvironmentConfig.STRIPE.API_VERSION,
})

export default () => (
    <Elements stripe={stripePromise}>
        <Review />
    </Elements>
)
