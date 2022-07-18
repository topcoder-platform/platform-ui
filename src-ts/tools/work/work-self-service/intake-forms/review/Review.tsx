import React from 'react'

import { reviewConfig } from '../../../work-lib/work-provider/work-functions/work-store/work-type.config'
import { WorkTypeBanner } from '../../../work-type-banner'

import styles from './Review.module.scss'

const Review: React.FC = () => {
    return (
        <div className={styles['review-container']}>
            <WorkTypeBanner
                title={reviewConfig.title}
                subTitle={reviewConfig.subtitle}
                workType={reviewConfig.type}
            />
            <div></div>
        </div>
    )
}

export default Review
