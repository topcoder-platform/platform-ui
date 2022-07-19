import React from 'react'

import { PaymentForm } from '../../../../../lib'
import { WorkDetailDetailsPane } from '../../../work-detail-details'
import { bugHuntConfig } from '../../../work-lib/work-provider/work-functions/work-store/work-type.config'
import { WorkTypeBanner } from '../../../work-type-banner'

import styles from './Review.module.scss'

const Review: React.FC = () => {
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
            package: {
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
                    <PaymentForm />
                </div>
            </div>
        </div>
    )
}

export default Review
