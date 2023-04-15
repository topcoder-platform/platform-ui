import { Dispatch, FC, SetStateAction, useContext, useEffect, useState } from 'react'
import { toastr } from 'react-redux-toastr'
import { NavigateFunction, useNavigate, useParams } from 'react-router-dom'

// we need to load this from submodule instead of root
// @see: https://www.npmjs.com/package/@stripe/stripe-js # Importing loadStripe without side effects
// tslint:disable-next-line:no-submodule-imports
import { loadStripe } from '@stripe/stripe-js/pure'
import { CardNumberElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { Stripe, StripeElements } from '@stripe/stripe-js'
import { EnvironmentConfig } from '~/config'
import {
    BackArrowIcon,
    IconOutline,
    InfoCard,
    LoadingSpinner,
    PageDivider,
    UiButton,
    useCheckIsMobile,
} from '~/libs/ui'
import { profileContext, ProfileContextData } from '~/libs/core'

import { WorkDetailDetailsPane } from '../../../components/work-details'
import {
    Challenge,
    ChallengeMetadata,
    ChallengeMetadataName,
    PricePackageName,
    workBugHuntConfig,
    workCreateCustomerPayment,
    workGetByWorkIdAsync,
    WorkIntakeFormRoutes,
    WorkType,
} from '../../../lib'
import { WorkServicePrice } from '../../../components/work-service-price'
import { WorkTypeBanner } from '../../../components/work-type-banner'
import { DeliverablesInfoCard } from '../bug-hunt'
import { IntakeFormsBreadcrumb } from '../intake-forms-breadcrumb'
import { PaymentForm } from '../../../components/payment-form'

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

const Review: FC = () => {

    const { profile: userProfile }: ProfileContextData = useContext<ProfileContextData>(profileContext)

    const workId: string | undefined = useParams().workId
    const redirectUrl: string = `${WorkIntakeFormRoutes[WorkType.bugHunt].basicInfo}/${workId}`

    const [challenge, setChallenge]: [
        Challenge | undefined,
        Dispatch<SetStateAction<Challenge | undefined>>
    ] = useState()
    const [formData, setFormData]: [any, Dispatch<any>] = useState<any>({})
    const { profile }: ProfileContextData = useContext<ProfileContextData>(profileContext)
    // TODO: Move the state into payment form and this would require the onPay handler also moved to payment form
    const [formFieldValues, setFormValues]: [
        FormFieldValues,
        Dispatch<SetStateAction<FormFieldValues>>
    ] = useState<FormFieldValues>({
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

    // TODO: move all references to stripe to a component
    // so that only that one component is aware of the
    // payment provider
    const stripe: Stripe | null = useStripe()
    const elements: StripeElements | null = useElements()

    useEffect(() => {
        async function getAndSetWork(): Promise<void> {
            // fetch challenge using workId
            const response: Challenge = await workGetByWorkIdAsync(workId || '')
            setChallenge(response)
            const intakeFormBH: ChallengeMetadata | undefined = response.metadata
                .find((item: ChallengeMetadata) => item.name === ChallengeMetadataName.intakeForm)
            if (!intakeFormBH) {
                return
            }

            const form: any = JSON.parse(intakeFormBH.value).form
            setFormData(JSON.parse(intakeFormBH.value).form)
            setFormValues({
                ...formFieldValues,
                email: userProfile?.email || '',
                name: `${userProfile?.firstName} ${userProfile?.lastName}`,
                price: `$${getPrice(form.basicInfo.packageType)}`,
            })
        }

        getAndSetWork()
        // Disabling to avoid infite re-renders
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workId])

    useEffect(() => {
        setFormValues({
            ...formFieldValues,
            email: profile?.email || '',
            name: `${profile?.firstName} ${profile?.lastName}`,
        })
        // Disabling to avoid infite re-renders
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile])

    function onUpdateField(fieldName: string, value: string | boolean): void {
        setFormValues({
            ...formFieldValues,
            [fieldName]: value,
        })
    }

    function getDuration(packageType: PricePackageName): number {
        return workBugHuntConfig.duration?.[packageType] || 0
    }

    function getPrice(packageType: string): any {
        return workBugHuntConfig.priceConfig.getPrice(workBugHuntConfig.priceConfig, packageType)
    }

    function renderWorkServicePrice(): JSX.Element {
        return formData.basicInfo && (
            <WorkServicePrice
                duration={getDuration(formData.basicInfo.packageType)}
                hideTitle
                icon={<IconOutline.BadgeCheckIcon width={48} height={48} />}
                iconClass={styles['bug-hunt-icon']}
                price={getPrice(formData.basicInfo.packageType)}
                serviceType={workBugHuntConfig.type}
                showIcon
            />
        )
    }

    // TODO: refactor this form to use the form definition model
    // so that we can handle validation correctly
    function isFormValid(): boolean {
        return formFieldValues.cardComplete
            && formFieldValues.cvvComplete
            && formFieldValues.expiryComplete
            && formFieldValues.orderContract
            && !!formFieldValues.name
            && !!formFieldValues.email
            && !!formFieldValues.zipCode
    }

    async function onPay(): Promise<any> {

        if (!isFormValid()) {
            return
        }

        setLoading(true)

        workCreateCustomerPayment(
            formFieldValues.email,
            workBugHuntConfig.priceConfig,
            formData.basicInfo.projectTitle,
            formData.workType.selectedWorkType,
            elements?.getElement(CardNumberElement),
            challenge,
            formData.basicInfo.packageType,
            stripe,
            workId,
        )
            .then(() => {
                navigate(WorkIntakeFormRoutes[WorkType.bugHunt].thankYou)
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
            <LoadingSpinner hide={!isLoading} type='Overlay' />
            {/* TODO: We need to not hard code the configs to that of BugHunt and instead
            use the challenge data to determine the WorkType */}
            <IntakeFormsBreadcrumb
                basicInfoRoute={`${WorkIntakeFormRoutes[WorkType.bugHunt].basicInfo}/${workId}`}
                reviewRoute={WorkIntakeFormRoutes[WorkType.bugHunt].review}
                workType={workBugHuntConfig.type}
            />
            <WorkTypeBanner
                title={workBugHuntConfig.review.title}
                subTitle={workBugHuntConfig.review.subtitle}
                workType={workBugHuntConfig.review.type}
            />

            {renderWorkServicePrice()}

            <DeliverablesInfoCard isMobile={isMobile} />

            <div className={styles.content}>
                <div className={styles.left}>
                    <WorkDetailDetailsPane
                        formData={formData}
                        isReviewPage
                        redirectUrl={redirectUrl}
                        collapsible
                        defaultOpen
                    />
                    {
                        !isMobile && (
                            <InfoCard
                                color='success'
                                defaultOpen
                                isCollapsible
                                title={workBugHuntConfig.review.aboutYourProjectTitle}
                            >
                                <AboutYourProjectInfoCard />
                            </InfoCard>
                        )
                    }
                </div>
                <div className={styles.right}>
                    {
                        profile && (
                            <div className={styles['payment-form-wrapper']}>
                                <div className={styles['form-header']}>
                                    <h3 className={styles.price}>{formFieldValues.price}</h3>
                                    <div className={styles.label}>Total Payment</div>
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
                <UiButton type='button' secondary icon={BackArrowIcon} onClick={navigateToBasicInfo} />
            </div>
        </div>
    )
}

let stripePromise: Promise<Stripe | null | undefined> | undefined

const output: () => JSX.Element = () => {

    if (!stripePromise) {
        stripePromise = loadStripe(EnvironmentConfig.STRIPE.API_KEY, {
            apiVersion: EnvironmentConfig.STRIPE.API_VERSION,
        })
    }

    return (
        <Elements stripe={stripePromise as Promise<Stripe>}>
            <Review />
        </Elements>
    )
}

export default output
