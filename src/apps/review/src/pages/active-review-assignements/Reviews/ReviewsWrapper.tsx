/**
 * Wrapper component that provides AiScorecardContext for Reviews
 */
import { FC } from 'react'

import { AiScorecardContextProvider } from '../../ai-scorecards/AiScorecardContext'
import Reviews from './Reviews'

const ReviewsWrapper: FC = () => {
    return (
        <AiScorecardContextProvider>
            <Reviews />
        </AiScorecardContextProvider>
    )
}

export default ReviewsWrapper

