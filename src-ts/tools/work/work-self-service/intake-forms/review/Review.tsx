import { Elements } from '@stripe/react-stripe-js'
import { loadStripe, Stripe } from '@stripe/stripe-js'
import React, { Dispatch, SetStateAction, useState } from 'react'

import { EnvironmentConfig } from '../../../../../config'
import { PaymentForm } from '../../../../../lib'
import { WorkDetailDetailsPane } from '../../../work-detail-details'
import { bugHuntConfig } from '../../../work-lib/work-provider/work-functions/work-store/work-type.config'
import { WorkTypeBanner } from '../../../work-type-banner'
import IntakeFormsBreadcrumb from '../intake-forms-breadcrumb/IntakeFormsBreadcrumb'

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

    const [formFieldValues, setFormValues]: [FormFieldValues, Dispatch<SetStateAction<FormFieldValues>>] = useState<FormFieldValues>({
        cardComplete: false,
        country: '',
        cvvComplete: false,
        email: 'mail@gmail.com',
        expiryComplete: false,
        name: 'User name',
        orderContract: false,
        price: '$1,899',
        zipCode: '',
    })
    const redirectUrl: string = '/self-service/work/new/bug-hunt/basic-info'
    // This mock will be removed once the basic info is fetched from the challenge API
    const formData: any = {
        basicInfo: {
            additionalInformation: {
                title: 'Additional Information',
                value: '[Description as entered. Lectus vestibulum mattis ullamcorper velit sed. Aliquet sagittis id consectetur purus ut faucibus pulvinar elementum integer. Integer malesuada nunc vel risus commodo viverra maecenas accumsan lacus. Et ultrices neque ornare aenean euismod elementum. Eu feugiat pretium nibh ipsum.Et ultrices neque. Integer malesuada nunc vel risus commodo viverra maecenas accumsan lacus. Et ultrices neque ornare aenean euismod elementum.]',
            },
            deliveryType: {
                title: 'deliveryType',
                value: 'Github',
            },
            deliveryUrl: {
                title: 'deliveryUrl',
                value: 'https://www.github.com',
            },
            features: {
                title: 'Features to test',
                value: '[Description as entered. Lectus vestibulum mattis ullamcorper velit sed. Aliquet sagittis id consectetur purus ut faucibus pulvinar elementum integer. Integer malesuada nunc vel risus commodo viverra maecenas accumsan lacus. Et ultrices neque ornare aenean euismod elementum. Eu feugiat pretium nibh ipsum.Et ultrices neque. Integer malesuada nunc vel risus commodo viverra maecenas accumsan lacus. Et ultrices neque ornare aenean euismod elementum.]',
            },
            goals: {
                title: 'Bug Hunt Goals',
                value: '[Description as entered. Lectus vestibulum mattis ullamcorper velit sed. Aliquet sagittis id consectetur purus ut faucibus pulvinar elementum integer. Integer malesuada nunc vel risus commodo viverra maecenas accumsan lacus. Et ultrices neque ornare aenean euismod elementum. Eu feugiat pretium nibh ipsum.Et ultrices neque. Integer malesuada nunc vel risus commodo viverra maecenas accumsan lacus. Et ultrices neque ornare aenean euismod elementum.]',
            },
            packageType: {
                title: 'Bug hunt Package',
                value: '[Selected package]',
            },
            projectTitle: {
                title: 'Project Title',
                value: 'This is the project title',
            },
            websiteURL: {
                title: 'Website Url',
                value: 'www.example-share-link.com',
            },
        },
        workType: {
            selectedWorkType: 'Website Bug Hunt',
        },
    }

    const onUpdateField: (fieldName: string, value: string | boolean) => void = (fieldName, value) => {
        setFormValues({
            ...formFieldValues,
            [fieldName]: value,
        })
    }

    const isFormValid: boolean = formFieldValues.cardComplete
        && formFieldValues.cvvComplete
        && formFieldValues.expiryComplete
        && formFieldValues.orderContract
        && !!formFieldValues.name
        && !!formFieldValues.email
        && !!formFieldValues.zipCode

    return (
        <div className={styles['review-container']}>
            {/* TODO: use the correct workId for breadcrumb
            Also we need to not hard code the configs to that of BugHunt and instead
            use the challenge data to determine the WorkType */}
            <IntakeFormsBreadcrumb
                basicInfoRoute={`${bugHuntConfig.intakeFormRoutes[1]}/{insert-work-id}`}
                reviewRoute={bugHuntConfig.intakeFormRoutes[6]}
                workType={bugHuntConfig.type}
            />
            <WorkTypeBanner
                title={bugHuntConfig.review.title}
                subTitle={bugHuntConfig.review.subtitle}
                workType={bugHuntConfig.review.type}
            />
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
                        <PaymentForm formData={formFieldValues} onUpdateField={onUpdateField} isFormValid={isFormValid} />
                    </div>
                </div>
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
