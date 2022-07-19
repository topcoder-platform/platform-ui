import React from 'react'

import { bugHuntConfig } from '../../../work-lib/work-provider/work-functions/work-store/work-type.config'
import { WorkTypeBanner } from '../../../work-type-banner'

const Review: React.FC = () => {
    return (
        <div>
            <WorkTypeBanner
                title={bugHuntConfig.review.title}
                subTitle={bugHuntConfig.review.subtitle}
                workType={bugHuntConfig.review.type}
            />
        </div>
    )
}

export default Review
