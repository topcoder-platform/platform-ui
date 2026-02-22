import { ReviewInfo, ReviewItemInfo, ScorecardInfo } from '../models'
import { calculateProgressAndScore } from '../components/Scorecard/ScorecardViewer/utils'

const getReviewItemAnswer = (
    reviewItem: ReviewItemInfo,
): string => reviewItem.finalAnswer || reviewItem.initialAnswer || ''

/**
 * Apply an appeal-response answer update to the review model and recompute score/progress locally.
 *
 * @param reviewInfo current review info state.
 * @param reviewItemId id of the review item to update.
 * @param updatedResponse new answer selected while responding to an appeal.
 * @param scorecardInfo scorecard definition used to recompute progress and total score.
 * @returns updated review info with the new answer and recalculated score metadata.
 */
export const applyAppealResponseScoreUpdate = (
    reviewInfo: ReviewInfo | undefined,
    reviewItemId: string,
    updatedResponse: string,
    scorecardInfo?: ScorecardInfo,
): ReviewInfo | undefined => {
    if (!reviewInfo) {
        return reviewInfo
    }

    const reviewItems = reviewInfo.reviewItems.map(reviewItem => (
        reviewItem.id === reviewItemId
            ? {
                ...reviewItem,
                finalAnswer: updatedResponse,
            }
            : reviewItem
    ))

    if (!scorecardInfo) {
        return {
            ...reviewInfo,
            reviewItems,
        }
    }

    const recalculatedScore: ReturnType<typeof calculateProgressAndScore> = calculateProgressAndScore(
        reviewItems.map(reviewItem => ({
            initialAnswer: getReviewItemAnswer(reviewItem),
            scorecardQuestionId: reviewItem.scorecardQuestionId,
        })),
        scorecardInfo,
    )

    return {
        ...reviewInfo,
        finalScore: recalculatedScore.totalScore,
        initialScore: recalculatedScore.totalScore,
        reviewItems,
        reviewProgress: recalculatedScore.reviewProgress,
    }
}
