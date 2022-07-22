import { CardNumberElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe, PaymentMethodResult, Stripe, StripeCardNumberElement, StripeElements } from '@stripe/stripe-js'
import moment from 'moment'
import React, { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react'
import { toastr } from 'react-redux-toastr'
import { NavigateFunction, useNavigate, useParams } from 'react-router-dom'

import { ReactComponent as BackIcon } from '../../../../../../src/assets/images/icon-back-arrow.svg'
import { EnvironmentConfig } from '../../../../../config'
import { Button, IconOutline, InfoCard, LoadingSpinner, PageDivider, PaymentForm, profileContext, ProfileContextData } from '../../../../../lib'
import { useCheckIsMobile } from '../../../../../lib/hooks/use-check-is-mobile.hook'
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
import { DeliverablesInfoCard } from '../bug-hunt/deliverables-info-card'
import IntakeFormsBreadcrumb from '../intake-forms-breadcrumb/IntakeFormsBreadcrumb'

import { AboutYourProjectInfoCard } from './AboutYourProjectInfoCard'
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
    const redirectUrl: string = `${WorkIntakeFormRoutes[WorkType.bugHunt]['basicInfo']}/${workId}`

    const [challenge, setChallenge]: [Challenge | undefined, Dispatch<SetStateAction<Challenge | undefined>>] = useState()
    const [formData, setFormData]: [any, Dispatch<any>] = useState<any>({})
    const { profile }: ProfileContextData = useContext<ProfileContextData>(profileContext)
    // TODO: Move the state into payment form and this would require the onPay handler also moved to payment form
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
    const isMobile: boolean = useCheckIsMobile()

    const stripe: Stripe | null = useStripe()
    const elements: StripeElements | null = useElements()

    useEffect(() => {
        const useEffectAsync: () => Promise<void> = async () => {
            // fetch challenge using workId
            const response: any = await workStoreGetChallengeByWorkId(workId || '')
            setChallenge(response)
            const intakeFormBH: any = response.metadata.find((item: ChallengeMetadata) => item.name === ChallengeMetadataName.intakeForm)
            const form: any = JSON.parse(intakeFormBH.value).form
            setFormData(JSON.parse(intakeFormBH.value).form)
            const { profile: userProfile }: ProfileContextData = useContext<ProfileContextData>(profileContext)
            setFormValues({
                ...formFieldValues,
                email: userProfile?.email || '',
                name: `${userProfile?.firstName} ${userProfile?.lastName}`,
                price: `$${getPrice(form.basicInfo.packageType)}`,
            })
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
            navigate(WorkIntakeFormRoutes[WorkType.bugHunt].thankYou)
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

    // console.log(formFieldValues, profile)

    return (
        <div className={styles['review-container']}>
            {
                isLoading && <LoadingSpinner />
            }
            {/* TODO: We need to not hard code the configs to that of BugHunt and instead
            use the challenge data to determine the WorkType */}
            <IntakeFormsBreadcrumb
                basicInfoRoute={`${WorkIntakeFormRoutes[WorkType.bugHunt]['basicInfo']}/${workId}`}
                reviewRoute={WorkIntakeFormRoutes[WorkType.bugHunt]['review']}
                workType={bugHuntConfig.type}
            />
            <WorkTypeBanner
                title={bugHuntConfig.review.title}
                subTitle={bugHuntConfig.review.subtitle}
                workType={bugHuntConfig.review.type}
            />

            {renderWorkServicePrice()}

            <DeliverablesInfoCard isMobile={isMobile} />

            <div className={styles['content']}>
                <div className={styles['left']}>
                    <WorkDetailDetailsPane formData={formData} isReviewPage={true} redirectUrl={redirectUrl} collapsible={true} defaultOpen={true} />
                    {
                        !isMobile && (
                            <InfoCard
                                color='success'
                                defaultOpen={true}
                                isCollapsible
                                title={workBugHuntConfig.review.aboutYourProjectTitle}
                            >
                                <AboutYourProjectInfoCard />
                            </InfoCard>
                        )
                    }
                </div>
                <div className={styles['right']}>
                    {
                        profile && (
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
                        )
                    }
                    {
                        isMobile && (
                            <InfoCard
                                color='success'
                                defaultOpen={!isMobile}
                                isCollapsible
                                title={workBugHuntConfig.review.aboutYourProjectTitle}
                            >
                                <AboutYourProjectInfoCard />
                            </InfoCard>
                        )
                    }
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
