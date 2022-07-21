import { Elements } from '@stripe/react-stripe-js'
import { loadStripe, Stripe } from '@stripe/stripe-js'
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { EnvironmentConfig } from '../../../../../config'
import { PaymentForm } from '../../../../../lib'
import { WorkDetailDetailsPane } from '../../../work-detail-details'
import {
    Challenge,
    ChallengeMetadataName,
    WorkType,
} from '../../../work-lib'
import { ChallengeMetadata, workStoreGetChallengeByWorkId } from '../../../work-lib/work-provider/work-functions/work-store'
import { WorkIntakeFormRoutes } from '../../../work-lib/work-provider/work-functions/work-store/work-intake-form-routes.config'
import { bugHuntConfig } from '../../../work-lib/work-provider/work-functions/work-store/work-type.config'
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
    let formData: any = {}

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
        if (challenge) {
            const intakeFormBH: any = findMetadata(ChallengeMetadataName.intakeForm)
            formData = JSON.parse(intakeFormBH.value).form
        }

    }, [challenge])

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
