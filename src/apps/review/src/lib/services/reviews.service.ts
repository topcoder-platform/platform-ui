/**
 * Reviews service
 */
import {
    adjustChallengeInfo,
    adjustReviewInfo,
    ChallengeInfo,
    ReviewInfo,
} from '../models'
import {
    MockChalenges,
    MockChalengesBugHunt,
    MockChalengesCode,
    MockChalengesCopilotOpportunity,
    MockChalengesDesign,
    MockChalengesFirst2Finish,
    MockChalengesMarathonMatch,
    MockChalengesOther,
    MockChalengesTestSuite,
    MockReviewEdit,
    MockReviewFull,
} from '../../mock-datas'

/**
 * Fetch active reviews
 * @param challengeType challenge type
 * @returns resolves to the array of active reviews
 */
export const fetchActiveReviews = async (
    challengeType: string,
): Promise<ChallengeInfo[]> => {
    const mappingResult: { [key: string]: ChallengeInfo[] } = {
        'Bug Hunt': MockChalengesBugHunt,
        Code: MockChalengesCode,
        'Copilot Opportunity': MockChalengesCopilotOpportunity,
        Design: MockChalengesDesign,
        First2Finish: MockChalengesFirst2Finish,
        'Marathon Match': MockChalengesMarathonMatch,
        Other: MockChalengesOther,
        'Test Suite': MockChalengesTestSuite,
    }
    return Promise.resolve(
        (mappingResult[challengeType] ?? MockChalenges).map(
            (item, index) => adjustChallengeInfo(
                item,
                index + 1,
            ) as ChallengeInfo,
        ),
    )
}

/**
 * Fetch review info
 * @param isEdit is edit ui
 * @returns resolves to the review info
 */
export const fetchReviewInfo = async (isEdit: boolean): Promise<ReviewInfo> => Promise.resolve(
    adjustReviewInfo(
        isEdit ? MockReviewEdit : MockReviewFull,
    ) as ReviewInfo,
)
