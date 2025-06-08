/**
 * Reviews service
 */
import {
    adjustChallengeInfo,
    adjustReviewInfo,
    ChallengeInfo,
    ReviewInfo,
} from '../models'
import { MockChalenges, MockReviewEdit, MockReviewFull } from '../../mock-datas'

/**
 * Fetch active reviews
 * @param challengeType challenge type
 * @returns resolves to the array of active reviews
 */
export const fetchActiveReviews = async (
    challengeType: string,
): Promise<ChallengeInfo[]> => {
    if (challengeType === 'All') {
        return Promise.resolve(
            MockChalenges.map(
                (item, index) => adjustChallengeInfo(item, index + 1) as ChallengeInfo,
            ),
        )
    }

    return Promise.resolve(
        MockChalenges.filter(item => item.type === challengeType)
            .map(
                (item, index) => adjustChallengeInfo(item, index + 1) as ChallengeInfo,
            ),
    )
}

/**
 * Fetch review info
 * @param isEdit is edit ui
 * @returns resolves to the review info
 */
export const fetchReviewInfo = async (isEdit: boolean): Promise<ReviewInfo> => Promise.resolve(
    adjustReviewInfo(isEdit ? MockReviewEdit : MockReviewFull) as ReviewInfo,
)
