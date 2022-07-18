import React from 'react'

import { reviewConfig } from '../../../work-lib/work-provider/work-functions/work-store/work-type.config'
import { WorkTypeBanner } from '../../../work-type-banner'

const Review: React.FC = () => {
    console.log(reviewConfig.type)
    return (
        <div>
            <WorkTypeBanner
                title={reviewConfig.title}
                subTitle={reviewConfig.subtitle}
                workType={reviewConfig.type}
            />
        </div>
    )
}

export default Review
